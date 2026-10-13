const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const judgeRepository = require("../repository/JudgeRepository");
const { publishScoredEvent } = require("../producer/RabbitMQProducer");
const { createLogger } = require("../../shared/logger/logger");
const { KIND, planParams } = require("../lib/paramPlan");
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

/* Two output styles exist in the question bank: sequences written the
   competitive way ("0 1") and the LeetCode way ("[0,1]"). Normalising
   brackets and commas to spaces lets either form satisfy either expectation,
   while newlines stay significant so a matrix still has to have the right
   shape. */
const normaliseOutput = (text) =>
    String(text)
        .replace(/\r\n/g, "\n")
        .replace(/[[\],"]/g, " ")
        .split("\n")
        .map(line => line.trim().replace(/[ \t]+/g, " "))
        .join("\n")
        .trim();

const outputsMatch = (actual, expected) => {
    if (actual === expected) return true;

    const na = normaliseOutput(actual);
    const ne = normaliseOutput(expected);
    if (na === ne) return true;

    // Single numbers compare with a tolerance taken from however many
    // decimals the expected value carries, so a solution that prints
    // 33.63636364 still matches an expected 33.6364.
    const a = parseFloat(na), e = parseFloat(ne);
    if (!isNaN(a) && !isNaN(e) && isFinite(a) && isFinite(e) &&
        !/\s/.test(na) && !/\s/.test(ne)) {
        const decimals = (ne.split(".")[1] || "").length;
        const tolerance = decimals > 0 ? 0.5 * Math.pow(10, -decimals) + 1e-9 : 1e-6;
        return Math.abs(a - e) <= tolerance;
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

/* Maps a Java type onto the C++ spelling planParams understands. */
const JAVA_TO_CPP = (type) => {
    if (/int\s*\[\s*\]\s*\[\s*\]/.test(type)) return "vector<vector<int>>";
    if (/int\s*\[\s*\]/.test(type))           return "vector<int>";
    if (/String\s*\[\s*\]/.test(type))        return "vector<string>";
    if (/\bdouble\b|\bfloat\b/.test(type))    return "double";
    if (/\bboolean\b/.test(type))             return "bool";
    if (/\blong\b/.test(type))                return "long long";
    if (/\bchar\b/.test(type))                return "char";
    if (/\bString\b/.test(type))              return "string";
    return "int";
};

const generateJavaWrapper = (sourceCode) => {
    let src = sourceCode.replace(/\bpublic(\s+class\s+(?!Main)\w+)/g, "$1");
    const methodMatch = src.match(/public\s+([\w\[\]<>, ]+?)\s+(\w+)\s*\(([^)]*)\)/);
    if (!methodMatch) return null;

    const returnType = methodMatch[1].trim();
    const methodName = methodMatch[2];
    const rawParams  = methodMatch[3].trim() ? methodMatch[3].split(",").map(p => p.trim()) : [];

    // "int[] arr" -> "vector<int> arr"
    const normalised = rawParams.map((prm) => {
        const bits = prm.trim().split(/\s+/);
        const name = bits[bits.length - 1];
        const type = bits.slice(0, -1).join(" ");
        return JAVA_TO_CPP(type) + " " + name;
    });
    const plan = planParams(normalised);

    const sizeExpr = (spec, tail) => {
        if (!spec) return "0";
        if (spec.from !== undefined) return "(int) p" + spec.from;
        return "(_left() - " + (tail || 0) + ")";
    };

    const declarations = plan.map((prm) => {
        const v = "p" + prm.index;
        switch (prm.kind) {
            case KIND.LONG:   return "long " + v + " = Long.parseLong(_next());";
            case KIND.DOUBLE: return "double " + v + " = Double.parseDouble(_next());";
            case KIND.BOOL:   return "boolean " + v + " = Boolean.parseBoolean(_next());";
            case KIND.CHAR:   return "char " + v + " = _next().charAt(0);";
            case KIND.STRING: return "String " + v + " = _next();";
            case KIND.VEC_INT:
                return "int _k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + ";\n        " +
                       "int[] " + v + " = new int[_k" + prm.index + "];\n        " +
                       "for (int _i = 0; _i < _k" + prm.index + "; _i++) " + v + "[_i] = Integer.parseInt(_next());";
            case KIND.VEC_STR:
                return "int _k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + ";\n        " +
                       "String[] " + v + " = new String[_k" + prm.index + "];\n        " +
                       "for (int _i = 0; _i < _k" + prm.index + "; _i++) " + v + "[_i] = _next();";
            case KIND.MATRIX: {
                const rows = sizeExpr(prm.rows, prm.tailScalars);
                const cols = prm.cols && prm.cols.from !== undefined
                    ? "(int) p" + prm.cols.from
                    : "(_r" + prm.index + " > 0 ? _left() / _r" + prm.index + " : 0)";
                return "int _r" + prm.index + " = " + rows + ";\n        " +
                       "int _c" + prm.index + " = " + cols + ";\n        " +
                       "int[][] " + v + " = new int[_r" + prm.index + "][_c" + prm.index + "];\n        " +
                       "for (int _i = 0; _i < _r" + prm.index + "; _i++) for (int _j = 0; _j < _c" + prm.index + "; _j++) " +
                       v + "[_i][_j] = Integer.parseInt(_next());";
            }
            default: return "int " + v + " = Integer.parseInt(_next());";
        }
    });

    const callArgs = plan.map(prm => "p" + prm.index).join(", ");

    let printBlock;
    if (/int\s*\[\s*\]\s*\[\s*\]/.test(returnType)) {
        printBlock =
            "for (int[] _row : result) {\n" +
            "            StringBuilder sb = new StringBuilder();\n" +
            "            for (int _i = 0; _i < _row.length; _i++) { if (_i > 0) sb.append(' '); sb.append(_row[_i]); }\n" +
            "            System.out.println(sb.toString());\n" +
            "        }";
    } else if (/int\s*\[\s*\]|long\s*\[\s*\]/.test(returnType)) {
        printBlock =
            "StringBuilder sb = new StringBuilder();\n" +
            "        for (int _i = 0; _i < result.length; _i++) { if (_i > 0) sb.append(' '); sb.append(result[_i]); }\n" +
            "        System.out.println(sb.toString());";
    } else if (/String\s*\[\s*\]/.test(returnType)) {
        printBlock = "System.out.println(String.join(\" \", result));";
    } else if (/\bvoid\b/.test(returnType)) {
        printBlock = "";
    } else {
        printBlock = "System.out.println(result);";
    }

    const callLine = /\bvoid\b/.test(returnType)
        ? "new Solution()." + methodName + "(" + callArgs + ");"
        : returnType + " result = new Solution()." + methodName + "(" + callArgs + ");";

    return `import java.util.*;
import java.io.*;

${src}

public class Main {
    static String[] _tok;
    static int _at = 0;

    static String _next() { return _at < _tok.length ? _tok[_at++] : ""; }
    static int _left() { return Math.max(0, _tok.length - _at); }

    public static void main(String[] args) throws IOException {
        // Whole of stdin as one token stream; brackets and commas separate.
        ByteArrayOutputStream _buf = new ByteArrayOutputStream();
        byte[] _chunk = new byte[8192];
        int _n;
        while ((_n = System.in.read(_chunk)) > 0) _buf.write(_chunk, 0, _n);
        String _raw = _buf.toString("UTF-8").replaceAll("[\\\\[\\\\],\\"]", " ");
        _tok = _raw.trim().isEmpty() ? new String[0] : _raw.trim().split("\\\\s+");

        ${declarations.join("\n        ")}
        ${callLine}
        ${printBlock}
    }
}`;
};

const PY_TO_CPP = (ann) => {
    if (/list\s*\[\s*list\s*\[\s*int/i.test(ann)) return "vector<vector<int>>";
    if (/list\s*\[\s*int/i.test(ann))             return "vector<int>";
    if (/list\s*\[\s*str/i.test(ann))             return "vector<string>";
    if (/float/i.test(ann))                        return "double";
    if (/bool/i.test(ann))                         return "bool";
    if (/str/i.test(ann))                          return "string";
    return "int";
};

const generatePythonWrapper = (sourceCode) => {
    const methodMatch = sourceCode.match(
        /def\s+(\w+)\s*\(\s*self\s*(?:,\s*([^)]*))?\s*\)\s*(?:->\s*([\w\[\], |None]+))?\s*:/
    );
    if (!methodMatch) return null;

    const methodName = methodMatch[1];
    const paramsRaw  = (methodMatch[2] || "").trim();
    const returnType = (methodMatch[3] || "").trim();
    const rawParams  = paramsRaw ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];

    // "arr: list[int]" -> "vector<int> arr"
    const normalised = rawParams.map((prm) => {
        const parts = prm.includes(":") ? prm.split(":") : [prm, ""];
        const name = parts[0].trim();
        const ann  = (parts[1] || "").trim();
        return PY_TO_CPP(ann) + " " + name;
    });
    const plan = planParams(normalised);

    const sizeExpr = (spec, tail) => {
        if (!spec) return "0";
        if (spec.from !== undefined) return "p" + spec.from;
        return "(_left() - " + (tail || 0) + ")";
    };

    const declarations = plan.map((prm) => {
        const v = "p" + prm.index;
        switch (prm.kind) {
            case KIND.DOUBLE: return v + " = float(_next())";
            case KIND.BOOL:   return v + " = _next().lower() == 'true'";
            case KIND.STRING: return v + " = _next()";
            case KIND.CHAR:   return v + " = _next()[:1]";
            case KIND.VEC_INT:
                return "_k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + "\n    " +
                       v + " = [int(_next()) for _ in range(_k" + prm.index + ")]";
            case KIND.VEC_STR:
                return "_k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + "\n    " +
                       v + " = [_next() for _ in range(_k" + prm.index + ")]";
            case KIND.MATRIX: {
                const rows = sizeExpr(prm.rows, prm.tailScalars);
                const cols = prm.cols && prm.cols.from !== undefined
                    ? "p" + prm.cols.from
                    : "(_left() // _r" + prm.index + " if _r" + prm.index + " else 0)";
                return "_r" + prm.index + " = " + rows + "\n    " +
                       "_c" + prm.index + " = " + cols + "\n    " +
                       v + " = [[int(_next()) for _ in range(_c" + prm.index + ")] for _ in range(_r" + prm.index + ")]";
            }
            default: return v + " = int(_next())";
        }
    });

    const callArgs = plan.map(prm => "p" + prm.index).join(", ");
    const printResult = returnType === "None" ? "" : "_print_result(result)";

    return `from typing import *
${sourceCode}

import sys as _sys

_raw = _sys.stdin.read()
for _ch in '[],"':
    _raw = _raw.replace(_ch, ' ')
_tok = _raw.split()
_at = 0

def _next():
    global _at
    v = _tok[_at] if _at < len(_tok) else ''
    _at += 1
    return v

def _left():
    return max(0, len(_tok) - _at)

def _print_result(v):
    if v is None:
        return
    if isinstance(v, bool):
        print(str(v).lower())
    elif isinstance(v, list):
        if v and isinstance(v[0], list):
            for _row in v:
                print(' '.join(str(x) for x in _row))
        else:
            print(' '.join(str(x) for x in v))
    else:
        print(v)

if __name__ == '__main__':
    sol = Solution()
    ${declarations.join("\n    ")}
    result = sol.${methodName}(${callArgs})
    ${printResult}
`;
};

const generateCppWrapper = (sourceCode) => {
    const methodMatch = sourceCode.match(
        /public:\s*[\s\n]*([\w:<>,\s*&]+?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
    );
    if (!methodMatch) return null;

    const returnType = methodMatch[1].trim();
    const methodName = methodMatch[2];
    const paramsRaw  = methodMatch[3].trim();
    const rawParams  = paramsRaw ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean) : [];
    const plan = planParams(rawParams);

    const sizeExpr = (spec, tailScalars) => {
        if (!spec) return "0";
        if (spec.from !== undefined) return `(int)p${spec.from}`;
        return `(int)(_left() - ${tailScalars || 0})`;
    };

    const declarations = plan.map((p) => {
        const v = `p${p.index}`;
        switch (p.kind) {
            case KIND.LONG:   return `long long ${v} = _nextLL();`;
            case KIND.DOUBLE: return `double ${v} = _nextD();`;
            case KIND.BOOL:   return `bool ${v} = _nextBool();`;
            case KIND.CHAR:   return `char ${v} = _nextTok()[0];`;
            case KIND.STRING: return `string ${v} = _nextTok();`;
            case KIND.VEC_INT:
                return `int _k${p.index} = ${sizeExpr(p.size, p.tailScalars)};\n    ` +
                       `vector<int> ${v}; for (int _i = 0; _i < _k${p.index}; _i++) ${v}.push_back((int)_nextLL());`;
            case KIND.VEC_STR:
                return `int _k${p.index} = ${sizeExpr(p.size, p.tailScalars)};\n    ` +
                       `vector<string> ${v}; for (int _i = 0; _i < _k${p.index}; _i++) ${v}.push_back(_nextTok());`;
            case KIND.MATRIX: {
                const rows = sizeExpr(p.rows, p.tailScalars);
                const cols = p.cols && p.cols.from !== undefined
                    ? `(int)p${p.cols.from}`
                    : `(_r${p.index} > 0 ? (int)(_left() / _r${p.index}) : 0)`;
                return `int _r${p.index} = ${rows};\n    ` +
                       `int _c${p.index} = ${cols};\n    ` +
                       `vector<vector<int>> ${v};\n    ` +
                       `for (int _i = 0; _i < _r${p.index}; _i++) { vector<int> _row; ` +
                       `for (int _j = 0; _j < _c${p.index}; _j++) _row.push_back((int)_nextLL()); ${v}.push_back(_row); }`;
            }
            default: return `int ${v} = (int)_nextLL();`;
        }
    });

    const callArgs = plan.map(p => `p${p.index}`).join(", ");

    /* Sequences print space-separated and matrices one row per line, matching
       how the expected outputs are stored. The comparison also normalises
       brackets and commas, so a "[0,1]" style answer still matches. */
    let printResult;
    if (/vector\s*<\s*vector\s*<\s*int/.test(returnType)) {
        printResult =
            `for (size_t i = 0; i < result.size(); i++) {\n` +
            `        for (size_t j = 0; j < result[i].size(); j++) { if (j) cout << ' '; cout << result[i][j]; }\n` +
            `        cout << endl;\n` +
            `    }`;
    } else if (/vector\s*<\s*(int|string)/.test(returnType)) {
        printResult = `for (size_t i = 0; i < result.size(); i++) { if (i) cout << ' '; cout << result[i]; }\n    cout << endl;`;
    } else if (/bool/.test(returnType)) {
        printResult = `cout << (result ? "true" : "false") << endl;`;
    } else if (/double|float/.test(returnType)) {
        printResult = `cout << setprecision(10) << result << endl;`;
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

static vector<string> _tok;
static size_t _at = 0;

static size_t _left() { return _tok.size() - _at; }
static string _nextTok() { return _at < _tok.size() ? _tok[_at++] : string(); }
static long long _nextLL() { string t = _nextTok(); return t.empty() ? 0LL : stoll(t); }
static double _nextD() { string t = _nextTok(); return t.empty() ? 0.0 : stod(t); }
static bool _nextBool() { string t = _nextTok(); return t == "true" || t == "1"; }

int main() {
    // Read the whole of stdin as one token stream. Brackets, commas and quotes
    // are separators, so "[2,7,11,15]" and "2 7 11 15" parse identically.
    string _all((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    for (char& c : _all) if (c == '[' || c == ']' || c == ',' || c == '"') c = ' ';
    {
        stringstream _ss(_all); string _t;
        while (_ss >> _t) _tok.push_back(_t);
    }

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
    if (!methodName) {
        const m = sourceCode.match(/(?:var|let|const)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }
    if (!methodName) {
        const m = sourceCode.match(/^function\s+(\w+)\s*\(([^)]*)\)/m);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }
    if (!methodName) {
        const m = sourceCode.match(/(?:var|let|const)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
        if (m) { methodName = m[1]; paramsRaw = m[2]; }
    }
    if (!methodName) return null;

    const names = (paramsRaw || "").trim()
        ? paramsRaw.split(",").map(p => p.trim()).filter(Boolean)
        : [];

    /* JavaScript carries no types in the signature, so the sizes come from the
       JSDoc the starter template provides (`@param {number[]} arr`). Without
       it every parameter is read as a single token, which is right for the
       scalar-only problems and the best that can be inferred otherwise. */
    const jsdoc = new Map();
    const docPattern = /@param\s*\{([^}]+)\}\s*(\w+)/g;
    let d;
    while ((d = docPattern.exec(sourceCode)) !== null) jsdoc.set(d[2], d[1]);

    /* Parameter names used by the question bank for collections. JavaScript
       signatures carry no types, so when the JSDoc has been deleted these
       names are the only signal left that something is a sequence. */
    const COLLECTION_NAMES = new Set([
        "arr", "nums", "a", "b", "words", "tokens", "keys", "prices", "heights",
        "coins", "intervals", "meetings", "edges", "queries", "grid", "matrix",
    ]);
    const MATRIX_NAMES = new Set(["grid", "matrix", "edges", "intervals", "meetings", "queries"]);

    const JS_TO_CPP = (t, name) => {
        if (!t) {
            if (MATRIX_NAMES.has(name)) return "vector<vector<int>>";
            if (COLLECTION_NAMES.has(name)) return "vector<int>";
            return "int";
        }
        if (/\[\s*\]\s*\[\s*\]|number\[\]\[\]/.test(t)) return "vector<vector<int>>";
        if (/string\s*\[\s*\]/i.test(t))                return "vector<string>";
        if (/\[\s*\]/.test(t))                          return "vector<int>";
        if (/boolean/i.test(t))                         return "bool";
        if (/string/i.test(t))                          return "string";
        return "int";
    };

    const plan = planParams(names.map(n => JS_TO_CPP(jsdoc.get(n), n) + " " + n));

    const sizeExpr = (spec, tail) => {
        if (!spec) return "0";
        if (spec.from !== undefined) return "p" + spec.from;
        return "(_left() - " + (tail || 0) + ")";
    };

    const declarations = plan.map((prm) => {
        const v = "const p" + prm.index;
        switch (prm.kind) {
            case KIND.DOUBLE: return v + " = Number(_next());";
            case KIND.BOOL:   return v + " = _next() === 'true';";
            case KIND.STRING:
            case KIND.CHAR:   return v + " = _next();";
            case KIND.VEC_INT:
                return "const _k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + ";\n" +
                       v + " = Array.from({ length: _k" + prm.index + " }, () => Number(_next()));";
            case KIND.VEC_STR:
                return "const _k" + prm.index + " = " + sizeExpr(prm.size, prm.tailScalars) + ";\n" +
                       v + " = Array.from({ length: _k" + prm.index + " }, () => _next());";
            case KIND.MATRIX: {
                const rows = sizeExpr(prm.rows, prm.tailScalars);
                const cols = prm.cols && prm.cols.from !== undefined
                    ? "p" + prm.cols.from
                    : "(_r" + prm.index + " > 0 ? Math.floor(_left() / _r" + prm.index + ") : 0)";
                return "const _r" + prm.index + " = " + rows + ";\n" +
                       "const _c" + prm.index + " = " + cols + ";\n" +
                       v + " = Array.from({ length: _r" + prm.index + " }, () => " +
                       "Array.from({ length: _c" + prm.index + " }, () => Number(_next())));";
            }
            default: return v + " = Number(_next());";
        }
    });

    const callArgs = plan.map(prm => "p" + prm.index).join(", ");
    const callExpr = isClass
        ? "new Solution()." + methodName + "(" + callArgs + ")"
        : methodName + "(" + callArgs + ")";

    return `${sourceCode}

const _raw = require('fs').readFileSync(0, 'utf8').replace(/[\\[\\],"]/g, ' ');
const _tok = _raw.split(/\\s+/).filter(Boolean);
let _at = 0;
const _next = () => (_at < _tok.length ? _tok[_at++] : '');
const _left = () => Math.max(0, _tok.length - _at);

${declarations.join("\n")}

const _result = ${callExpr};

if (_result !== undefined && _result !== null) {
    if (Array.isArray(_result)) {
        if (_result.length && Array.isArray(_result[0])) {
            console.log(_result.map(r => r.join(' ')).join('\\n'));
        } else {
            console.log(_result.join(' '));
        }
    } else if (typeof _result === 'boolean') {
        console.log(_result ? 'true' : 'false');
    } else {
        console.log(_result);
    }
}
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

/**
 * Runs the code against the given cases and reports each one individually.
 *
 * Only ever called with sample cases, whose inputs and expected outputs the
 * solver can already see on the problem page — so returning the actual output
 * alongside them reveals nothing new, and is what makes a failure diagnosable.
 */
const runCode = async (language, sourceCode, testCases) => {
    const prepared = await prepareExecutable(language, sourceCode);

    if (prepared.error) {
        return {
            status: prepared.error,
            passed: 0,
            total: testCases.length,
            execution_time_ms: 0,
            detail: prepared.details || null,
            results: [],
        };
    }

    let passed = 0, totalExecTime = 0, status = "ACCEPTED";
    const results = [];

    try {
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const result = await execInDocker(
                prepared.image,
                prepared.execCmd,
                prepared.tmpDir,
                tc.input_data || ""
            );

            const expected = (tc.expected_output || "").trim().replace(/\r\n/g, "\n");

            if (result.error) {
                status = result.error; // TIME_LIMIT_EXCEEDED / RUNTIME_ERROR etc.
                results.push({
                    index: i + 1,
                    input: tc.input_data || "",
                    expected,
                    actual: null,
                    error: result.error,
                    detail: result.details || null,
                    passed: false,
                    execution_time_ms: result.executionTimeMs || 0,
                });
                break;
            }

            totalExecTime += result.executionTimeMs || 0;

            const actual = (result.stdout || "").trim().replace(/\r\n/g, "\n");
            const ok = outputsMatch(actual, expected);

            if (ok) passed++;
            else status = "WRONG_ANSWER";

            results.push({
                index: i + 1,
                input: tc.input_data || "",
                expected,
                actual,
                error: null,
                detail: null,
                passed: ok,
                execution_time_ms: result.executionTimeMs || 0,
            });
        }
    } finally {
        await fs.rm(prepared.tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    return { status, passed, total: testCases.length, execution_time_ms: totalExecTime, results };
};

module.exports = { judgeSubmission, runCode };
