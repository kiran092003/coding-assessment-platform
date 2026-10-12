import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAllMySubmissions } from '@/features/submissions/hooks/useSubmissions'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

/* Verdict styling follows the design system's semantics: true green for a
   pass, red for a wrong answer, orange for a time limit, and indigo for
   system-level failures (compile / memory) so logic errors stay visually
   distinct from infrastructure errors. */
const STATUS_META = {
  ACCEPTED:             { label: 'Accepted',      variant: 'accepted', icon: 'check_circle' },
  WRONG_ANSWER:         { label: 'Wrong Answer',  variant: 'danger',   icon: 'cancel' },
  COMPILATION_ERROR:    { label: 'Compile Error', variant: 'system',   icon: 'build' },
  TIME_LIMIT_EXCEEDED:  { label: 'Time Limit',    variant: 'warning',  icon: 'schedule' },
  MEMORY_LIMIT_EXCEEDED:{ label: 'Memory Limit',  variant: 'system',   icon: 'memory' },
  RUNTIME_ERROR:        { label: 'Runtime Error', variant: 'danger',   icon: 'error' },
  PENDING:              { label: 'Pending',       variant: 'default',  icon: 'hourglass_empty' },
  RUNNING:              { label: 'Running',       variant: 'warning',  icon: 'progress_activity' },
}

const STATUS_COLOR = {
  ACCEPTED:              'text-success-400',
  WRONG_ANSWER:          'text-error',
  RUNTIME_ERROR:         'text-error',
  TIME_LIMIT_EXCEEDED:   'text-tertiary',
  COMPILATION_ERROR:     'text-secondary',
  MEMORY_LIMIT_EXCEEDED: 'text-secondary',
  PENDING:               'text-tertiary',
  RUNNING:               'text-tertiary',
}

const LANG_LABELS = { CPP: 'C++', JAVASCRIPT: 'JS', PYTHON: 'Python', JAVA: 'Java', C: 'C' }

const FILTERS = ['All', 'Accepted', 'Wrong Answer', 'Errors', 'Pending']

function matchFilter(status, filter) {
  if (filter === 'All')         return true
  if (filter === 'Accepted')    return status === 'ACCEPTED'
  if (filter === 'Wrong Answer') return status === 'WRONG_ANSWER'
  if (filter === 'Errors')      return ['COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR'].includes(status)
  if (filter === 'Pending')     return ['PENDING', 'RUNNING'].includes(status)
  return true
}

export default function MySubmissionsPage() {
  const { data: submissions, isLoading, error } = useAllMySubmissions()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = (submissions || []).filter(s => {
    const matchStatus = matchFilter(s.status, filter)
    const matchSearch = !search || (s.question_title || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const accepted = (submissions || []).filter(s => s.status === 'ACCEPTED').length
  const total    = (submissions || []).length

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-lg text-on-surface">My Submissions</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Every submission across problems and contests.
          </p>
        </div>
        {!isLoading && total > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant">
            <span className="text-headline-sm tabular-nums text-success-400">{accepted}</span>
            <span className="label">/ {total} accepted</span>
          </div>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by problem..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl border border-outline-variant bg-surface-container-low overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                filter === f
                  ? 'bg-surface-container text-on-surface border border-outline-variant shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">Failed to load submissions.</div>
      ) : (
        <div className="tbl-wrap">
          <div className="tbl-head grid grid-cols-[1fr_90px_120px_90px_80px_100px] px-5 py-3">
            {['Problem', 'Lang', 'Status', 'Tests', 'Time', 'Date'].map(h => (
              <span key={h} className="text-outline text-xs font-semibold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-3"><span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>inbox</span></div>
              <p className="text-on-surface-variant text-sm">
                {search || filter !== 'All' ? 'No submissions match your filter.' : 'No submissions yet.'}
              </p>
              {(search || filter !== 'All') && (
                <button
                  onClick={() => { setSearch(''); setFilter('All') }}
                  className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filtered.map(s => {
              const meta = STATUS_META[s.status] || { label: s.status, variant: 'default' }
              const tests = s.total_testcases
                ? `${s.passed_testcases ?? 0}/${s.total_testcases}`
                : '—'
              const ms = s.execution_time_ms != null ? `${s.execution_time_ms}ms` : '—'
              const date = s.submitted_at ? format(new Date(s.submitted_at), 'MMM dd, HH:mm') : '—'

              return (
                <div key={s.id} className="tbl-row grid grid-cols-[1fr_90px_120px_90px_80px_100px] px-5 py-3.5 items-center group">
                  <Link
                    to={`/questions/${s.question_id}`}
                    className="text-on-surface text-sm font-medium hover:text-emerald-400 transition-colors truncate pr-4 flex items-center gap-2"
                  >
                    {s.question_title || `Problem #${s.question_id}`}
                    {s.contest_id && (
                      <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-400 border border-violet-400/20 font-semibold">
                        Contest
                      </span>
                    )}
                  </Link>
                  <span>
                    <span className="tag font-mono">{LANG_LABELS[s.language] || s.language}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`material-symbols-outlined flex-shrink-0 ${STATUS_COLOR[s.status] || 'text-on-surface-variant'}`}
                      style={{ fontSize: 18 }}
                    >
                      {meta.icon || 'help'}
                    </span>
                    <span className={`text-label-md ${STATUS_COLOR[s.status] || 'text-on-surface-variant'}`}>
                      {meta.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-on-surface-variant">{tests}</span>
                  <span className="font-mono text-xs tabular-nums text-on-surface-variant">{ms}</span>
                  <span className="text-xs text-outline">{date}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
