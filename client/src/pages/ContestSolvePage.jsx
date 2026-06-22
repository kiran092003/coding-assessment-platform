import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { format } from 'date-fns'
import { useQuestion } from '@/features/questions/hooks/useQuestions'
import { useTestCases } from '@/features/testcases/hooks/useTestCases'
import { useContest } from '@/features/contests/hooks/useContests'
import { useSubmitCode, useRunCode, useMySubmissions } from '@/features/submissions/hooks/useSubmissions'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

const LANGUAGES = ['CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'C']
const MONACO_LANG = { C: 'c', CPP: 'cpp', JAVA: 'java', PYTHON: 'python', JAVASCRIPT: 'javascript' }

const toFunctionName = (title = '') =>
  title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/).filter(Boolean)
    .map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1))
    .join('')

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
function cppTypeToPy(t) {
  return t
    .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>/g, 'list[list[int]]')
    .replace(/vector\s*<\s*int\s*>/g,    'list[int]')
    .replace(/vector\s*<\s*string\s*>/g, 'list[str]')
    .replace(/vector\s*<\s*char\s*>/g,   'list[str]')
    .replace(/\bstring\b/g,    'str')
    .replace(/\blong long\b/g, 'int')
    .replace(/\bdouble\b/g,    'float')
    .replace(/\bbool\b/g,      'bool')
}

function cppParamsToJava(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/)
    const name = parts.pop()
    return `${cppTypeToJava(parts.join(' ').trim())} ${name}`
  }).join(', ')
}
function cppParamsToPython(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/)
    const name = parts.pop()
    return `${name}: ${cppTypeToPy(parts.join(' ').trim())}`
  }).join(', ')
}
function cppParamsToJs(params) {
  return splitCppParams(params)
    .map(p => p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/).pop())
    .join(', ')
}

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
  const fn     = toFunctionName(title) || 'solve'
  const javaRt = toJavaRt(returnType)
  const pyRt   = toPyRt(returnType)
  const jsRt   = toJsRt(returnType)
  const javaP  = cppParamsToJava(params)
  const pyP    = params ? `, ${cppParamsToPython(params)}` : ''
  const jsP    = cppParamsToJs(params)
  const jsJsdoc = splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/)
    const name = clean.pop()
    return ` * @param {${toJsRt(clean.join(' '))}} ${name}`
  }).join('\n')

  const templates = {
    CPP:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    ${returnType} ${fn}(${params}) {

    }
};
`,
    JAVA:
`class Solution {
    public ${javaRt} ${fn}(${javaP}) {

    }
}
`,
    PYTHON:
`class Solution:
    def ${fn}(self${pyP}) -> ${pyRt}:
        pass
`,
    JAVASCRIPT:
`/**
${jsJsdoc ? jsJsdoc + '\n' : ''} * @return {${jsRt}}
 */
var ${fn} = function(${jsP}) {

};
`,
    C:
`#include <stdio.h>

