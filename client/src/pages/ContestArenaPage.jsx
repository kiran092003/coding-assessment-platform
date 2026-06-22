import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { format } from 'date-fns'
import { useContest, useContestQuestions } from '@/features/contests/hooks/useContests'
import { useQuestion } from '@/features/questions/hooks/useQuestions'
import { useTestCases } from '@/features/testcases/hooks/useTestCases'
import { useSubmitCode, useRunCode, useMySubmissions } from '@/features/submissions/hooks/useSubmissions'
import { useMyRegistration } from '@/features/contests/hooks/useContests'
import { recordStart, recordEnd } from '@/features/leaderboard/api/leaderboardApi'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'

// ── Language helpers ──────────────────────────────────────────────────────────
const LANGUAGES = ['CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'C']
const MONACO_LANG = { C: 'c', CPP: 'cpp', JAVA: 'java', PYTHON: 'python', JAVASCRIPT: 'javascript' }

const toFunctionName = (title = '') =>
  title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
    .map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('')

function splitCppParams(params) {
  const parts = []; let depth = 0, cur = ''
  for (const ch of (params || '')) {
    if (ch === '<') depth++; else if (ch === '>') depth--
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = '' } else cur += ch
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts
}

function cppTypeToJava(t) {
  return t
    .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>/g, 'int[][]')
    .replace(/vector\s*<\s*int\s*>/g, 'int[]').replace(/vector\s*<\s*string\s*>/g, 'String[]')
    .replace(/vector\s*<\s*char\s*>/g, 'char[]').replace(/\bstring\b/g, 'String')
    .replace(/\blong long\b/g, 'long').replace(/\bbool\b/g, 'boolean')
}
function cppTypeToPy(t) {
  return t
    .replace(/vector\s*<\s*vector\s*<\s*int\s*>\s*>/g, 'list[list[int]]')
    .replace(/vector\s*<\s*int\s*>/g, 'list[int]').replace(/vector\s*<\s*string\s*>/g, 'list[str]')
    .replace(/vector\s*<\s*char\s*>/g, 'list[str]').replace(/\bstring\b/g, 'str')
    .replace(/\blong long\b/g, 'int').replace(/\bdouble\b/g, 'float').replace(/\bbool\b/g, 'bool')
}

function cppParamsToJava(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/); const name = parts.pop()
    return `${cppTypeToJava(parts.join(' ').trim())} ${name}`
  }).join(', ')
}
function cppParamsToPython(params) {
  return splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim()
    const parts = clean.split(/\s+/); const name = parts.pop()
    return `${name}: ${cppTypeToPy(parts.join(' ').trim())}`
  }).join(', ')
}
function cppParamsToJs(params) {
  return splitCppParams(params)
    .map(p => p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/).pop())
    .join(', ')
}

const toJavaRt = (rt) => ({ 'vector<int>': 'int[]', 'vector<string>': 'String[]', 'vector<vector<int>>': 'int[][]', 'bool': 'boolean', 'long long': 'long', 'string': 'String', 'void': 'void' }[rt] || rt)
const toPyRt   = (rt) => ({ 'vector<int>': 'list[int]', 'vector<string>': 'list[str]', 'vector<vector<int>>': 'list[list[int]]', 'bool': 'bool', 'long long': 'int', 'double': 'float', 'string': 'str' }[rt] || rt)
const toJsRt   = (rt) => {
  if (rt === 'vector<int>' || rt === 'vector<vector<int>>') return 'number[]'
  if (rt === 'vector<string>') return 'string[]'
  if (rt === 'bool') return 'boolean'
  if (rt === 'string') return 'string'
  return 'number'
}

const getDefaultCode = (language, title = 'solve', returnType = 'int', params = '') => {
  const fn = toFunctionName(title) || 'solve'
  const javaP = cppParamsToJava(params)
  const pyP   = params ? `, ${cppParamsToPython(params)}` : ''
  const jsP   = cppParamsToJs(params)
  const jsJsdoc = splitCppParams(params).map(p => {
    const clean = p.replace(/\bconst\b/g, '').replace(/[&*]/g, '').trim().split(/\s+/)
    const name = clean.pop()
    return ` * @param {${toJsRt(clean.join(' '))}} ${name}`
  }).join('\n')

  return ({
    CPP:        `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    ${returnType} ${fn}(${params}) {\n\n    }\n};\n`,
    JAVA:       `class Solution {\n    public ${toJavaRt(returnType)} ${fn}(${javaP}) {\n\n    }\n}\n`,
    PYTHON:     `class Solution:\n    def ${fn}(self${pyP}) -> ${toPyRt(returnType)}:\n        pass\n`,
    JAVASCRIPT: `/**\n${jsJsdoc ? jsJsdoc + '\n' : ''} * @return {${toJsRt(returnType)}}\n */\nvar ${fn} = function(${jsP}) {\n\n};\n`,
    C:          `#include <stdio.h>\n\n// C: write a full program that reads from stdin and prints to stdout\nint main() {\n\n    return 0;\n}\n`,
  })[language] || ''
}

