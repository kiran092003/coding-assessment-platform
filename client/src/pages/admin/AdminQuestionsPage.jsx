import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAllQuestions, useDeleteQuestion } from '@/features/questions/hooks/useQuestions'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Pagination from '@/components/ui/Pagination'
import { TextFilter, SelectFilter, ClearFilters } from '@/components/ui/ColumnFilter'
import usePagination from '@/hooks/usePagination'

const COLS = 'grid grid-cols-[70px_1fr_120px_130px_120px_120px_190px]'

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

const EMPTY = { id: '', title: '', difficulty: 'All', returnType: 'All', pool: 'All', created: 'All' }

const CREATED_WINDOWS = {
  '7':  7 * 24 * 3600 * 1000,
  '30': 30 * 24 * 3600 * 1000,
  '90': 90 * 24 * 3600 * 1000,
}

/* Column header that doubles as a sort toggle. */
function SortHeader({ label, field, sort, onSort, align = 'left' }) {
  const active = sort.field === field
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider transition-colors hover:text-primary ${
        align === 'right' ? 'justify-end' : ''
      }`}
      style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}
    >
      {label}
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        {active ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'swap_vert'}
      </span>
    </button>
  )
}

export default function AdminQuestionsPage() {
  const { data: questions, isLoading } = useAllQuestions()
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion()
  const [pending, setPending] = useState(null)
  const [filters, setFilters] = useState(EMPTY)
  const [sort, setSort] = useState({ field: 'id', dir: 'desc' })

  const set = (key, value) => setFilters(f => ({ ...f, [key]: value }))
  const filtersActive = Object.keys(EMPTY).some(k => filters[k] !== EMPTY[k])

  const toggleSort = (field) =>
    setSort(s => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))

  // Return types come from the data, so the filter always matches what exists.
  const returnTypes = useMemo(
    () => ['All', ...Array.from(new Set((questions || []).map(q => q.return_type).filter(Boolean))).sort()],
    [questions],
  )

  const rows = useMemo(() => {
    const now = Date.now()
    const out = (questions || []).filter(q => {
      if (filters.id && !String(q.id).includes(filters.id.trim())) return false
      if (filters.title && !(q.title || '').toLowerCase().includes(filters.title.trim().toLowerCase())) return false
      if (filters.difficulty !== 'All' && q.difficluty !== filters.difficulty) return false
      if (filters.returnType !== 'All' && (q.return_type || '') !== filters.returnType) return false
      if (filters.pool === 'Practice' && q.is_contest_only) return false
      if (filters.pool === 'Contest' && !q.is_contest_only) return false
      if (filters.created !== 'All') {
        const window = CREATED_WINDOWS[filters.created]
        if (!q.created_at || now - new Date(q.created_at).getTime() > window) return false
      }
      return true
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    const DIFF_ORDER = { Low: 0, Medium: 1, High: 2 }

    return out.sort((a, b) => {
      switch (sort.field) {
        case 'title':      return dir * String(a.title || '').localeCompare(String(b.title || ''))
        case 'difficulty': return dir * ((DIFF_ORDER[a.difficluty] ?? 9) - (DIFF_ORDER[b.difficluty] ?? 9))
        case 'returnType': return dir * String(a.return_type || '').localeCompare(String(b.return_type || ''))
        case 'created':    return dir * (new Date(a.created_at || 0) - new Date(b.created_at || 0))
        default:           return dir * (a.id - b.id)
      }
    })
  }, [questions, filters, sort])

  const pager = usePagination(rows, 25)

  const confirmDelete = () => { deleteQuestion(pending.id); setPending(null) }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-lg text-on-surface">Questions</h1>
          <p className="mt-0.5 text-body-md text-on-surface-variant">
            {isLoading ? 'Loading…' : `${rows.length} of ${(questions || []).length} problems`}
          </p>
        </div>
        <Link to="/admin/questions/create" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Create Question
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <div className="tbl-wrap">
          {/* Header */}
          <div className={`tbl-head ${COLS} items-center gap-3 px-5 py-3`}>
            <SortHeader label="ID"      field="id"         sort={sort} onSort={toggleSort} />
            <SortHeader label="Title"   field="title"      sort={sort} onSort={toggleSort} />
            <SortHeader label="Diff"    field="difficulty" sort={sort} onSort={toggleSort} />
            <SortHeader label="Returns" field="returnType" sort={sort} onSort={toggleSort} />
            <span>Pool</span>
            <SortHeader label="Created" field="created"    sort={sort} onSort={toggleSort} />
            <span className="text-right">Actions</span>
          </div>

          {/* Filter row */}
          <div
            className={`${COLS} items-center gap-3 border-b px-5 py-2`}
            style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}
          >
            <TextFilter value={filters.id} onChange={v => set('id', v)} placeholder="#" aria-label="Filter by ID" />
            <TextFilter value={filters.title} onChange={v => set('title', v)} placeholder="Search title…" aria-label="Filter by title" />
            <SelectFilter
              value={filters.difficulty}
              onChange={v => set('difficulty', v)}
              aria-label="Filter by difficulty"
              options={[
                { value: 'All', label: 'All' },
                { value: 'Low', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'Hard' },
              ]}
            />
            <SelectFilter value={filters.returnType} onChange={v => set('returnType', v)} options={returnTypes} aria-label="Filter by return type" />
            <SelectFilter
              value={filters.pool}
              onChange={v => set('pool', v)}
              aria-label="Filter by pool"
              options={[
                { value: 'All', label: 'All' },
                { value: 'Practice', label: 'Practice' },
                { value: 'Contest', label: 'Contest' },
              ]}
            />
            <SelectFilter
              value={filters.created}
              onChange={v => set('created', v)}
              aria-label="Filter by creation date"
              options={[
                { value: 'All', label: 'Any time' },
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
              ]}
            />
            <div className="flex justify-end">
              <ClearFilters active={filtersActive} onClear={() => setFilters(EMPTY)} />
            </div>
          </div>

          {/* Rows */}
          {pager.pageItems.map(q => (
            <div key={q.id} className={`tbl-row ${COLS} items-center gap-3 px-5 py-3.5`}>
              <span className="font-mono text-xs text-on-surface-variant">{q.id}</span>
              <span className="truncate pr-4 text-body-md text-on-surface" title={q.title}>{q.title}</span>
              <div><Badge variant={diffVariant(q.difficluty)}>{diffLabel(q.difficluty)}</Badge></div>
              <span className="truncate font-mono text-xs text-on-surface-variant">{q.return_type || 'int'}</span>
              <div>
                {q.is_contest_only
                  ? <span className="chip chip-system">Contest</span>
                  : <span className="chip chip-neutral">Practice</span>}
              </div>
              <span className="text-xs text-outline">
                {q.created_at ? format(new Date(q.created_at), 'MMM dd, yyyy') : '—'}
              </span>
              <div className="flex items-center justify-end gap-1.5">
                <Link to={`/admin/questions/${q.id}/edit`}
                  className="rounded border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20">
                  Edit
                </Link>
                <Link to={`/admin/questions/${q.id}/testcases`}
                  className="rounded border border-secondary/20 bg-secondary/10 px-2.5 py-1.5 text-[11px] font-semibold text-secondary transition-colors hover:bg-secondary/20">
                  Tests
                </Link>
                <button
                  onClick={() => setPending({ id: q.id, title: q.title })}
                  disabled={isDeleting}
                  className="rounded border border-error/20 bg-error/10 px-2.5 py-1.5 text-[11px] font-semibold text-error transition-colors hover:bg-error/20 disabled:opacity-50">
                  Delete
                </button>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="py-16 text-center">
              <div className="mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>
                  {filtersActive ? 'filter_alt_off' : 'edit_note'}
                </span>
              </div>
              {filtersActive ? (
                <>
                  <p className="text-body-md text-on-surface-variant">No questions match these filters.</p>
                  <button onClick={() => setFilters(EMPTY)} className="btn-ghost mt-2 text-primary">Clear filters</button>
                </>
              ) : (
                <>
                  <p className="text-body-md text-on-surface-variant">No questions yet.</p>
                  <Link to="/admin/questions/create" className="mt-2 inline-block text-body-md text-primary hover:underline">
                    Create your first question →
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
            label="questions"
          />
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title="Delete question?"
          message={`"${pending.title}" and all its test cases will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
