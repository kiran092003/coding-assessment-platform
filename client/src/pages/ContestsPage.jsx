import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { useAllContests } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import usePagination from '@/hooks/usePagination'

const Icon = ({ name, size = 20, className = '', style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>
)

function getContestStatus(contest) {
  const now   = new Date()
  const start = new Date(contest.start_time)
  const end   = new Date(contest.end_time)
  if (now < start) return 'Upcoming'
  if (now > end)   return 'Ended'
  return 'Active'
}

function statusVariant(s) {
  if (s === 'Active')   return 'accepted'
  if (s === 'Upcoming') return 'warning'
  return 'default'
}

/* A left border carries the status, matching the contest cards in the
   dashboard's "Upcoming Contests" panel. */
const STATUS_ACCENT = {
  Active:   'var(--success)',
  Upcoming: 'var(--tertiary)',
  Ended:    'var(--outline-variant)',
}

const STATUSES = ['All', 'Active', 'Upcoming', 'Ended']

const SORTS = [
  { value: 'soonest', label: 'Starting soonest' },
  { value: 'latest',  label: 'Starting latest' },
  { value: 'title',   label: 'Title A–Z' },
]

export default function ContestsPage() {
  const { data: contests, isLoading, error } = useAllContests()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('soonest')

  const filtersActive = search !== '' || status !== 'All' || sort !== 'soonest'

  const counts = useMemo(() => {
    const all = contests || []
    return {
      All: all.length,
      Active:   all.filter(c => getContestStatus(c) === 'Active').length,
      Upcoming: all.filter(c => getContestStatus(c) === 'Upcoming').length,
      Ended:    all.filter(c => getContestStatus(c) === 'Ended').length,
    }
  }, [contests])

  const rows = useMemo(() => {
    const out = (contests || []).filter(c => {
      if (status !== 'All' && getContestStatus(c) !== status) return false
      if (search) {
        const q = search.trim().toLowerCase()
        const haystack = `${c.title || ''} ${c.description || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    return out.sort((a, b) => {
      if (sort === 'title')  return String(a.title || '').localeCompare(String(b.title || ''))
      if (sort === 'latest') return new Date(b.start_time) - new Date(a.start_time)
      return new Date(a.start_time) - new Date(b.start_time)
    })
  }, [contests, search, status, sort])

  const pager = usePagination(rows, 9)

  const clear = () => { setSearch(''); setStatus('All'); setSort('soonest') }

  return (
    <div className="animate-fade-in space-y-gutter">

      <div className="flex flex-col justify-between gap-gutter md:flex-row md:items-end">
        <div>
          <h1 className="text-display-lg text-on-surface">Contests</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Compete against other developers and earn points.
          </p>
        </div>

        {!isLoading && counts.Active > 0 && (
          <div
            className="flex items-center gap-2 rounded-xl border px-4 py-2"
            style={{ background: 'var(--surface-cont)', borderColor: 'var(--outline-variant)' }}
          >
            <span className="dot-live" style={{ width: 6, height: 6 }} />
            <span className="label text-success-400">
              {counts.Active} running now
            </span>
          </div>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="glass-panel flex flex-wrap items-center gap-gutter rounded-xl p-stack-md">
        <div className="min-w-[240px] flex-1">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--on-surface-variant)' }}
            />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contests…"
              className="input-field pl-10"
              aria-label="Search contests"
            />
          </div>
        </div>

        {/* Status segmented control, with counts so empty states are predictable */}
        <div className="flex items-center gap-1 rounded p-0.5" style={{ background: 'var(--surface-high)' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded px-3 py-1.5 text-label-md transition-colors ${
                status === s ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {s}
              <span className="ml-1.5 opacity-60 tabular-nums">{counts[s]}</span>
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="input-field w-auto cursor-pointer pr-8 text-label-md"
          aria-label="Sort contests"
        >
          {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {filtersActive && (
          <button onClick={clear} className="btn-ghost text-primary">
            <Icon name="filter_alt_off" size={16} />
            Clear
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="tbl-wrap flex flex-col items-center gap-2 py-16 text-center">
          <Icon name="error" className="text-error" size={32} />
          <p className="text-body-md text-error">Failed to load contests.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="tbl-wrap flex flex-col items-center gap-3 py-20 text-center">
          <Icon name={filtersActive ? 'filter_alt_off' : 'emoji_events'} size={48} style={{ color: 'var(--outline)' }} />
          <p className="text-body-md text-on-surface-variant">
            {filtersActive ? 'No contests match your filters.' : 'No contests available yet.'}
          </p>
          {filtersActive && <button onClick={clear} className="btn-ghost text-primary">Clear filters</button>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {pager.pageItems.map(contest => {
              const state = getContestStatus(contest)
              const start = new Date(contest.start_time)
              const end   = new Date(contest.end_time)

              return (
                <Link
                  key={contest.id}
                  to={`/contests/${contest.id}`}
                  className="card-hover group block border-l-4 p-stack-md"
                  style={{ borderLeftColor: STATUS_ACCENT[state] }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Badge variant={statusVariant(state)}>{state}</Badge>
                    {state === 'Active' && (
                      <span className="label flex items-center gap-1.5 text-success-400">
                        <span className="dot-live" style={{ width: 6, height: 6 }} />
                        Live
                      </span>
                    )}
                  </div>

                  <h2 className="mb-2 line-clamp-2 text-body-lg text-on-surface transition-colors group-hover:text-primary">
                    {contest.title}
                  </h2>

                  {contest.description && (
                    <p className="mb-4 line-clamp-2 text-[12px]" style={{ color: 'var(--on-surface-variant)' }}>
                      {contest.description}
                    </p>
                  )}

                  <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--outline-variant)' }}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span style={{ color: 'var(--outline)' }}>Starts</span>
                      <span className="text-on-surface-variant">{format(start, 'MMM dd · HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span style={{ color: 'var(--outline)' }}>Ends</span>
                      <span className="text-on-surface-variant">{format(end, 'MMM dd · HH:mm')}</span>
                    </div>
                    {state === 'Active' && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span style={{ color: 'var(--outline)' }}>Ends in</span>
                        <span className="font-semibold text-tertiary">{formatDistanceToNow(end)}</span>
                      </div>
                    )}
                    {state === 'Upcoming' && (
                      <div className="flex items-center justify-between text-[12px]">
                        <span style={{ color: 'var(--outline)' }}>Starts in</span>
                        <span className="font-semibold text-primary">{formatDistanceToNow(start)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="tbl-wrap">
            <Pagination
              page={pager.page}
              pageCount={pager.pageCount}
              total={pager.total}
              from={pager.from}
              to={pager.to}
              pageSize={pager.pageSize}
              onPageChange={pager.setPage}
              onPageSizeChange={pager.setPageSize}
              pageSizeOptions={[9, 18, 36]}
              label="contests"
            />
          </div>
        </>
      )}
    </div>
  )
}