function getDiffVariant(d) {
  const l = (d || '').toLowerCase()
  if (l === 'low') return 'success'; if (l === 'medium') return 'warning'; if (l === 'high') return 'danger'; return 'default'
}

function getStatusColor(s) {
  if (s === 'ACCEPTED') return 'text-emerald-400'
  if (s === 'WRONG_ANSWER' || s === 'COMPILATION_ERROR') return 'text-red-400'
  if (s === 'PENDING' || s === 'RUNNING') return 'text-yellow-400'
  return 'text-gray-400'
}

const formatTime = (ms) => {
  if (ms === null || ms === undefined) return '--:--:--'
  const t = Math.floor(ms / 1000)
  return `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

// ── Logo ──────────────────────────────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
    <path d="M14 2L25.5 8.5V19.5L14 26L2.5 19.5V8.5L14 2Z" stroke="#10B981" strokeWidth="1.5" />
    <path d="M10 10l-4 4 4 4M18 10l4 4-4 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.5 9l-3 10" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ── Result Panel ──────────────────────────────────────────────────────────────
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
      <div className="px-4 py-3 min-h-[72px]">
        {(isPolling || isRunning) && !result ? (
          <div className="flex items-center gap-3 text-yellow-400">
            <Spinner size="sm" />
            <span className="text-sm">{mode === 'run' ? 'Running against sample cases…' : 'Submitting solution…'}</span>
          </div>
        ) : result ? (
          <div className="space-y-2">
            <span className={`text-lg font-bold ${getStatusColor(result.status)}`}>
              {result.status === 'ACCEPTED' ? '✓ Accepted' :
               result.status === 'WRONG_ANSWER' ? '✗ Wrong Answer' :
               result.status === 'COMPILATION_ERROR' ? '✗ Compilation Error' :
               result.status === 'TIME_LIMIT_EXCEEDED' ? '⏱ Time Limit Exceeded' :
               result.status === 'RUNTIME_ERROR' ? '✗ Runtime Error' : result.status}
            </span>
            <div className="flex items-center gap-6 text-sm">
              {(() => {
                const p = result.passed ?? result.passed_testcases
                const t = result.total  ?? result.total_testcases
                if (t > 0) return <div className="flex items-center gap-2"><span className="text-gray-500">Tests passed</span><span className={p === t ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{p} / {t}</span></div>
              })()}
              {result.execution_time_ms > 0 && <div className="flex items-center gap-2"><span className="text-gray-500">Runtime</span><span className="text-white font-medium">{result.execution_time_ms} ms</span></div>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Exit Confirm Dialog ───────────────────────────────────────────────────────
function ExitDialog({ onStay, onLeave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#20233A] bg-[#0E0F18] shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 animate-fade-in">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-lg text-center mb-1">End the contest?</h3>
        <p className="text-[#8890B0] text-sm text-center mb-6">
          You'll leave the arena. Make sure you've submitted all your solutions before exiting.
        </p>
        <div className="flex gap-3">
          <button onClick={onStay} className="btn-secondary flex-1">Stay</button>
          <button
            onClick={onLeave}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
          >
            End Test
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ContestArenaPage() {
  const { id: contestId } = useParams()
  const navigate = useNavigate()

  const { data: contest, isLoading: cLoading } = useContest(contestId)
  const { data: questions = [] } = useContestQuestions(contestId)
  const { data: regData, isLoading: regLoading } = useMyRegistration(contestId)

  const [activeQId, setActiveQId] = useState(null)
  const [codeMap,   setCodeMap]   = useState({})
  const [langMap,   setLangMap]   = useState({})
  const [activeTab, setActiveTab] = useState('description')
  const [mode,      setMode]      = useState('submit')
  const [timeLeft,  setTimeLeft]  = useState(null)
  const [contestEnded, setContestEnded] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [solvedSet, setSolvedSet] = useState(new Set())

  // Use a ref so the blocker callback always reads the latest value without stale closure
  const exitConfirmedRef = useRef(false)

  const { data: question }    = useQuestion(activeQId)
  const { data: testCases }   = useTestCases(activeQId)
  const { data: mySubmissions, refetch: refetchSubmissions } = useMySubmissions(activeQId, contestId)
  const { submit, result: submitResult, isPolling, clearResult: clearSubmitResult } = useSubmitCode()
  const { run,    result: runResult,              clearResult: clearRunResult }    = useRunCode()

  const language = langMap[activeQId] || 'CPP'
  const code     = codeMap[activeQId] || ''
  const result   = mode === 'run' ? runResult : submitResult
  const isRunning  = mode === 'run' && run.isPending
  const isJudging  = submit.isPending || isPolling || run.isPending
  const showResult = isPolling || isRunning || !!result

  // Block in-app navigation
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    !exitConfirmedRef.current && currentLocation.pathname !== nextLocation.pathname
  )

  // Record that user has started this contest
  useEffect(() => {
    if (contestId) recordStart(contestId).catch(() => {})
  }, [contestId])

  // Block browser refresh / tab close
  useEffect(() => {
    const handler = (e) => {
      if (exitConfirmedRef.current) return
      e.preventDefault(); e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // Countdown timer — also marks ended in DB when time hits 0
  const endedInDbRef = useRef(false)
  useEffect(() => {
    if (!contest) return
    const tick = () => {
      const remaining = Math.max(0, new Date(contest.end_time) - new Date())
      setTimeLeft(remaining)
      if (remaining === 0) {
        setContestEnded(true)
        if (!endedInDbRef.current) {
          endedInDbRef.current = true
          recordEnd(contestId).catch(() => {})
        }
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [contest?.end_time])

  // Select first question on load
  useEffect(() => {
    if (questions.length && !activeQId) setActiveQId(String(questions[0].id))
  }, [questions])

  // Set default code for a question the first time it's opened
  useEffect(() => {
    if (question && activeQId && codeMap[activeQId] === undefined) {
      setCodeMap(prev => ({
        ...prev,
        [activeQId]: getDefaultCode(language, question.title, question.return_type, question.params)
      }))
    }
  }, [question?.id, activeQId])

  // Track accepted questions + refresh submissions after judge
  useEffect(() => {
    if (!submitResult) return
    if (submitResult.status === 'ACCEPTED') setSolvedSet(prev => new Set([...prev, activeQId]))
    refetchSubmissions()
  }, [submitResult])

  const handleLanguageChange = (lang) => {
    setLangMap(prev => ({ ...prev, [activeQId]: lang }))
    if (question) setCodeMap(prev => ({ ...prev, [activeQId]: getDefaultCode(lang, question.title, question.return_type, question.params) }))
  }

  const handleQuestionSwitch = (qId) => {
    clearRunResult(); clearSubmitResult()
    setActiveTab('description'); setMode('submit')
    setActiveQId(String(qId))
  }

  const handleRun = () => {
    setMode('run'); clearRunResult(); clearSubmitResult()
    run.mutate({ questionId: activeQId, language, sourceCode: code })
  }

  const handleSubmit = () => {
    setMode('submit'); clearRunResult(); clearSubmitResult()
    submit.mutate({ questionId: activeQId, language, sourceCode: code, contestId })
  }

  const doExit = () => {
    exitConfirmedRef.current = true
    recordEnd(contestId).catch(() => {})
    navigate(`/contests/${contestId}`)
  }

  const sampleCases = (testCases || []).slice(0, 2)
  const timerColor = timeLeft === null ? 'text-gray-400'
    : timeLeft < 5 * 60 * 1000  ? 'text-red-400'
    : timeLeft < 10 * 60 * 1000 ? 'text-amber-400'
    : 'text-emerald-400'

  // ── Early exits ─────────────────────────────────────────────────────────────
  if (cLoading || regLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Spinner size="lg" />
    </div>
  )

  if (regData && !regData.registered) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-6xl">🔐</div>
      <h2 className="text-white text-2xl font-bold">Registration Required</h2>
      <p className="text-[#8890B0] text-sm max-w-xs">You need to register for this contest before you can enter the arena.</p>
      <button
        onClick={() => { exitConfirmedRef.current = true; navigate(`/contests/${contestId}`) }}
        className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-secondary"
      >
        ← Back to Contest
      </button>
    </div>
  )

  if (contest && new Date() < new Date(contest.start_time)) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="text-6xl">🔒</div>
      <h2 className="text-white text-2xl font-bold">Contest hasn't started yet</h2>
      <button onClick={() => { exitConfirmedRef.current = true; navigate(`/contests/${contestId}`) }} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold btn-secondary">
        ← Back to Contest
      </button>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-14 px-5 border-b border-[#20233A] bg-[#06070C] flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <LogoIcon />
          <div className="min-w-0">
            <p className="text-[10px] text-[#454A68] uppercase tracking-widest font-semibold leading-none mb-0.5">Contest Arena</p>
            <p className="text-white text-sm font-bold truncate max-w-[220px]">{contest?.title || '…'}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[10px] text-[#454A68] uppercase tracking-widest font-semibold">Time Left</p>
          <span className={`font-mono text-xl font-bold tabular-nums ${timerColor}`}>{formatTime(timeLeft)}</span>
        </div>

        <button
          onClick={() => setShowExitDialog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          End Test
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Problems sidebar ──────────────────────────────────────────────── */}
        <div className="w-52 flex flex-col border-r border-[#20233A] bg-[#06070C] flex-shrink-0">
          <div className="px-4 py-2.5 border-b border-[#20233A]">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#454A68]">Problems</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {questions.map((q, idx) => {
              const solved = solvedSet.has(String(q.id))
              const active = String(q.id) === activeQId
              return (
                <button
                  key={q.id}
                  onClick={() => handleQuestionSwitch(q.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2.5 transition-colors border-l-2 ${
                    active
                      ? 'bg-emerald-500/10 text-white border-emerald-500'
                      : 'text-[#8890B0] hover:bg-[#0E0F18] hover:text-white border-transparent'
                  }`}
                >
                  <span className="text-xs font-mono text-[#454A68] flex-shrink-0 w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium truncate flex-1">{q.title}</span>
                  {solved && (
                    <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Description / Submissions panel ──────────────────────────────── */}
        <div className="w-[38%] flex flex-col border-r border-[#20233A] min-h-0">
          <div className="flex border-b border-[#20233A] flex-shrink-0 bg-[#0E0F18]">
            {['description', 'submissions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab ? 'text-white border-emerald-500' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {!question ? (
              <div className="flex items-center justify-center h-32"><Spinner /></div>
            ) : activeTab === 'description' ? (
              <>
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">{question.title}</h1>
                  <Badge variant={getDiffVariant(question.difficluty)}>
                    {question.difficluty === 'Low' ? 'Easy' : question.difficluty === 'High' ? 'Hard' : 'Medium'}
                  </Badge>
                </div>
                <div className="text-gray-300 text-sm leading-7 whitespace-pre-wrap">{question.description}</div>
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
                <p className="text-xs text-gray-500 border-t border-[#20233A] pt-4">All submissions are judged against hidden test cases.</p>
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
                          <span className={`text-sm font-medium ${getStatusColor(sub.status)}`}>{sub.status}</span>
                          <span className="text-gray-500 text-xs">{sub.language}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {sub.total_testcases > 0 && <span>{sub.passed_testcases}/{sub.total_testcases} tests</span>}
                          {sub.execution_time_ms > 0 && <span>{sub.execution_time_ms}ms</span>}
                          {sub.submitted_at && <span>{format(new Date(sub.submitted_at), 'MMM dd, HH:mm')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Editor panel ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
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
                disabled={isJudging || contestEnded}
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

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={val => setCodeMap(prev => ({ ...prev, [activeQId]: val || '' }))}
              theme="vs-dark"
              options={{
                fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 }, lineNumbers: 'on', renderLineHighlight: 'line',
                tabSize: 4, automaticLayout: true,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true, cursorBlinking: 'smooth', smoothScrolling: true,
              }}
            />
          </div>

          {showResult && (
            <div className="flex-shrink-0 max-h-[180px] overflow-y-auto">
              <ResultPanel
                result={result} isPolling={isPolling} isRunning={isRunning} mode={mode}
                onClose={() => mode === 'run' ? clearRunResult() : clearSubmitResult()}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Contest Ended Overlay ────────────────────────────────────────────── */}
      {contestEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#20233A] bg-[#0E0F18] shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-8 text-center space-y-4">
            <div className="text-5xl">⏱</div>
            <h3 className="text-white font-bold text-xl">Time's up!</h3>
            <p className="text-[#8890B0] text-sm">The contest has ended. Your submissions have been recorded.</p>
            <button onClick={doExit} className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              View Results
            </button>
          </div>
        </div>
      )}

      {/* ── Exit Confirmation (manual End Test button) ───────────────────────── */}
      {showExitDialog && !contestEnded && (
        <ExitDialog
          onStay={() => setShowExitDialog(false)}
          onLeave={doExit}
        />
      )}

      {/* ── Exit Confirmation (blocked navigation — back button / link click) ── */}
      {blocker.state === 'blocked' && !contestEnded && (
        <ExitDialog
          onStay={() => blocker.reset()}
          onLeave={() => blocker.proceed()}
        />
      )}
    </div>
  )
}
