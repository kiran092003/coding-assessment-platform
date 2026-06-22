const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const judgeRepository = require("../repository/JudgeRepository");
const { publishScoredEvent } = require("../producer/RabbitMQProducer");
const { createLogger } = require("../../shared/logger/logger");
const { increment } = require("../metrics");

const logger = createLogger("judge-service");

const EXEC_TIMEOUT_MS = 5000;
const COMPILE_TIMEOUT_MS = 30000;
const MEMORY_LIMIT_MB = 256;
const isWindows = process.platform === "win32";

// ─── Language alias normalization ─────────────────────────────────────────────

const normalizeLanguage = (lang) => {
    const aliases = {
        JS: "JAVASCRIPT", NODE: "JAVASCRIPT", NODEJS: "JAVASCRIPT",
        PY: "PYTHON", PYTHON3: "PYTHON",
        "C++": "CPP", CPP14: "CPP", CPP17: "CPP", CPP20: "CPP",
        JAVA8: "JAVA", JAVA11: "JAVA", JAVA17: "JAVA", JAVA21: "JAVA",
    };
    const upper = (lang || "").toUpperCase();
    return aliases[upper] || upper;
};

// ─── Docker Configuration ─────────────────────────────────────────────────────

// Custom images built from server/judge-service/docker-images/
// Build: docker build -t judge-cpp ./docker-images/cpp/  (etc.)
// Each image already runs as non-root 'judge' user (set in the Dockerfile).
const DOCKER_IMAGES = {
    JAVASCRIPT: "judge-javascript",
    PYTHON:     "judge-python",
    JAVA:       "judge-java",
    C:          "judge-cpp",   // gcc:13 image has both gcc and g++
    CPP:        "judge-cpp",
};

// Docker Desktop on Windows needs forward-slash paths for volume mounts
const toDockerPath = (p) => isWindows ? p.replace(/\\/g, "/") : p;

// Security flags applied to every execution container
const EXEC_SECURITY_FLAGS = [
    "--network", "none",
    "--memory", `${MEMORY_LIMIT_MB}m`,
    "--memory-swap", `${MEMORY_LIMIT_MB}m`,
    "--cpus", "0.5",
    "--pids-limit", "50",
    "--tmpfs", "/tmp:exec,size=64m",
];

const compileInDocker = (image, compileArgs, tmpDir) => {
    logger.info("Docker compile", { image, cmd: compileArgs.join(" ") });
    return runProcess("docker", [
        "run", "--rm",
        "-v", `${toDockerPath(tmpDir)}:/code`,
        "-w", "/code",
        image,
        ...compileArgs,
    ], tmpDir, null, COMPILE_TIMEOUT_MS);
};

const execInDocker = (image, execArgs, tmpDir, stdinData) => {
    logger.info("Docker exec", { image, cmd: execArgs.join(" ") });
    return runProcess("docker", [
        "run", "-i", "--rm",
        ...EXEC_SECURITY_FLAGS,
        "-v", `${toDockerPath(tmpDir)}:/code`,
        "-w", "/code",
        image,
        ...execArgs,
    ], tmpDir, stdinData, EXEC_TIMEOUT_MS);
};

// ─── Process runner ───────────────────────────────────────────────────────────

const runProcess = (cmd, args, cwd, stdinData, timeoutMs) => {
    return new Promise((resolve) => {
        const start = Date.now();
        const child = spawn(cmd, args, { cwd, shell: false });

        let stdout = "", stderr = "", timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, timeoutMs);

        child.stdout.on("data", (d) => { stdout += d.toString(); });
        child.stderr.on("data", (d) => { stderr += d.toString(); });

        child.on("close", (code) => {
            clearTimeout(timer);
            const executionTimeMs = Date.now() - start;
            if (timedOut)      return resolve({ error: "TIME_LIMIT_EXCEEDED", executionTimeMs });
            if (code === 137)  return resolve({ error: "MEMORY_LIMIT_EXCEEDED", executionTimeMs });
            if (code !== 0)    return resolve({ error: "RUNTIME_ERROR", details: stderr, executionTimeMs });
            resolve({ stdout, executionTimeMs });
        });

        child.on("error", (err) => {
            clearTimeout(timer);
            resolve({ error: "RUNTIME_ERROR", details: err.message, executionTimeMs: Date.now() - start });
        });

        if (stdinData) child.stdin.write(stdinData);
        child.stdin.end();
    });
};