// C: write a full program that reads from stdin and prints to stdout
int main() {

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

function getStatusColor(s) {
  if (s === 'ACCEPTED') return 'text-emerald-400'
  if (s === 'WRONG_ANSWER' || s === 'COMPILATION_ERROR') return 'text-red-400'
  if (s === 'PENDING' || s === 'RUNNING') return 'text-yellow-400'
  return 'text-gray-400'
}

function ResultPanel({ result, isPolling, isRunning, mode, onClose }) {
  if (!result && !isPolling && !isRunning) return null

  return (
    <div className="border-t border-[#20233A] bg-[#0E0F18]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#20233A]">
        <span className="text-sm font-medium text-gray-300">
          {mode === 'run' ? 'Test Result (sample cases)' : 'Submission Result'}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>
      <div className="px-4 py-4 min-h-[100px]">
        {(isPolling || isRunning) && !result ? (
          <div className="flex items-center gap-3 text-yellow-400">
            <Spinner size="sm" />
            <span className="text-sm">
              {mode === 'run' ? 'Running against sample cases...' : 'Submitting solution...'}
            </span>
          </div>
        ) : result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className={`text-xl font-bold ${getStatusColor(result.status)}`}>
                {result.status === 'ACCEPTED' ? '✓ Accepted' :
                 result.status === 'WRONG_ANSWER' ? '✗ Wrong Answer' :
                 result.status === 'COMPILATION_ERROR' ? '✗ Compilation Error' :
                 result.status === 'TIME_LIMIT_EXCEEDED' ? '⏱ Time Limit Exceeded' :
                 result.status === 'RUNTIME_ERROR' ? '✗ Runtime Error' :
                 result.status}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              {(() => {
                const p = result.passed ?? result.passed_testcases
                const t = result.total  ?? result.total_testcases
                if (t > 0) return (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tests passed</span>
                    <span className={p === t ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
                      {p} / {t}
                    </span>
                  </div>
                )
              })()}
              {result.execution_time_ms > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Runtime</span>
                  <span className="text-white font-medium">{result.execution_time_ms} ms</span>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function ContestSolvePage() {
  const { id: contestId, questionId } = useParams()
  const { data: contest } = useContest(contestId)
  const { data: question, isLoading } = useQuestion(questionId)
  const { data: testCases } = useTestCases(questionId)
  const { data: mySubmissions, refetch: refetchSubmissions } = useMySubmissions(questionId, contestId)
  const { submit, result: submitResult, isPolling, clearResult: clearSubmitResult } = useSubmitCode()
  const { run, result: runResult, clearResult: clearRunResult } = useRunCode()

  const [language, setLanguage] = useState('CPP')
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [mode, setMode] = useState('submit')

  const result    = mode === 'run' ? runResult    : submitResult
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
  }, [question?.title, question?.return_type])

  const handleRun = () => {
    setMode('run')
    clearRunResult()
    clearSubmitResult()
    run.mutate({ questionId, language, sourceCode: code })
  }

  const handleSubmit = () => {
    setMode('submit')
    clearRunResult()
    clearSubmitResult()
    submit.mutate(
      { questionId, language, sourceCode: code, contestId },
      { onSuccess: () => refetchSubmissions() }
    )
  }

  const sampleCases = (testCases || []).slice(0, 2)
  const isJudging = submit.isPending || isPolling || run.isPending
  const showResult = isPolling || isRunning || !!result

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

  // Block access if contest hasn't started yet
  if (contest && new Date() < new Date(contest.start_time)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-white text-2xl font-bold">Contest hasn't started yet</h2>
        <p className="text-[#8890B0] text-sm max-w-sm">
          This problem will be unlocked when the contest begins.
        </p>
        <Link
          to={`/contests/${contestId}`}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-secondary"
        >
          ← Back to Contest
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#20233A] bg-[#0E0F18] flex-shrink-0">
        <Link to={`/contests/${contestId}`} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← {contest?.title || 'Contest'}
        </Link>
        <span className="text-gray-600">|</span>
        <span className="text-white font-medium text-sm">{question.title}</span>
        <Badge variant={getDiffVariant(question.difficluty)} className="ml-1">
          {question.difficluty === 'Low' ? 'Easy' : question.difficluty === 'High' ? 'Hard' : 'Medium'}
        </Badge>
        <div className="ml-auto">
          <Link
            to={`/contests/${contestId}/leaderboard`}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            Leaderboard →
          </Link>
        </div>
      </div>

      {/* Main split */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT PANEL ── */}
        <div className="w-[42%] flex flex-col border-r border-[#20233A] min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-[#20233A] flex-shrink-0 bg-[#0E0F18]">
            {['description', 'submissions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-emerald-500'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {activeTab === 'description' ? (
              <>
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">{question.title}</h1>
                  <Badge variant={getDiffVariant(question.difficluty)}>
                    {question.difficluty === 'Low' ? 'Easy' : question.difficluty === 'High' ? 'Hard' : 'Medium'}
                  </Badge>
                </div>

                <div className="text-gray-300 text-sm leading-7 whitespace-pre-wrap">
                  {question.description}
                </div>

                {sampleCases.length > 0 && (
                  <div className="space-y-4">
                    {sampleCases.map((tc, idx) => (
                      <div key={tc.id}>
                        <p className="text-white font-semibold text-sm mb-2">Example {idx + 1}:</p>
                        <div className="bg-[#06070C] rounded-lg p-4 space-y-2 border border-[#20233A]">
                          <div className="font-mono text-sm">
                            <span className="text-gray-400 font-sans font-medium">Input: </span>
                            <span className="text-gray-100">{tc.input_data}</span>
                          </div>
                          <div className="font-mono text-sm">
                            <span className="text-gray-400 font-sans font-medium">Output: </span>
                            <span className="text-gray-100">{tc.expected_output}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 border-t border-[#20233A] pt-4">
                  All submissions are judged against hidden test cases.
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-white font-semibold mb-4">My Submissions</h2>
                {!mySubmissions || mySubmissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {mySubmissions.map(sub => (
                      <div key={sub.id} className="bg-[#06070C] border border-[#20233A] rounded-lg px-4 py-3 flex items-center justify-between">
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
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#20233A] bg-[#0E0F18] flex-shrink-0">
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value)}
              className="bg-[#171828] border border-[#2E3150] text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={isJudging}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-[#171828] hover:bg-[#3a3a3a] text-white disabled:opacity-50 border border-[#2E3150] transition-colors"
              >
                {isJudging && mode === 'run' ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={isJudging}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
              >
                {isJudging && mode === 'submit' ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={val => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 4,
                automaticLayout: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Result panel */}
          {showResult && (
            <div className="flex-shrink-0 max-h-[200px] overflow-y-auto border-t border-[#20233A]">
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
