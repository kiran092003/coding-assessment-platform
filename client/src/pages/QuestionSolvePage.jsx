import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { MONACO_THEME, registerMonacoTheme, monacoOptions } from '@/lib/monacoTheme'
import { format } from 'date-fns'
import { useQuestion } from '@/features/questions/hooks/useQuestions'
import { useTestCases } from '@/features/testcases/hooks/useTestCases'
import { useSubmitCode, useRunCode, useMySubmissions } from '@/features/submissions/hooks/useSubmissions'
import Badge from '@/components/ui/Badge'
import Markdown from '@/components/ui/Markdown'
import Spinner from '@/components/ui/Spinner'
import ResultPanel from '@/components/ui/ResultPanel'

const LANGUAGES = ['CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'C']
const MONACO_LANG = { C: 'c', CPP: 'cpp', JAVA: 'java', PYTHON: 'python', JAVASCRIPT: 'javascript' }

const toFunctionName = (title = '') =>
  title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/).filter(Boolean)
    .map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1))
    .join('')

// Split "vector<int>& nums, int target" safely (handles nested <> like vector<pair<int,int>>)
function splitCppParams(params) {
  const parts = []
  let depth = 0, cur = ''
  for (const ch of (params || '')) {
    if (ch === '<') depth++
    else if (ch === '>') depth--
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' }
    else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

// Extract just the param name (last word after stripping const/&/*)
function paramName(p) {
  return p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/).pop()
}

// Convert a single C++ type string to Java type
function cppTypeToJava(t) {
  return t
    .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>/g, 'int[][]')
    .replace(/vector\s*<\s*int\s*>/g,    'int[]')
    .replace(/vector\s*<\s*string\s*>/g, 'String[]')
    .replace(/vector\s*<\s*char\s*>/g,   'char[]')
    .replace(/\bstring\b/g,    'String')
    .replace(/\blong long\b/g, 'long')
    .replace(/\bbool\b/g,      'boolean')
}

// Convert a single C++ type string to Python type hint
function cppTypeToPy(t) {
  return t
    .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>/g,    'list[list[int]]')
    .replace(/vector\s*<\s*int\s*>/g,    'list[int]')
    .replace(/vector\s*<\s*string\s*>/g, 'list[str]')
    .replace(/vector\s*<\s*char\s*>/g,   'list[str]')
    .replace(/\bstring\b/g,    'str')
    .replace(/\blong long\b/g, 'int')
    .replace(/\bdouble\b/g,    'float')
    .replace(/\bbool\b/g,      'bool')
}

// Convert full C++ param string → Java param string
function cppParamsToJava(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/)
    const name  = parts.pop()
    const type  = cppTypeToJava(parts.join(' ').trim())
    return `${type} ${name}`
  }).join(', ')
}

// Convert full C++ param string → Python param string (with type hints)
function cppParamsToPython(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/)
    const name  = parts.pop()
    const type  = cppTypeToPy(parts.join(' ').trim())
    return `${name}: ${type}`
  }).join(', ')
}

// Extract just names for JS
function cppParamsToJs(params) {
  return splitCppParams(params).map(paramName).join(', ')
}

// Return type conversions
const toJavaRt = (rt) => {
  const map = { 'vector<int>': 'int[]', 'vector<string>': 'String[]', 'vector<vector<int>>': 'int[][]', 'bool': 'boolean', 'long long': 'long', 'string': 'String', 'void': 'void' }
  return map[rt] || rt
}
const toPyRt = (rt) => {
  const map = { 'vector<int>': 'list[int]', 'vector<string>': 'list[str]', 'vector<vector<int>>': 'list[list[int]]', 'bool': 'bool', 'long long': 'int', 'double': 'float', 'string': 'str' }
  return map[rt] || rt
}
const toJsRt = (rt) => {
  if (rt === 'vector<int>' || rt === 'vector<vector<int>>') return 'number[]'
  if (rt === 'vector<string>') return 'string[]'
  if (rt === 'bool') return 'boolean'
  if (rt === 'string') return 'string'
  return 'number'
}

