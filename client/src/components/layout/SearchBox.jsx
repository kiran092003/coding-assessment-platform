import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import { useAllContests } from '@/features/contests/hooks/useContests'

const MAX_PER_GROUP = 5

const Icon = ({ name, size = 18, className = '', style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>
)

const DIFF_CHIP = { Low: 'chip-easy', Medium: 'chip-medium', High: 'chip-hard' }
const DIFF_LABEL = { Low: 'Easy', Medium: 'Medium', High: 'Hard' }

/* Wraps the matched run in the suggestion so it is obvious why a row matched. */
function Highlight({ text, query }) {
  const at = text.toLowerCase().indexOf(query.toLowerCase())
  if (!query || at === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-primary">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  )
}

export default function SearchBox() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  // Both lists are already cached by React Query for the rest of the app, so
  // suggestions cost no extra requests.
  const { data: questions } = useAllQuestions()
  const { data: contests } = useAllContests()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []

    const matched = (list, type) =>
      (list || [])
        .filter(item => (item.title || '').toLowerCase().includes(q))
        // Prefix matches first — they are nearly always what was meant.
        .sort((a, b) => {
          const ai = a.title.toLowerCase().indexOf(q)
          const bi = b.title.toLowerCase().indexOf(q)
          return ai - bi || a.title.localeCompare(b.title)
        })
        .slice(0, MAX_PER_GROUP)
        .map(item => ({ ...item, type }))

    return [...matched(questions, 'question'), ...matched(contests, 'contest')]
  }, [query, questions, contests])

  // Keep the highlighted row in range as the result list changes.
  useEffect(() => { setActive(0) }, [query])

  // Close when focus or the pointer leaves the control.
  useEffect(() => {
    const onDocDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  const go = (item) => {
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    navigate(item.type === 'contest' ? `/contests/${item.id}` : `/questions/${item.id}`)
  }

  const seeAll = () => {
    setOpen(false)
    navigate(query.trim() ? `/questions?q=${encodeURIComponent(query.trim())}` : '/questions')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return }
    if (!open || results.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); seeAll() }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % (results.length + 1)) // +1 for the "see all" row
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i - 1 + results.length + 1) % (results.length + 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      active < results.length ? go(results[active]) : seeAll()
    }
  }

  const showPanel = open && query.trim().length > 0

  return (
    <div ref={boxRef} className="relative hidden sm:block">
      <Icon
        name="search"
        size={20}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--on-surface-variant)' }}
      />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search problems, contests…"
        className="input-field h-9 w-64 rounded-full pl-10 pr-9 focus:w-80"
        style={{ transition: 'width 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease' }}
        role="combobox"
        aria-expanded={showPanel}
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-label="Search problems and contests"
      />

      {query && (
        <button
          onClick={() => { setQuery(''); inputRef.current?.focus() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-on-surface"
          style={{ color: 'var(--on-surface-variant)' }}
          aria-label="Clear search"
          type="button"
        >
          <Icon name="close" size={16} />
        </button>
      )}

      {showPanel && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute right-0 top-11 z-50 w-96 overflow-hidden rounded-xl border shadow-level-3"
          style={{ background: 'var(--surface-highest)', borderColor: 'var(--outline-variant)' }}
        >
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Icon name="search_off" size={28} style={{ color: 'var(--outline)' }} />
              <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Nothing matches “{query.trim()}”.
              </p>
            </div>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto py-1">
              {results.map((item, i) => {
                const isContest = item.type === 'contest'
                // A group heading each time the type changes.
                const heading = i === 0 || results[i - 1].type !== item.type
                return (
                  <div key={`${item.type}-${item.id}`}>
                    {heading && (
                      <p className="label px-3 pb-1 pt-2" style={{ color: 'var(--outline)' }}>
                        {isContest ? 'Contests' : 'Problems'}
                      </p>
                    )}
                    <button
                      role="option"
                      aria-selected={active === i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
                      style={{ background: active === i ? 'var(--surface-bright)' : 'transparent' }}
                    >
                      <Icon
                        name={isContest ? 'emoji_events' : 'code'}
                        size={18}
                        style={{ color: active === i ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                      />
                      <span className="min-w-0 flex-1 truncate text-body-md text-on-surface">
                        <Highlight text={item.title || ''} query={query.trim()} />
                      </span>
                      {!isContest && item.difficluty && (
                        <span className={`chip ${DIFF_CHIP[item.difficluty] || 'chip-neutral'} flex-shrink-0`}>
                          {DIFF_LABEL[item.difficluty] || item.difficluty}
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onMouseEnter={() => setActive(results.length)}
            onClick={seeAll}
            className="flex w-full items-center justify-between border-t px-3 py-2.5 text-left transition-colors"
            style={{
              borderColor: 'var(--outline-variant)',
              background: active === results.length ? 'var(--surface-bright)' : 'var(--surface-high)',
            }}
          >
            <span className="label text-primary">Search all problems</span>
            <span className="label flex items-center gap-1" style={{ color: 'var(--outline)' }}>
              Enter
              <Icon name="keyboard_return" size={14} />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
