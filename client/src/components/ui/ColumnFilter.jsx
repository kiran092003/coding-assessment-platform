/* Compact inputs sized for a filter row sitting directly under a table head.
   They deliberately look quieter than normal form fields so the filter row
   reads as table chrome rather than a form. */

const base =
  'w-full h-8 rounded border bg-transparent px-2 text-[12px] text-on-surface ' +
  'outline-none transition-colors placeholder:text-outline-variant ' +
  'focus:border-primary'

const style = { borderColor: 'var(--outline-variant)', background: 'var(--surface-container-low)' }

export function TextFilter({ value, onChange, placeholder = 'Filter…', ...rest }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={base}
      style={style}
      {...rest}
    />
  )
}

export function SelectFilter({ value, onChange, options, ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={base + ' cursor-pointer pr-6'}
      style={style}
      {...rest}
    >
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value
        const lbl = typeof o === 'string' ? o : o.label
        return <option key={val} value={val}>{lbl}</option>
      })}
    </select>
  )
}

export function DateFilter({ value, onChange, ...rest }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={base + ' cursor-pointer'}
      style={style}
      {...rest}
    />
  )
}

/* Clears every active filter; rendered in the Actions column of the filter row. */
export function ClearFilters({ active, onClear }) {
  return (
    <button
      onClick={onClear}
      disabled={!active}
      className="flex h-8 items-center justify-center gap-1 rounded px-2 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-30"
      style={{ color: active ? 'var(--primary)' : 'var(--outline)' }}
      title={active ? 'Clear all filters' : 'No filters applied'}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_alt_off</span>
      Clear
    </button>
  )
}