// ─── Output comparison (float-tolerant) ──────────────────────────────────────

const outputsMatch = (actual, expected) => {
    if (actual === expected) return true;
    const a = parseFloat(actual), e = parseFloat(expected);
    if (!isNaN(a) && !isNaN(e) && isFinite(a) && isFinite(e)) {
        return Math.abs(a - e) < 1e-6;
    }
    return false;
};

// ─── hasMain checks ───────────────────────────────────────────────────────────

const hasMain = {
    java:   (src) => /public\s+static\s+void\s+main\s*\(\s*String/.test(src),
    python: (src) => /if\s+__name__\s*==\s*['"]__main__['"]/.test(src),
    c:      (src) => /\bint\s+main\s*\(/.test(src),
    cpp:    (src) => /\bint\s+main\s*\(/.test(src),
};

// ─── Java Wrapper ─────────────────────────────────────────────────────────────

const getClassName = (src) => {
    const m = src.match(/class\s+(\w+)/);
    return m ? m[1] : "Solution";
};

const generateJavaWrapper = (sourceCode) => {
    let src = sourceCode.replace(/\bpublic(\s+class\s+(?!Main)\w+)/g, "$1");
    const className = getClassName(src);
    const methodMatch = src.match(/public\s+([\w\[\]<>, ]+?)\s+(\w+)\s*\(([^)]*)\)/);
    if (!methodMatch) return null;

    const returnType = methodMatch[1].trim();
    const methodName = methodMatch[2];
    const params = methodMatch[3].trim() ? methodMatch[3].split(",").map(p => p.trim()) : [];

    const declarations = params.map((param, i) => {
        if (/int\[\]/.test(param))
            return `String raw${i} = lines[${i}].trim().replaceAll("[\\\\[\\\\]\\\\s]", "");\n` +
                   `        int[] p${i} = raw${i}.isEmpty() ? new int[0] : java.util.Arrays.stream(raw${i}.split(",")).mapToInt(x -> Integer.parseInt(x.trim())).toArray();`;
        if (/String\[\]/.test(param)) return `String[] p${i} = lines[${i}].trim().replaceAll("[\\\\[\\\\]\\\\"]", "").split(",");`;
        if (/double/.test(param))  return `double p${i} = Double.parseDouble(lines[${i}].trim());`;
        if (/long/.test(param))    return `long p${i} = Long.parseLong(lines[${i}].trim());`;
        if (/boolean/.test(param)) return `boolean p${i} = Boolean.parseBoolean(lines[${i}].trim());`;
        if (/int/.test(param))     return `int p${i} = Integer.parseInt(lines[${i}].trim());`;
        return `String p${i} = lines[${i}].trim();`;
    });

    const callArgs = params.map((_, i) => `p${i}`).join(", ");
    let printBlock;
    if (/int\[\]|long\[\]/.test(returnType)) {
        printBlock = `StringBuilder sb = new StringBuilder("[");\n` +
                     `        for (int i = 0; i < result.length; i++) { if (i > 0) sb.append(","); sb.append(result[i]); }\n` +
                     `        sb.append("]"); System.out.println(sb.toString());`;
    } else if (/String\[\]/.test(returnType)) {
        printBlock = `System.out.println(String.join(",", result));`;
    } else if (returnType === "void") {
        printBlock = "";
    } else {
        printBlock = `System.out.println(result);`;
    }
    const callLine = returnType === "void" ? `sol.${methodName}(${callArgs});` : `${returnType} result = sol.${methodName}(${callArgs});`;

    return `import java.util.*;
import java.io.*;

${src}

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lineList = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            if (!line.trim().isEmpty()) lineList.add(line);
        }
        String[] lines = lineList.toArray(new String[0]);

        ${className} sol = new ${className}();
        ${declarations.join("\n        ")}
        ${callLine}
        ${printBlock}
    }
}`;
};

// ─── Python Wrapper ───────────────────────────────────────────────────────────

const generatePythonWrapper = (sourceCode) => {
    const methodMatch = sourceCode.match(
        /def\s+(\w+)\s*\(\s*self\s*(?:,\s*([^)]*))?\s*\)\s*(?:->\s*([\w\[\], |None]+))?\s*:/
    );
    if (!methodMatch) return null;

    const methodName = methodMatch[1];
    const paramsRaw  = (methodMatch[2] || "").trim();
    const returnType = (methodMatch[3] || "").trim();
    const params = paramsRaw ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];

    const parsers = params.map((param, i) => {
        const ann = param.includes(":") ? param.split(":")[1].trim() : "";
        if (/List\[List\[int\]\]|list\[list\[int\]\]/.test(ann))
            return `p${i} = json.loads(lines[${i}])`;
        if (/List\[int\]|list\[int\]/.test(ann))
            return `p${i} = [int(x) for x in lines[${i}].strip().strip('[]').split(',') if x.strip()]`;
        if (/List\[str\]|list\[str\]/.test(ann))
            return `p${i} = [x.strip().strip('"').strip("'") for x in lines[${i}].strip().strip('[]').split(',') if x.strip()]`;
        if (/float/.test(ann))  return `p${i} = float(lines[${i}].strip())`;
        if (/bool/.test(ann))   return `p${i} = lines[${i}].strip().lower() == 'true'`;
        if (/int/.test(ann))    return `p${i} = int(lines[${i}].strip())`;
        if (/str/.test(ann))    return `p${i} = lines[${i}].strip()`;
        return `p${i} = _parse(lines[${i}].strip())`;
    });

    const callArgs  = params.map((_, i) => `p${i}`).join(", ");
    const printResult = returnType === "None" ? "" : "_print_result(result)";

    return `from typing import *
import json
${sourceCode}

import sys as _sys

def _parse(s):
    s = s.strip()
    if s.startswith('['):
        inner = s.strip('[]')
        if not inner: return []
        try: return [int(x.strip()) for x in inner.split(',')]
        except: return [x.strip().strip('"').strip("'") for x in inner.split(',')]
    try: return int(s)
    except:
        try: return float(s)
        except: return s

def _print_result(v):
    if v is None: return
    if isinstance(v, list): print(str(v).replace(' ', ''))
    elif isinstance(v, bool): print(str(v).lower())
    else: print(v)

if __name__ == '__main__':
    lines = [l for l in _sys.stdin.read().splitlines() if l.strip()]
    sol = Solution()
    ${parsers.join("\n    ")}
    result = sol.${methodName}(${callArgs})
    ${printResult}
`;
};

// ─── C++ Wrapper ──────────────────────────────────────────────────────────────

const generateCppWrapper = (sourceCode) => {
    const methodMatch = sourceCode.match(
        /public:\s*[\s\n]*([\w:<>,\s*&]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
    );
    if (!methodMatch) return null;

    const returnType = methodMatch[1].trim();
    const methodName = methodMatch[2];
    const paramsRaw  = methodMatch[3].trim();
    const params = paramsRaw ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];

    const declarations = params.map((param, i) => {
        const clean = param.replace(/&/g, "").replace(/\bconst\b/g, "").trim();
        const lastSpace = clean.lastIndexOf(" ");
        const type = clean.substring(0, lastSpace).trim();

        if (/vector\s*<\s*vector\s*<\s*int/.test(type)) return `auto p${i} = _parseIntMatrix(lines[${i}]);`;
        if (/vector\s*<\s*int\s*>/.test(type))          return `auto p${i} = _parseIntVec(lines[${i}]);`;
        if (/vector\s*<\s*string\s*>/.test(type))        return `auto p${i} = _parseStrVec(lines[${i}]);`;
        if (/long\s+long/.test(type))                    return `long long p${i} = stoll(lines[${i}]);`;
        if (/double/.test(type))                         return `double p${i} = stod(lines[${i}]);`;
        if (/bool/.test(type))                           return `bool p${i} = (lines[${i}] == "true");`;
        if (/string/.test(type))                         return `string p${i} = lines[${i}];`;
        return `int p${i} = stoi(lines[${i}]);`;
    });

    const callArgs = params.map((_, i) => `p${i}`).join(", ");

    let printResult;
    if (/vector\s*<\s*vector\s*<\s*int/.test(returnType)) {
        printResult =
            `cout << "[";\n` +
            `    for (int i = 0; i < (int)result.size(); i++) {\n` +
            `        if (i) cout << ",";\n` +
            `        cout << "[";\n` +
            `        for (int j = 0; j < (int)result[i].size(); j++) { if (j) cout << ","; cout << result[i][j]; }\n` +
            `        cout << "]";\n` +
            `    }\n` +
            `    cout << "]" << endl;`;
    } else if (/vector\s*<\s*int/.test(returnType)) {
        printResult = `cout << "[";\n    for (int i = 0; i < (int)result.size(); i++) { if (i) cout << ","; cout << result[i]; }\n    cout << "]" << endl;`;
    } else if (/vector\s*<\s*string/.test(returnType)) {
        printResult = `cout << "[";\n    for (int i = 0; i < (int)result.size(); i++) { if (i) cout << ","; cout << result[i]; }\n    cout << "]" << endl;`;
    } else if (/bool/.test(returnType)) {
        printResult = `cout << (result ? "true" : "false") << endl;`;
    } else if (/void/.test(returnType)) {
        printResult = "";
    } else {
        printResult = `cout << result << endl;`;
    }

    const callLine = /void/.test(returnType)
        ? `sol.${methodName}(${callArgs});`
        : `auto result = sol.${methodName}(${callArgs});`;

    return `#include <bits/stdc++.h>
using namespace std;

${sourceCode}

vector<int> _parseIntVec(const string& s) {
    vector<int> v; string t = s;
    t.erase(remove(t.begin(), t.end(), '['), t.end());
    t.erase(remove(t.begin(), t.end(), ']'), t.end());
    if (t.empty()) return v;
    stringstream ss(t); string tok;
    while (getline(ss, tok, ',')) if (!tok.empty()) v.push_back(stoi(tok));
    return v;
}

vector<string> _parseStrVec(const string& s) {
    vector<string> v; string t = s;
    t.erase(remove(t.begin(), t.end(), '['), t.end());
    t.erase(remove(t.begin(), t.end(), ']'), t.end());
    t.erase(remove(t.begin(), t.end(), '"'), t.end());
    if (t.empty()) return v;
    stringstream ss(t); string tok;
    while (getline(ss, tok, ',')) if (!tok.empty()) v.push_back(tok);
    return v;
}

vector<vector<int>> _parseIntMatrix(const string& s) {
    vector<vector<int>> mat;
    vector<int> row;
    int num = 0, sign = 1; bool inNum = false;
    for (char c : s) {
        if (c == '[')      { row.clear(); }
        else if (c == ']') { if (inNum) { row.push_back(sign*num); inNum=false; num=0; sign=1; } if (!row.empty() || !mat.empty()) mat.push_back(row); }
        else if (c == ',') { if (inNum) { row.push_back(sign*num); inNum=false; num=0; sign=1; } }
        else if (c == '-') { sign = -1; }
        else if (isdigit(c)) { num = num*10+(c-'0'); inNum = true; }
    }
    return mat;
}

int main() {
    vector<string> lines;
    string line;
    while (getline(cin, line)) if (!line.empty()) lines.push_back(line);

    Solution sol;
    ${declarations.join("\n    ")}
    ${callLine}
    ${printResult}
    return 0;
}`;
};

// ─── C Wrapper ────────────────────────────────────────────────────────────────

const generateCWrapper = (sourceCode) => {
    const funcMatch = sourceCode.match(/^([\w* ]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/m);
    if (!funcMatch || funcMatch[2] === "main") return null;

    const returnType = funcMatch[1].trim();
    const funcName   = funcMatch[2];
    const paramsRaw  = funcMatch[3].trim();
    const params = paramsRaw ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];

    const decls = [], parses = [], callArgs = [];
    let returnSizeVar = null, lastArrayName = null, lineIdx = 0;

    params.forEach((param) => {
        const isPointer  = param.includes("*");
        const name       = param.split(/[\s*]+/).pop();
        const isReturnSz = /returnSize/i.test(name);
        const isSzParam  = /size$/i.test(name) && !isPointer && !isReturnSz;

        if (isReturnSz) {
            returnSizeVar = name;
            decls.push(`int ${name} = 0;`);
            callArgs.push(`&${name}`);
        } else if (isPointer && returnType.includes("*")) {
            lastArrayName = name;
            decls.push(`int ${name}[10000]; int ${name}Cnt = 0;`);
            parses.push(
                `{ char *_p = lines[${lineIdx}]; while(*_p && *_p!='[') _p++; if(*_p) _p++;`,
                `  while(*_p && *_p!=']') { ${name}[${name}Cnt++]=atoi(_p); while(*_p&&*_p!=','&&*_p!=']') _p++; if(*_p==',') _p++; } }`
            );
            lineIdx++;
            callArgs.push(name);
        } else if (isSzParam) {
            callArgs.push(lastArrayName ? `${lastArrayName}Cnt` : "0");
        } else {
            decls.push(`int ${name} = atoi(lines[${lineIdx}]);`);
            lineIdx++;
            callArgs.push(name);
        }
    });

    let printResult;
    if (returnType.includes("*")) {
        printResult = `printf("[");\n    for(int _i=0;_i<${returnSizeVar||"0"};_i++){if(_i)printf(",");printf("%d",result[_i]);}\n    printf("]\\n");\n    free(result);`;
    } else if (returnType === "bool" || returnType === "_Bool") {
        printResult = `printf(result ? "true\\n" : "false\\n");`;
    } else {
        printResult = `printf("%d\\n", result);`;
    }

    const callLine = returnType === "void"
        ? `${funcName}(${callArgs.join(", ")});`
        : `${returnType} result = ${funcName}(${callArgs.join(", ")});`;

    return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${sourceCode}

int main() {
    char lines[32][20000]; int nLines=0, pos=0; int c;
    char buf[20000];
    while ((c=getchar())!=EOF) {
        if (c=='\\n') { buf[pos]='\\0'; if(pos>0){strncpy(lines[nLines++],buf,19999);pos=0;} }
        else buf[pos++]=(char)c;
    }
    if (pos>0) { buf[pos]='\\0'; strncpy(lines[nLines++],buf,19999); }

    ${decls.join("\n    ")}
    ${parses.join("\n    ")}
    ${callLine}
    ${printResult}
    return 0;
}`;
};

// ─── JavaScript Wrapper ───────────────────────────────────────────────────────

const generateJsWrapper = (sourceCode) => {
    let methodName, paramsRaw, isClass = false;

    // Pattern 1: class Solution — find first non-constructor method
    const classBodyMatch = sourceCode.match(/class\s+Solution\s*\{([\s\S]*)/);
    if (classBodyMatch) {
        const body = classBodyMatch[1];
        const methodPattern = /\b(\w+)\s*\(([^)]*)\)\s*\{/g;
        let m;
        while ((m = methodPattern.exec(body)) !== null) {
            if (m[1] !== "constructor" && m[1] !== "Solution") {
                methodName = m[1]; paramsRaw = m[2]; isClass = true;
                break;
            }
        }
    }

    // Pattern 2: var/let/const funcName = function(params)
    if (!methodName) {
        const m = sourceCode.match(/(?:var|let|const)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }

    // Pattern 3: function funcName(params)
    if (!methodName) {
        const m = sourceCode.match(/^function\s+(\w+)\s*\(([^)]*)\)/m);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }

    // Pattern 4: arrow  const funcName = (params) =>
    if (!methodName) {
        const m = sourceCode.match(/(?:var|let|const)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }

    if (!methodName) return null;

    const params   = (paramsRaw || "").trim() ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];
    const parsers  = params.map((_, i) => `const p${i} = _parse(lines[${i}]);`);
    const callArgs = params.map((_, i) => `p${i}`).join(", ");
    const callExpr = isClass
        ? `new Solution().${methodName}(${callArgs})`
        : `${methodName}(${callArgs})`;

    return `${sourceCode}

const _readline = require('readline');
const _rl = _readline.createInterface({ input: process.stdin });
const _lines = [];
_rl.on('line', l => { if (l.trim()) _lines.push(l.trim()); });
_rl.on('close', () => {
    const lines = _lines;
    const _parse = (s) => {
        if (s.startsWith('[')) {
            const inner = s.slice(1, -1);
            if (!inner) return [];
            const nums = inner.split(',').map(x => x.trim());
            const asNums = nums.map(Number);
            return asNums.every(n => !isNaN(n)) ? asNums : nums;
        }
        const n = Number(s);
        return isNaN(n) ? s : n;
    };
    ${parsers.join("\n    ")}
    const result = ${callExpr};
    if (Array.isArray(result)) console.log('[' + result.join(',') + ']');
    else console.log(result);
});
`;
};

// ─── Compile once, return Docker image + exec command ─────────────────────────
// Returns { tmpDir, image, execCmd } on success
// Returns { error, details }         on compile failure

const prepareExecutable = async (language, sourceCode) => {
    const lang   = normalizeLanguage(language);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "judge-"));
    await fs.chmod(tmpDir, 0o777);

    const image = DOCKER_IMAGES[lang];
    if (!image) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        return { error: "RUNTIME_ERROR", details: `Unsupported language: ${language}` };
    }

    try {
        // ── JavaScript ────────────────────────────────────────────────────────
        if (lang === "JAVASCRIPT") {
            const src = generateJsWrapper(sourceCode) || sourceCode;
            await fs.writeFile(path.join(tmpDir, "solution.js"), src);
            return {
                tmpDir, image,
                execCmd: ["node", `--max-old-space-size=${MEMORY_LIMIT_MB}`, "solution.js"],
            };
        }

        // ── Python ────────────────────────────────────────────────────────────
        if (lang === "PYTHON") {
            const src = hasMain.python(sourceCode) ? sourceCode : (generatePythonWrapper(sourceCode) || sourceCode);
            await fs.writeFile(path.join(tmpDir, "solution.py"), src);
            return { tmpDir, image, execCmd: ["python3", "solution.py"] };
        }

        // ── Java ──────────────────────────────────────────────────────────────
        if (lang === "JAVA") {
            let finalSource = sourceCode, mainClass;
            if (hasMain.java(sourceCode)) {
                const m = sourceCode.match(/public\s+class\s+(\w+)/);
                mainClass = m ? m[1] : "Main";
            } else {
                finalSource = generateJavaWrapper(sourceCode);
                if (!finalSource) {
                    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
                    return { error: "COMPILATION_ERROR", details: "Could not parse Java method signature." };
                }
                mainClass = "Main";
            }
            await fs.writeFile(path.join(tmpDir, `${mainClass}.java`), finalSource);

            const compile = await compileInDocker(image, ["javac", `${mainClass}.java`], tmpDir);
            if (compile.error) {
                await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
                return { error: "COMPILATION_ERROR", details: compile.details || compile.error };
            }
            return {
                tmpDir, image,
                execCmd: ["java", `-Xmx${MEMORY_LIMIT_MB}m`, "-cp", ".", mainClass],
            };
        }

        // ── C ─────────────────────────────────────────────────────────────────
        if (lang === "C") {
            const src = hasMain.c(sourceCode) ? sourceCode : (generateCWrapper(sourceCode) || sourceCode);
            await fs.writeFile(path.join(tmpDir, "solution.c"), src);

            const compile = await compileInDocker(image, ["sh", "-c", "gcc solution.c -o solution -lm && chmod 777 solution"], tmpDir);
            if (compile.error) {
                await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
                return { error: "COMPILATION_ERROR", details: compile.details };
            }
            return { tmpDir, image, execCmd: ["sh", "-c", "cp /code/solution /tmp/sol && /tmp/sol"] };
        }

        // ── C++ ───────────────────────────────────────────────────────────────
        if (lang === "CPP") {
            const src = hasMain.cpp(sourceCode) ? sourceCode : (generateCppWrapper(sourceCode) || sourceCode);
            await fs.writeFile(path.join(tmpDir, "solution.cpp"), src);

            const compile = await compileInDocker(image, ["sh", "-c", "g++ solution.cpp -o solution -std=c++17 && chmod 777 solution"], tmpDir);
            if (compile.error) {
                await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
                return { error: "COMPILATION_ERROR", details: compile.details };
            }
            return { tmpDir, image, execCmd: ["sh", "-c", "cp /code/solution /tmp/sol && /tmp/sol"] };
        }

        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        return { error: "RUNTIME_ERROR", details: `Unsupported language: ${language}` };

    } catch (err) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        throw err;
    }
};

// ─── Judge Orchestrator ───────────────────────────────────────────────────────

const judgeSubmission = async ({ submissionId, userId, questionId, language, sourceCode, contestId }) => {
    logger.info("Judging submission", { submissionId, language, questionId, userId });

    try {
        await judgeRepository.updateSubmissionStatus(submissionId, "RUNNING", 0, 0, 0);

        const testCases = await judgeRepository.getTestCasesByQuestionId(questionId);
        const total = testCases.length;

        if (total === 0) {
            await judgeRepository.updateSubmissionStatus(submissionId, "ACCEPTED", 0, 0, 0);
            logger.info("Verdict published", { submissionId, verdict: "ACCEPTED", reason: "no test cases" });
            increment("submissionsProcessed");
            return;
        }

        const prepared = await prepareExecutable(language, sourceCode);

        if (prepared.error) {
            const verdict = prepared.error === "COMPILATION_ERROR" ? "COMPILATION_ERROR" : "RUNTIME_ERROR";
            logger.warn("Compilation/setup failed", { submissionId, verdict, details: prepared.details });
            await judgeRepository.updateSubmissionStatus(submissionId, verdict, 0, total, 0);
            increment("submissionsProcessed");
            return;
        }

        let passed = 0, totalExecTime = 0, finalStatus = "ACCEPTED";

        try {
            for (const tc of testCases) {
                const result = await execInDocker(
                    prepared.image,
                    prepared.execCmd,
                    prepared.tmpDir,
                    tc.input_data || ""
                );

                if (result.error === "TIME_LIMIT_EXCEEDED") {
                    finalStatus = "TIME_LIMIT_EXCEEDED";
                    logger.warn("Test TLE", { submissionId, testCaseId: tc.id });
                    break;
                }
                if (result.error === "MEMORY_LIMIT_EXCEEDED") {
                    finalStatus = "MEMORY_LIMIT_EXCEEDED";
                    logger.warn("Test MLE", { submissionId, testCaseId: tc.id });
                    break;
                }
                if (result.error === "RUNTIME_ERROR") {
                    finalStatus = "RUNTIME_ERROR";
                    logger.warn("Test runtime error", { submissionId, testCaseId: tc.id, details: result.details });
                    break;
                }

                totalExecTime += result.executionTimeMs || 0;

                const actual   = (result.stdout || "").trim().replace(/\r\n/g, "\n");
                const expected = (tc.expected_output || "").trim().replace(/\r\n/g, "\n");

                if (outputsMatch(actual, expected)) {
                    passed++;
                    logger.info("Test passed", { submissionId, testCaseId: tc.id });
                } else {
                    // Don't break — run all test cases for partial scoring
                    finalStatus = "WRONG_ANSWER";
                    logger.info("Test wrong answer", { submissionId, testCaseId: tc.id, expected, got: actual });
                }
            }
        } finally {
            await fs.rm(prepared.tmpDir, { recursive: true, force: true }).catch(() => {});
        }

        await judgeRepository.updateSubmissionStatus(submissionId, finalStatus, passed, total, totalExecTime);
        logger.info("Verdict published", { submissionId, verdict: finalStatus, passed, total, execTimeMs: totalExecTime });
        increment("submissionsProcessed");

        // Publish to leaderboard service for any contest submission with at least 1 passed testcase
        if (contestId && passed > 0) {
            await publishScoredEvent({ contestId, userId, questionId, submissionId, passedTestCases: passed, totalTestCases: total });
        }

    } catch (error) {
        logger.error("Unexpected error judging submission", { submissionId, error: error.message, stack: error.stack });
        try { await judgeRepository.updateSubmissionStatus(submissionId, "RUNTIME_ERROR", 0, 0, 0); } catch {}
    }
};

// ─── Synchronous run (no DB, sample test cases only) ─────────────────────────

const runCode = async (language, sourceCode, testCases) => {
    const prepared = await prepareExecutable(language, sourceCode);

    if (prepared.error) {
        return {
            status: prepared.error,
            passed: 0,
            total: testCases.length,
            execution_time_ms: 0,
            detail: prepared.details || null,
        };
    }

    let passed = 0, totalExecTime = 0, status = "ACCEPTED";

    try {
        for (const tc of testCases) {
            const result = await execInDocker(
                prepared.image,
                prepared.execCmd,
                prepared.tmpDir,
                tc.input_data || ""
            );

            if (result.error) {
                status = result.error; // TIME_LIMIT_EXCEEDED / RUNTIME_ERROR etc.
                break;
            }

            totalExecTime += result.executionTimeMs || 0;

            const actual   = (result.stdout || "").trim().replace(/\r\n/g, "\n");
            const expected = (tc.expected_output || "").trim().replace(/\r\n/g, "\n");

            if (outputsMatch(actual, expected)) {
                passed++;
            } else {
                status = "WRONG_ANSWER";
            }
        }
    } finally {
        await fs.rm(prepared.tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    return { status, passed, total: testCases.length, execution_time_ms: totalExecTime };
};

module.exports = { judgeSubmission, runCode };
