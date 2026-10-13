import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { TextFilter, SelectFilter, ClearFilters } from '@/components/ui/ColumnFilter'
import usePagination from '@/hooks/usePagination'

const COLS = 'grid grid-cols-[70px_1fr_140px_130px]'

const Icon = ({ name, size = 20, className = '', style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>
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

const EMPTY = { id: '', title: '', difficulty: 'All' }

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

export default function QuestionsPage() {
  const { data: questions, isLoading, error } = useAllQuestions()
  const [params, setParams] = useSearchParams()
  // The top-bar search routes here as ?q=, so it seeds the Title filter.
  const [filters, setFilters] = useState({ ...EMPTY, title: params.get('q') || '' })
  const [sort, setSort] = useState({ field: 'id', dir: 'asc' })

  const filtersActive = Object.keys(EMPTY).some(k => filters[k] !== EMPTY[k])

  const set = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    if (key === 'title') {
      const next = new URLSearchParams(params)
      value ? next.set('q', value) : next.delete('q')
      setParams(next, { replace: true })
    }
  }

  const clearFilters = () => {
    setFilters(EMPTY)
    const next = new URLSearchParams(params)
    next.delete('q')
    setParams(next, { replace: true })
  }

  const toggleSort = (field) =>
    setSort(s => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }))

  const counts = useMemo(() => {
    const all = questions || []
    return {
      total: all.length,
      easy:  all.filter(q => q.difficluty === 'Low').length,
      med:   all.filter(q => q.difficluty === 'Medium').length,
      hard:  all.filter(q => q.difficluty === 'High').length,
    }
  }, [questions])

  const rows = useMemo(() => {
    const out = (questions || []).filter(q => {
      if (filters.id && !String(q.id).includes(filters.id.trim())) return false
      if (filters.title && !(q.title || '').toLowerCase().includes(filters.title.trim().toLowerCase())) return false
      if (filters.difficulty !== 'All' && q.difficluty !== filters.difficulty) return false
      return true
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    const DIFF_ORDER = { Low: 0, Medium: 1, High: 2 }

    return out.sort((a, b) => {
      switch (sort.field) {
        case 'title':      return dir * String(a.title || '').localeCompare(String(b.title || ''))
        case 'difficulty': return dir * ((DIFF_ORDER[a.difficluty] ?? 9) - (DIFF_ORDER[b.difficluty] ?? 9))
        default:           return dir * (a.id - b.id)
      }
    })
  }, [questions, filters, sort])

  const pager = usePagination(rows, 15)

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

        <div
          className="flex items-center gap-4 rounded-xl border px-4 py-2"
          style={{ background: 'var(--surface-cont)', borderColor: 'var(--outline-variant)' }}
        >
          <div className="text-center">
            <span className="label block text-[10px]">Total</span>
            <span className="text-headline-sm tabular-nums text-primary">{counts.total}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Easy</span>
            <span className="text-headline-sm tabular-nums text-primary">{counts.easy}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Medium</span>
            <span className="text-headline-sm tabular-nums text-tertiary">{counts.med}</span>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--outline-variant)' }} />
          <div className="text-center">
            <span className="label block text-[10px]">Hard</span>
            <span className="text-headline-sm tabular-nums text-error">{counts.hard}</span>
          </div>
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
          {/* Header */}
          <div className={`tbl-head ${COLS} items-center gap-3 px-5 py-3`}>
            <SortHeader label="#"          field="id"         sort={sort} onSort={toggleSort} />
            <SortHeader label="Title"      field="title"      sort={sort} onSort={toggleSort} />
            <SortHeader label="Difficulty" field="difficulty" sort={sort} onSort={toggleSort} />
            <span className="text-right">Action</span>
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
            <div className="flex justify-end">
              <ClearFilters active={filtersActive} onClear={clearFilters} />
            </div>
          </div>

          {/* Rows */}
          {pager.pageItems.map(q => (
            <div key={q.id} className={`tbl-row ${COLS} group items-center gap-3 px-5 py-3.5`}>
              <span className="font-mono-code" style={{ color: 'var(--on-surface-variant)' }}>{q.id}</span>
              <Link
                to={`/questions/${q.id}`}
                className="truncate pr-4 text-body-lg text-on-surface transition-colors group-hover:text-primary"
                title={q.title}
              >
                {q.title}
              </Link>
              <div><Badge variant={diffVariant(q.difficluty)}>{diffLabel(q.difficluty)}</Badge></div>
              <div className="flex justify-end">
                <Link
                  to={`/questions/${q.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-3 text-label-md text-primary transition-colors hover:border-primary hover:bg-primary/20"
                >
                  Solve
                  <Icon name="play_arrow" size={16} />
                </Link>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Icon name="search_off" size={32} style={{ color: 'var(--outline)' }} />
              <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                No problems match these filters.
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
