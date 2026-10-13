import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAllMySubmissions } from '@/features/submissions/hooks/useSubmissions'
import Spinner from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import { TextFilter, SelectFilter, ClearFilters } from '@/components/ui/ColumnFilter'
import usePagination from '@/hooks/usePagination'

const COLS = 'grid grid-cols-[1fr_110px_150px_100px_100px_130px]'

/* Verdict styling follows the design system's semantics: true green for a
   pass, red for a wrong answer, orange for a time limit, and indigo for
   system-level failures (compile / memory) so logic errors stay visually
   distinct from infrastructure errors. */
const STATUS_META = {
  ACCEPTED:             { label: 'Accepted',      icon: 'check_circle',       color: 'text-success-400' },
  WRONG_ANSWER:         { label: 'Wrong Answer',  icon: 'cancel',             color: 'text-error' },
  COMPILATION_ERROR:    { label: 'Compile Error', icon: 'build',              color: 'text-secondary' },
  TIME_LIMIT_EXCEEDED:  { label: 'Time Limit',    icon: 'schedule',           color: 'text-tertiary' },
  MEMORY_LIMIT_EXCEEDED:{ label: 'Memory Limit',  icon: 'memory',             color: 'text-secondary' },
  RUNTIME_ERROR:        { label: 'Runtime Error', icon: 'error',              color: 'text-error' },
  PENDING:              { label: 'Pending',       icon: 'hourglass_empty',    color: 'text-tertiary' },
  RUNNING:              { label: 'Running',       icon: 'progress_activity',  color: 'text-tertiary' },
}

const LANG_LABELS = { CPP: 'C++', JAVASCRIPT: 'JS', PYTHON: 'Python', JAVA: 'Java', C: 'C' }

const EMPTY = { problem: '', language: 'All', status: 'All', tests: 'All', source: 'All', date: 'All' }

const DATE_WINDOWS = { '1': 24 * 3600e3, '7': 7 * 24 * 3600e3, '30': 30 * 24 * 3600e3 }

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider transition-colors hover:text-primary"
      style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}
    >
      {label}
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {active ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
      </span>
    </button>
  )
}