const getDefaultCode = (language, title = 'solve', returnType = 'int', params = '') => {
  const fn      = toFunctionName(title) || 'solve'
  const javaRt  = toJavaRt(returnType)
  const pyRt    = toPyRt(returnType)
  const jsRt    = toJsRt(returnType)
  const javaP   = cppParamsToJava(params)
  const pyP     = params ? `, ${cppParamsToPython(params)}` : ''
  const jsP     = cppParamsToJs(params)
  const jsJsdoc = splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/)
    const name = clean.pop()
    return ` * @param {${toJsRt(clean.join(' '))}} ${name}`
  }).join('\n')

  // Every seeded problem is stdin -> stdout and the statement spells out the
  // exact line format, so the starter reads stdin directly. A `class Solution`
  // skeleton cannot express a multi-line input such as a grid or an edge list.
  // A Solution class still works for simple signatures — the judge wraps it.
  const templates = {
    CPP:
`#include <bits/stdc++.h>
using namespace std;

// Read the input exactly as described in the problem statement.
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // e.g.  int n; cin >> n;
    //       vector<int> a(n); for (int& x : a) cin >> x;

    return 0;
}
`,
    JAVA:
`import java.util.*;
import java.io.*;

// Read the input exactly as described in the problem statement.
public class Main {
    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedInputStream(System.in));

        // e.g.  in.nextToken(); int n = (int) in.nval;

    }
}
`,
    PYTHON:
`import sys

# Read the input exactly as described in the problem statement.
def main():
    data = sys.stdin.read().split()
    # e.g.  n = int(data[0]); a = list(map(int, data[1:1 + n]))

main()
`,
    JAVASCRIPT:
`// Read the input exactly as described in the problem statement.
const data = require('fs').readFileSync(0, 'utf8').split(/\s+/).filter(Boolean);

// e.g.  const n = Number(data[0]);
//       const a = data.slice(1, 1 + n).map(Number);
`,
    C:
`#include <stdio.h>

/* Read the input exactly as described in the problem statement. */
int main(void) {
    /* e.g.  int n; scanf("%d", &n); */

    return 0;
}
`,
  }

  return templates[language] || templates.CPP
}

function getDiffVariant(d) {
  const l = (d || '').toLowerCase()
  if (l === 'low') return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high') return 'danger'
  return 'default'
}

function getStatusVariant(s) {
  if (s === 'ACCEPTED') return 'success'
  if (s === 'WRONG_ANSWER' || s === 'COMPILATION_ERROR') return 'danger'
  if (s === 'PENDING' || s === 'RUNNING') return 'warning'
  return 'default'
}

function getStatusColor(s) {
  if (s === 'ACCEPTED') return 'text-success-400'
  if (s === 'WRONG_ANSWER' || s === 'RUNTIME_ERROR') return 'text-error'
  if (s === 'TIME_LIMIT_EXCEEDED') return 'text-tertiary'
  if (s === 'COMPILATION_ERROR' || s === 'MEMORY_LIMIT_EXCEEDED') return 'text-secondary'
  if (s === 'PENDING' || s === 'RUNNING') return 'text-tertiary'
  return 'text-on-surface-variant'
}


