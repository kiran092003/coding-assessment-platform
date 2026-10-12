const Icon = ({ name }) => (
  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{name}</span>
)

/**
 * Builds the page list with ellipses: always the first and last page, plus a
 * window around the current one, so the control stays a fixed width whether
 * there are 3 pages or 300.
 */
function pageList(current, count) {
  const pages = []
  for (let p = 1; p <= count; p++) {
    if (p === 1 || p === count || Math.abs(p - current) <= 1) pages.push(p)
  }
  return pages
}

export default function Pagination({
  page,
  pageCount,
  total,
  from,
  to,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  label = 'items',
}) {
  if (!total) return null

  const pages = pageList(page, pageCount)

  return (
    <div className="tbl-footer flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-4">
        <span className="label">Showing {from}–{to} of {total} {label}</span>

        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span className="label">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input-field h-8 w-auto cursor-pointer py-0 pl-2 pr-7 text-label-md"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded border transition-colors disabled:opacity-30"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
          aria-label="Previous page"
        >
          <Icon name="chevron_left" />
        </button>

        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-2">
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span style={{ color: 'var(--on-surface-variant)' }}>…</span>
            )}
            <button
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-label-md transition-colors ${
                p === page ? 'bg-primary text-on-primary' : 'border text-on-surface-variant hover:text-primary'
              }`}
              style={p === page ? undefined : { borderColor: 'var(--outline-variant)' }}
            >
              {p}
            </button>
          </span>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className="flex h-8 w-8 items-center justify-center rounded border transition-colors disabled:opacity-30"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
          aria-label="Next page"
        >
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  )
}