export default function MySubmissionsPage() {
  const { data: submissions, isLoading, error } = useAllMySubmissions()
  const [filters, setFilters] = useState(EMPTY)
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' })

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const filtersActive = Object.keys(EMPTY).some(k => filters[k] !== EMPTY[k])

  const toggleSort = (field) =>
    setSort(s => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))

  const all = submissions || []
  const accepted = all.filter(s => s.status === 'ACCEPTED').length

  // Language options come from the data, so the filter only offers what exists.
  const languages = useMemo(
    () => ['All', ...Array.from(new Set(all.map(s => s.language).filter(Boolean))).sort()],
    [submissions],
  )

  const ratio = (s) => (s.total_testcases ? (s.passed_testcases ?? 0) / s.total_testcases : null)

  const rows = useMemo(() => {
    const now = Date.now()

    const out = all.filter(s => {
      if (filters.problem) {
        const title = s.question_title || `Problem #${s.question_id}`
        if (!title.toLowerCase().includes(filters.problem.trim().toLowerCase())) return false
      }
      if (filters.language !== 'All' && s.language !== filters.language) return false
      if (filters.status !== 'All' && s.status !== filters.status) return false

      if (filters.tests !== 'All') {
        const r = ratio(s)
        if (filters.tests === 'full'    && r !== 1) return false
        if (filters.tests === 'partial' && !(r !== null && r > 0 && r < 1)) return false
        if (filters.tests === 'none'    && !(r === 0)) return false
      }

      if (filters.source === 'contest'  && !s.contest_id) return false
      if (filters.source === 'practice' && s.contest_id)  return false

      if (filters.date !== 'All') {
        const win = DATE_WINDOWS[filters.date]
        if (!s.submitted_at || now - new Date(s.submitted_at).getTime() > win) return false
      }
      return true
    })

    const dir = sort.dir === 'asc' ? 1 : -1

    return out.sort((a, b) => {
      switch (sort.field) {
        case 'problem':
          return dir * String(a.question_title || '').localeCompare(String(b.question_title || ''))
        case 'language':
          return dir * String(a.language || '').localeCompare(String(b.language || ''))
        case 'status':
          return dir * String(a.status || '').localeCompare(String(b.status || ''))
        case 'tests':
          return dir * ((ratio(a) ?? -1) - (ratio(b) ?? -1))
        case 'time':
          return dir * ((a.execution_time_ms ?? -1) - (b.execution_time_ms ?? -1))
        default:
          return dir * (new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0))
      }
    })
  }, [submissions, filters, sort])

  const pager = usePagination(rows, 25)

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-gutter md:flex-row md:items-end">
        <div>
          <h1 className="text-display-lg text-on-surface">My Submissions</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {isLoading ? 'Loading…' : `${rows.length} of ${all.length} submissions`}
          </p>
        </div>
        {!isLoading && all.length > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ background: 'var(--surface-cont)', borderColor: 'var(--outline-variant)' }}
          >
            <span className="text-headline-sm tabular-nums text-success-400">{accepted}</span>
            <span className="label">/ {all.length} accepted</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="tbl-wrap flex flex-col items-center gap-2 py-16 text-center">
          <span className="material-symbols-outlined text-error" style={{ fontSize: 32 }}>error</span>
          <p className="text-body-md text-error">Failed to load submissions.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          {/* Header */}
          <div className={`tbl-head ${COLS} items-center gap-3 px-5 py-3`}>
            <SortHeader label="Problem" field="problem"  sort={sort} onSort={toggleSort} />
            <SortHeader label="Lang"    field="language" sort={sort} onSort={toggleSort} />
            <SortHeader label="Status"  field="status"   sort={sort} onSort={toggleSort} />
            <SortHeader label="Tests"   field="tests"    sort={sort} onSort={toggleSort} />
            <SortHeader label="Time"    field="time"     sort={sort} onSort={toggleSort} />
            <SortHeader label="Date"    field="date"     sort={sort} onSort={toggleSort} />
          </div>

          {/* Filter row */}
          <div
            className={`${COLS} items-center gap-3 border-b px-5 py-2`}
            style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
          >
            <TextFilter value={filters.problem} onChange={v => set('problem', v)} placeholder="Search problem…" aria-label="Filter by problem" />
            <SelectFilter
              value={filters.language}
              onChange={v => set('language', v)}
              aria-label="Filter by language"
              options={languages.map(l => ({ value: l, label: l === 'All' ? 'All' : (LANG_LABELS[l] || l) }))}
            />
            <SelectFilter
              value={filters.status}
              onChange={v => set('status', v)}
              aria-label="Filter by verdict"
              options={[{ value: 'All', label: 'All' },
                ...Object.keys(STATUS_META).map(k => ({ value: k, label: STATUS_META[k].label }))]}
            />
            <SelectFilter
              value={filters.tests}
              onChange={v => set('tests', v)}
              aria-label="Filter by tests passed"
              options={[
                { value: 'All', label: 'All' },
                { value: 'full', label: 'All passed' },
                { value: 'partial', label: 'Partial' },
                { value: 'none', label: 'None passed' },
              ]}
            />
            {/* The Time column has no useful filter of its own; the source
                filter lives here so every column slot stays occupied. */}
            <SelectFilter
              value={filters.source}
              onChange={v => set('source', v)}
              aria-label="Filter by source"
              options={[
                { value: 'All', label: 'Any' },
                { value: 'contest', label: 'Contest' },
                { value: 'practice', label: 'Practice' },
              ]}
            />
            <div className="flex items-center gap-2">
              <SelectFilter
                value={filters.date}
                onChange={v => set('date', v)}
                aria-label="Filter by date"
                options={[
                  { value: 'All', label: 'Any time' },
                  { value: '1', label: 'Last 24h' },
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                ]}
              />
              <ClearFilters active={filtersActive} onClear={() => setFilters(EMPTY)} />
            </div>
          </div>

          {/* Rows */}
          {pager.pageItems.map(s => {
            const meta  = STATUS_META[s.status] || { label: s.status, icon: 'help', color: 'text-on-surface-variant' }
            const tests = s.total_testcases ? `${s.passed_testcases ?? 0}/${s.total_testcases}` : '—'
            const ms    = s.execution_time_ms != null ? `${s.execution_time_ms}ms` : '—'
            const date  = s.submitted_at ? format(new Date(s.submitted_at), 'MMM dd, HH:mm') : '—'

            return (
              <div key={s.id} className={`tbl-row ${COLS} group items-center gap-3 px-5 py-3.5`}>
                <Link
                  to={`/questions/${s.question_id}`}
                  className="flex items-center gap-2 truncate pr-4 text-body-md text-on-surface transition-colors hover:text-primary"
                  title={s.question_title || `Problem #${s.question_id}`}
                >
                  <span className="truncate">{s.question_title || `Problem #${s.question_id}`}</span>
                  {s.contest_id && <span className="chip chip-system flex-shrink-0">Contest</span>}
                </Link>

                <span><span className="tag font-mono">{LANG_LABELS[s.language] || s.language}</span></span>

                <div className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined flex-shrink-0 ${meta.color}`} style={{ fontSize: 18 }}>
                    {meta.icon}
                  </span>
                  <span className={`truncate text-label-md ${meta.color}`}>{meta.label}</span>
                </div>

                <span className="font-mono text-xs tabular-nums text-on-surface-variant">{tests}</span>
                <span className="font-mono text-xs tabular-nums text-on-surface-variant">{ms}</span>
                <span className="text-xs text-outline">{date}</span>
              </div>
            )
          })}

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>
                {filtersActive ? 'filter_alt_off' : 'inbox'}
              </span>
              {filtersActive ? (
                <>
                  <p className="text-body-md text-on-surface-variant">No submissions match these filters.</p>
                  <button onClick={() => setFilters(EMPTY)} className="btn-ghost text-primary">Clear filters</button>
                </>
              ) : (
                <>
                  <p className="text-body-md text-on-surface-variant">No submissions yet.</p>
                  <Link to="/questions" className="mt-1 inline-block text-body-md text-primary hover:underline">
                    Solve your first problem →
                  </Link>
                </>
              )}
            </div>
          )}

          <Pagination
            page={pager.page}
            pageCount={pager.pageCount}
            total={pager.total}
            from={pager.from}
            to={pager.to}
            pageSize={pager.pageSize}
            onPageChange={pager.setPage}
            onPageSizeChange={pager.setPageSize}
            label="submissions"
          />
        </div>
      )}
    </div>
  )
}
