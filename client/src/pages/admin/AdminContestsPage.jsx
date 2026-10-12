import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAllContests, useDeleteContest } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { TextFilter, SelectFilter, DateFilter, ClearFilters } from '@/components/ui/ColumnFilter'
import usePagination from '@/hooks/usePagination'

const COLS = 'grid grid-cols-[70px_1fr_120px_150px_150px_210px]'

function getContestStatus(contest) {
  const now = new Date()
  if (now < new Date(contest.start_time)) return 'Upcoming'
  if (now > new Date(contest.end_time))   return 'Ended'
  return 'Active'
}

function statusVariant(s) {
  if (s === 'Active')   return 'accepted'
  if (s === 'Upcoming') return 'warning'
  return 'default'
}

const EMPTY = { id: '', title: '', status: 'All', startFrom: '', endTo: '' }

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

export default function AdminContestsPage() {
  const { data: contests, isLoading } = useAllContests()
  const { mutate: deleteContest, isPending: isDeleting } = useDeleteContest()
  const [pending, setPending] = useState(null)
  const [filters, setFilters] = useState(EMPTY)
  const [sort, setSort] = useState({ field: 'start', dir: 'desc' })

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const filtersActive = Object.keys(EMPTY).some(k => filters[k] !== EMPTY[k])

  const toggleSort = (field) =>
    setSort(s => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))

  const rows = useMemo(() => {
    const out = (contests || []).filter(c => {
      if (filters.id && !String(c.id).includes(filters.id.trim())) return false
      if (filters.title && !(c.title || '').toLowerCase().includes(filters.title.trim().toLowerCase())) return false
      if (filters.status !== 'All' && getContestStatus(c) !== filters.status) return false
      // "Starts on or after" / "ends on or before", so the two form a window.
      if (filters.startFrom && new Date(c.start_time) < new Date(filters.startFrom)) return false
      if (filters.endTo) {
        const endOfDay = new Date(filters.endTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (new Date(c.end_time) > endOfDay) return false
      }
      return true
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    const STATUS_ORDER = { Active: 0, Upcoming: 1, Ended: 2 }

    return out.sort((a, b) => {
      switch (sort.field) {
        case 'title':  return dir * String(a.title || '').localeCompare(String(b.title || ''))
        case 'status': return dir * (STATUS_ORDER[getContestStatus(a)] - STATUS_ORDER[getContestStatus(b)])
        case 'end':    return dir * (new Date(a.end_time) - new Date(b.end_time))
        case 'id':     return dir * (a.id - b.id)
        default:       return dir * (new Date(a.start_time) - new Date(b.start_time))
      }
    })
  }, [contests, filters, sort])

  const pager = usePagination(rows, 25)

  const confirmDelete = () => { deleteContest(pending.id); setPending(null) }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg text-on-surface">Contests</h1>
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            {isLoading ? 'Loading…' : `${rows.length} of ${(contests || []).length} contests`}
          </p>
        </div>
        <Link to="/admin/contests/create" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Create Contest
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <div className="tbl-wrap">
          <div className={`tbl-head ${COLS} items-center gap-3 px-5 py-3`}>
            <SortHeader label="ID"     field="id"     sort={sort} onSort={toggleSort} />
            <SortHeader label="Title"  field="title"  sort={sort} onSort={toggleSort} />
            <SortHeader label="Status" field="status" sort={sort} onSort={toggleSort} />
            <SortHeader label="Start"  field="start"  sort={sort} onSort={toggleSort} />
            <SortHeader label="End"    field="end"    sort={sort} onSort={toggleSort} />
            <span className="text-right">Actions</span>
          </div>

          <div
            className={`${COLS} items-center gap-3 border-b px-5 py-2`}
            style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
          >
            <TextFilter value={filters.id} onChange={v => set('id', v)} placeholder="#" aria-label="Filter by ID" />
            <TextFilter value={filters.title} onChange={v => set('title', v)} placeholder="Search title…" aria-label="Filter by title" />
            <SelectFilter
              value={filters.status}
              onChange={v => set('status', v)}
              aria-label="Filter by status"
              options={['All', 'Active', 'Upcoming', 'Ended']}
            />
            <DateFilter value={filters.startFrom} onChange={v => set('startFrom', v)} aria-label="Starts on or after" title="Starts on or after" />
            <DateFilter value={filters.endTo} onChange={v => set('endTo', v)} aria-label="Ends on or before" title="Ends on or before" />
            <div className="flex justify-end">
              <ClearFilters active={filtersActive} onClear={() => setFilters(EMPTY)} />
            </div>
          </div>

          {pager.pageItems.map(c => {
            const status = getContestStatus(c)
            return (
              <div key={c.id} className={`tbl-row ${COLS} items-center gap-3 px-5 py-3.5`}>
                <span className="font-mono text-xs text-on-surface-variant">{c.id}</span>
                <span className="truncate pr-4 text-body-md text-on-surface" title={c.title}>{c.title}</span>
                <div><Badge variant={statusVariant(status)}>{status}</Badge></div>
                <span className="text-xs text-on-surface-variant">{format(new Date(c.start_time), 'MMM dd, yyyy HH:mm')}</span>
                <span className="text-xs text-on-surface-variant">{format(new Date(c.end_time), 'MMM dd, yyyy HH:mm')}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <Link to={`/admin/contests/${c.id}/edit`}
                    className="rounded border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20">
                    Edit
                  </Link>
                  <Link to={`/admin/contests/${c.id}/questions`}
                    className="rounded border border-secondary/20 bg-secondary/10 px-2.5 py-1.5 text-[11px] font-semibold text-secondary transition-colors hover:bg-secondary/20">
                    Problems
                  </Link>
                  <button
                    onClick={() => setPending({ id: c.id, title: c.title })}
                    disabled={isDeleting}
                    className="rounded border border-error/20 bg-error/10 px-2.5 py-1.5 text-[11px] font-semibold text-error transition-colors hover:bg-error/20 disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            )
          })}

          {rows.length === 0 && (
            <div className="py-16 text-center">
              <div className="mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>
                  {filtersActive ? 'filter_alt_off' : 'emoji_events'}
                </span>
              </div>
              {filtersActive ? (
                <>
                  <p className="text-body-md text-on-surface-variant">No contests match these filters.</p>
                  <button onClick={() => setFilters(EMPTY)} className="btn-ghost mt-2 text-primary">Clear filters</button>
                </>
              ) : (
                <>
                  <p className="text-body-md text-on-surface-variant">No contests yet.</p>
                  <Link to="/admin/contests/create" className="mt-2 inline-block text-body-md text-primary hover:underline">
                    Create your first contest →
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
            label="contests"
          />
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title="Delete contest?"
          message={`"${pending.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