export default function QuestionSolvePage() {
  const { id } = useParams()
  const { data: question, isLoading } = useQuestion(id)
  const { data: testCases } = useTestCases(id)
  const { data: mySubmissions, refetch: refetchSubmissions } = useMySubmissions(id)
  const { submit, result: submitResult, isPolling, clearResult: clearSubmitResult } = useSubmitCode()
  const { run, result: runResult, clearResult: clearRunResult } = useRunCode()

  const [language, setLanguage] = useState('CPP')
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [mode, setMode] = useState('submit') // 'run' | 'submit'

  // active result and close handler depend on which mode last ran
  const result   = mode === 'run' ? runResult   : submitResult
  const isRunning = mode === 'run' && run.isPending
  const clearResult = () => mode === 'run' ? clearRunResult() : clearSubmitResult()

  useEffect(() => {
    if (question?.title) {
      setCode(getDefaultCode(language, question.title, question.return_type, question.params))
    }
  }, [question?.title])

  // Refetch submissions once judge finishes so tab shows final verdict, not PENDING
  useEffect(() => {
    if (submitResult) refetchSubmissions()
  }, [submitResult])

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang)
    setCode(getDefaultCode(lang, question?.title, question?.return_type, question?.params))
  }, [question?.title])

  const handleRun = () => {
    setMode('run')
    clearRunResult()
    clearSubmitResult()
    run.mutate({ questionId: id, language, sourceCode: code })
  }

  const handleSubmit = () => {
    setMode('submit')
    clearRunResult()
    clearSubmitResult()
    submit.mutate(
      { questionId: id, language, sourceCode: code },
      { onSuccess: () => refetchSubmissions() }
    )
  }

  const sampleCases = (testCases || []).slice(0, 2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!question) {
    return <div className="text-red-400 text-center py-16">Question not found.</div>
  }

  const isJudging = submit.isPending || isPolling || run.isPending
  const showResult = isPolling || isRunning || !!result

  return (
    // Full height layout, bypass AppLayout padding
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div
        className="flex h-12 flex-shrink-0 items-center gap-3 border-b px-4"
        style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
      >
        <Link
          to="/questions"
          className="flex items-center gap-1 text-body-md text-on-surface-variant transition-colors hover:text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Problems
        </Link>
        <span style={{ color: 'var(--outline-variant)' }}>/</span>
        <span className="text-body-md text-on-surface">{question.title}</span>
        <Badge variant={getDiffVariant(question.difficluty)} className="ml-1">
          {question.difficluty || 'N/A'}
        </Badge>
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT PANEL ── */}
        <div className="w-[42%] flex flex-col border-r border-outline-variant min-h-0">
          {/* Tabs */}
          <div
            className="flex flex-shrink-0 border-b"
            style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
          >
            {['description', 'submissions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-5 py-3 text-label-md capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'description' ? (
              <>
                {/* Title + difficulty */}
                <div>
                  <h1 className="text-headline-sm text-on-surface mb-2">{question.title}</h1>
                  <Badge variant={getDiffVariant(question.difficluty)}>
                    {question.difficluty === 'Low' ? 'Easy' : question.difficluty === 'High' ? 'Hard' : 'Medium'}
                  </Badge>
                </div>

                {/* Description */}
                <Markdown>{question.description}</Markdown>

                {/* Examples */}
                {sampleCases.length > 0 && (
                  <div className="space-y-4">
                    {sampleCases.map((tc, idx) => (
                      <div key={tc.id}>
                        <p className="text-on-surface font-semibold text-sm mb-2">Example {idx + 1}:</p>
                        <div className="space-y-3 rounded-lg border p-4"
                             style={{ background: 'var(--surface-lowest)', borderColor: 'var(--outline-variant)' }}>
                          <div>
                            <p className="label mb-1">Input</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-on-surface">{tc.input_data}</pre>
                          </div>
                          <div>
                            <p className="label mb-1">Output</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-primary">{tc.expected_output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints note */}
                <div className="text-xs text-gray-500 border-t border-outline-variant pt-4">
                  All submissions are judged against hidden test cases.
                </div>
              </>
            ) : (
              /* Submissions tab */
              <div>
                <h2 className="text-on-surface font-semibold mb-4">My Submissions</h2>
                {!mySubmissions || mySubmissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {mySubmissions.map(sub => (
                      <div key={sub.id} className="bg-surface border border-outline-variant rounded-lg px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${getStatusColor(sub.status)}`}>
                            {sub.status}
                          </span>
                          <span className="text-gray-500 text-xs">{sub.language}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {sub.total_testcases > 0 && (
                            <span>{sub.passed_testcases}/{sub.total_testcases} tests</span>
                          )}
                          {sub.execution_time_ms > 0 && <span>{sub.execution_time_ms}ms</span>}
                          {sub.submitted_at && (
                            <span>{format(new Date(sub.submitted_at), 'MMM dd, HH:mm')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Editor top bar */}
          <div
            className="flex h-12 flex-shrink-0 items-center justify-between border-b px-4"
            style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
          >
            {/* Language selector */}
            <div className="flex items-center gap-2" style={{ color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>code</span>
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                className="input-field h-8 w-auto cursor-pointer py-0 pl-2 pr-8 text-label-md"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button onClick={handleRun} disabled={isJudging} className="btn-secondary h-8">
                {isJudging && mode === 'run'
                  ? <Spinner size="sm" />
                  : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>}
                Run
              </button>
              <button onClick={handleSubmit} disabled={isJudging} className="btn-primary h-8">
                {isJudging && mode === 'submit'
                  ? <Spinner size="sm" />
                  : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor — fills all remaining space */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={val => setCode(val || '')}
              theme={MONACO_THEME}
              beforeMount={registerMonacoTheme}
              options={monacoOptions}
            />
          </div>

          {/* Result panel — slides in at bottom */}
          {showResult && (
            <div className="flex-shrink-0 max-h-[200px] overflow-y-auto border-t border-outline-variant">
              <ResultPanel
                result={result}
                isPolling={isPolling}
                isRunning={isRunning}
                mode={mode}
                onClose={clearResult}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
