import { useState, useEffect } from 'react'
import Spinner from './Spinner'

/* Verdict styling matches the rest of the app: green for a pass, red for a
   wrong answer, orange for a time limit, indigo for system-level failures. */
const VERDICT = {
  ACCEPTED:              { label: 'Accepted',            icon: 'check_circle',      color: 'text-success-400' },
  WRONG_ANSWER:          { label: 'Wrong Answer',        icon: 'cancel',            color: 'text-error' },
  COMPILATION_ERROR:     { label: 'Compilation Error',   icon: 'build',             color: 'text-secondary' },
  TIME_LIMIT_EXCEEDED:   { label: 'Time Limit Exceeded', icon: 'schedule',          color: 'text-tertiary' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', icon: 'memory',          color: 'text-secondary' },
  RUNTIME_ERROR:         { label: 'Runtime Error',       icon: 'error',             color: 'text-error' },
  PENDING:               { label: 'Pending',             icon: 'hourglass_empty',   color: 'text-tertiary' },
  RUNNING:               { label: 'Running',             icon: 'progress_activity', color: 'text-tertiary' },
}

const Icon = ({ name, size = 18, className = '', style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>
)

/* A labelled block of program I/O. Whitespace is preserved because stdin is
   line-oriented — collapsing it is what makes a correct answer look wrong. */
function IOBlock({ label, value, tone = 'default', empty = '(no output)' }) {
  const colour =
    tone === 'expected' ? 'var(--success)' :
    tone === 'actual'   ? 'var(--error)'   :
    'var(--on-surface)'

  return (
    <div>
      <p className="label mb-1">{label}</p>
      <pre
        className="overflow-x-auto whitespace-pre-wrap break-words rounded border p-2 font-mono text-[12px] leading-5"
        style={{
          background: 'var(--surface-lowest)',
          borderColor: 'var(--outline-variant)',
          color: value === '' || value == null ? 'var(--outline)' : colour,
        }}
      >
        {value === '' || value == null ? empty : value}
      </pre>
    </div>
  )
}

function CaseResult({ r, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => { setOpen(defaultOpen) }, [defaultOpen])

  return (
    <div className="rounded border" style={{ borderColor: 'var(--outline-variant)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Icon
            name={r.passed ? 'check_circle' : 'cancel'}
            size={16}
            className={r.passed ? 'text-success-400' : 'text-error'}
          />
          <span className="text-label-md text-on-surface">Case {r.index}</span>
          <span className={`text-label-md ${r.passed ? 'text-success-400' : 'text-error'}`}>
            {r.passed ? 'Passed' : (r.error ? VERDICT[r.error]?.label || r.error : 'Wrong Answer')}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {r.execution_time_ms > 0 && (
            <span className="label tabular-nums">{r.execution_time_ms} ms</span>
          )}
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} style={{ color: 'var(--on-surface-variant)' }} />
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t px-3 py-3" style={{ borderColor: 'var(--outline-variant)' }}>
          <IOBlock label="Input" value={r.input} />
          <IOBlock label="Expected Output" value={r.expected} tone="expected" />
          <IOBlock
            label="Your Output"
            value={r.actual}
            tone={r.passed ? 'expected' : 'actual'}
            empty={r.error ? `(${VERDICT[r.error]?.label || r.error})` : '(no output)'}
          />
          {r.detail && (
            <IOBlock label="Error Detail" value={String(r.detail).slice(0, 2000)} tone="actual" />
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultPanel({ result, isPolling, isRunning, mode, onClose }) {
  if (!result && !isPolling && !isRunning) return null

  const verdict = result ? (VERDICT[result.status] || { label: result.status, icon: 'help', color: 'text-on-surface-variant' }) : null
  const passed = result ? (result.passed ?? result.passed_testcases) : 0
  const total = result ? (result.total ?? result.total_testcases) : 0
  const cases = result?.results || []

  return (
    <div className="border-t" style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}>
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'var(--outline-variant)' }}
      >
        <span className="text-label-md text-on-surface-variant">
          {mode === 'run' ? 'Test Result (sample cases)' : 'Submission Result'}
        </span>
        <button onClick={onClose} className="btn-ghost -mr-2 h-7" aria-label="Close results">
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        {(isPolling || isRunning) && !result ? (
          <div className="flex items-center gap-3 text-tertiary">
            <Spinner size="sm" />
            <span className="text-body-md">
              {mode === 'run' ? 'Running against sample cases…' : 'Judging submission…'}
            </span>
          </div>
        ) : result ? (
          <div className="space-y-3">
            {/* Verdict + counts */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className={`flex items-center gap-2 text-headline-sm ${verdict.color}`}>
                <Icon name={verdict.icon} size={22} />
                {verdict.label}
              </span>

              {total > 0 && (
                <span className="flex items-center gap-2">
                  <span className="label">Tests passed</span>
                  <span className={`text-body-md font-semibold tabular-nums ${passed === total ? 'text-success-400' : 'text-error'}`}>
                    {passed} / {total}
                  </span>
                </span>
              )}

              {result.execution_time_ms > 0 && (
                <span className="flex items-center gap-2">
                  <span className="label">Runtime</span>
                  <span className="text-body-md tabular-nums text-on-surface">{result.execution_time_ms} ms</span>
                </span>
              )}
            </div>

            {/* Compilation and setup failures carry their message, not cases. */}
            {result.detail && cases.length === 0 && (
              <IOBlock label="Compiler Output" value={String(result.detail).slice(0, 4000)} tone="actual" />
            )}

            {/* Per-case breakdown — sample cases only, so nothing hidden leaks. */}
            {cases.length > 0 && (
              <div className="space-y-2">
                {cases.map(r => (
                  <CaseResult key={r.index} r={r} defaultOpen={!r.passed} />
                ))}
              </div>
            )}

            {/* A submission is judged against every case, hidden ones included,
                so there is no per-case detail to show here by design. */}
            {mode !== 'run' && cases.length === 0 && total > 0 && (
              <p className="text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                Submissions are judged against all test cases, including hidden ones.
                Use <span className="text-primary">Run</span> to see your output on the sample cases.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
