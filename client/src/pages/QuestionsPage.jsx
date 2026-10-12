import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import usePagination from '@/hooks/usePagination'

const Icon = ({ name, size = 20, className = '', filled = false }) => (
  <span
    className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
    style={{ fontSize: size }}
  >
    {name}
  </span>
)

function diffVariant(d) {
  const l = (d || '').toLowerCase()
  if (l === 'low')    return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high')   return 'danger'
  return 'default'
}

function diffLabel(d) {
  if (d === 'Low')  return 'Easy'
  if (d === 'High') return 'Hard'
  return d || 'N/A'
}

const DIFFS = ['All', 'Low', 'Medium', 'High']
const DIFF_LABELS = { All: 'All', Low: 'Easy', Medium: 'Medium', High: 'Hard' }

export default function QuestionsPage() {
  const { data: questions, isLoading, error } = useAllQuestions()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  const [difficulty, setDifficulty] = useState('All')

  const filtered = useMemo(() => (questions || []).filter(q => {
    const matchSearch = (q.title || '').toLowerCase().includes(search.toLowerCase())
    const matchDiff   = difficulty === 'All' || q.difficluty === difficulty
    return matchSearch && matchDiff
  }), [questions, search, difficulty])

  const pager = usePagination(filtered, 15)

  const counts = useMemo(() => {
    const all = questions || []
    return {
      total: all.length,
      easy:  all.filter(q => q.difficluty === 'Low').length,
      med:   all.filter(q => q.difficluty === 'Medium').length,
      hard:  all.filter(q => q.difficluty === 'High').length,
    }
  }, [questions])

  const onSearch = (value) => {
    setSearch(value)
    pager.setPage(1)
    const next = new URLSearchParams(params)
    value ? next.set('q', value) : next.delete('q')
    setParams(next, { replace: true })
  }

  const clearFilters = () => { onSearch(''); setDifficulty('All'); pager.setPage(1) }

  return (
    <div className="animate-fade-in space-y-gutter">

      {/* ── Page header ── */}
      <div className="flex flex-col justify-between gap-gutter md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-display-lg text-on-surface">Problem Set</h1>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
            Challenge your logic with curated algorithmic challenges.
          </p>
        </div>

        {/* Counters */}
        <div
          className="flex items-center gap-4 rounded-xl border px-4 py-2"
          style={{ background: 'var(--surface-cont)', borderColor: 'var(--outline-variant)' }}
        >
          <div className="text-center">
            <span className="label block text-[10px]">Total</span>
            <span className="text-headline-sm text-primary tabular-nums">{counts.total}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Easy</span>
            <span className="text-headline-sm text-primary tabular-nums">{counts.easy}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Medium</span>
            <span className="text-headline-sm text-tertiary tabular-nums">{counts.med}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Hard</span>
            <span className="text-headline-sm text-error tabular-nums">{counts.hard}</span>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="glass-panel flex flex-wrap items-center gap-gutter rounded-xl p-stack-md">
        <div className="min-w-[240px] flex-1">
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
              style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => onSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Segmented difficulty control */}
        <div
          className="flex items-center gap-1 rounded p-0.5"
          style={{ background: 'var(--surface-high)' }}
        >
          {DIFFS.map(d => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); pager.setPage(1) }}
              className={`rounded px-3.5 py-1.5 text-label-md transition-colors ${
                difficulty === d
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {DIFF_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Problems table ── */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="tbl-wrap flex flex-col items-center gap-2 py-16 text-center">
          <Icon name="error" className="text-error" size={32} />
          <p className="text-body-md text-error">Failed to load problems. Please try again.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="tbl-head">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="w-32 px-4 py-3">Difficulty</th>
                  <th className="w-28 px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pager.pageItems.map((q, idx) => {
                  const rank = (pager.page - 1) * pager.pageSize + idx + 1
                  return (
                    <tr key={q.id} className="tbl-row group">
                      <td className="px-4 py-4 text-center font-mono-code" style={{ color: 'var(--on-surface-variant)' }}>
                        {String(rank).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/questions/${q.id}`}
                          className="text-body-lg text-on-surface transition-colors group-hover:text-primary"
                        >
                          {q.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={diffVariant(q.difficluty)}>{diffLabel(q.difficluty)}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <Link
                            to={`/questions/${q.id}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-3 text-label-md text-primary transition-colors hover:bg-primary/20 hover:border-primary"
                          >
                            Solve
                            <Icon name="play_arrow" size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Icon name="search_off" size={32} style={{ color: 'var(--outline)' }} />
              <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                No problems match your search.
              </p>
              <button onClick={clearFilters} className="btn-ghost text-primary">Clear filters</button>
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
            pageSizeOptions={[15, 25, 50, 100]}
            label="problems"
          />
        </div>
      )}
    </div>
  )
}
