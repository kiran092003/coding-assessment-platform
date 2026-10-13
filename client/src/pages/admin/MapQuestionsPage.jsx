import { useState } from 'react'
import { format } from 'date-fns'
import {
  useAllContests,
  useContestQuestions,
  useAddContestQuestion,
  useRemoveContestQuestion,
  useUpdateContestQuestionPoints,
} from '@/features/contests/hooks/useContests'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import { useToast, apiErrorMessage } from '@/components/ui/Toast'
import { MAX_QUESTIONS_PER_CONTEST } from '@/lib/constants'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

// ── Helpers ───────────────────────────────────────────────────────────────
function getStatus(contest) {
  const now = new Date()
  if (now < new Date(contest.start_time)) return 'Upcoming'
  if (now > new Date(contest.end_time))   return 'Ended'
  return 'Active'
}
function statusVariant(s) {
  if (s === 'Active')   return 'success'
  if (s === 'Upcoming') return 'info'
  return 'default'
}
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

// ── Inline points editor ──────────────────────────────────────────────────
function PointsCell({ contestId, questionId, initialPoints }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [pts, setPts]         = useState(initialPoints)
  const { mutate, isPending } = useUpdateContestQuestionPoints()

  const save = () =>
    mutate({ contestId, questionId, data: { points: Number(pts) } }, {
      onSuccess: () => { setEditing(false); toast.success('Points updated.') },
      onError: (err) => toast.error(apiErrorMessage(err), { title: 'Could not update points' }),
    })

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
      title="Click to edit"
    >
      {initialPoints} pts
      <svg className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3.414.828.828-3.414a4 4 0 01.828-1.414z" />
      </svg>
    </button>
  )

  return (
    <div className="flex items-center gap-1">
      <input
        type="number" min={1} value={pts} autoFocus
        onChange={e => setPts(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 bg-surface border border-emerald-400/50 text-on-surface rounded px-1.5 py-0.5 text-xs focus:outline-none"
      />
      <button onClick={save} disabled={isPending}
        className="text-xs px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-400 hover:bg-emerald-400/30 disabled:opacity-50">
        {isPending ? '…' : '✓'}
      </button>
      <button onClick={() => setEditing(false)}
        className="text-xs px-1.5 py-0.5 rounded text-outline hover:text-on-surface">
        ✕
      </button>
    </div>
  )
}

// ── Right panel — question mapping for a selected contest ─────────────────
function QuestionPanel({ contestId }) {
  const toast = useToast()
  const { data: contestQuestions, isLoading } = useContestQuestions(contestId)
  const { data: allQuestions }                = useAllQuestions()
  const { mutate: addQuestion,    isPending: isAdding }   = useAddContestQuestion()
  const { mutate: removeQuestion, isPending: isRemoving } = useRemoveContestQuestion()

  const [search,    setSearch]    = useState('')
  const [pending,   setPending]   = useState(null)
  const [pointsMap, setPointsMap] = useState({})

  const contestQIds = new Set((contestQuestions || []).map(q => String(q.id)))
  /* Only the private contest pool is mappable. A practice question would be
     rehearsable (and have readable samples) before the contest opened, so the
     server rejects it too — this filter keeps the UI honest about that. */
  const available   = (allQuestions || []).filter(q =>
    q.is_contest_only &&
    !contestQIds.has(String(q.id)) &&
    (q.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const getPoints = (id) => pointsMap[id] ?? 100
  const setPoints = (id, v) => setPointsMap(p => ({ ...p, [id]: v }))

  const addedCount = (contestQuestions || []).length
  const isFull = addedCount >= MAX_QUESTIONS_PER_CONTEST

  /* The server enforces the cap; saying so up front means the button explains
     itself rather than failing silently when it is pressed. */
  const handleAdd = (qId, title) => {
    if (isFull) {
      toast.warning(
        `This contest already has the maximum of ${MAX_QUESTIONS_PER_CONTEST} questions. Remove one before adding another.`,
        { title: 'Contest is full' },
      )
      return
    }
    addQuestion({ contestId, questionId: qId, points: Number(getPoints(qId)) }, {
      onSuccess: () => {
        setPointsMap(p => { const n = { ...p }; delete n[qId]; return n })
        toast.success(`"${title}" added to the contest.`)
      },
      onError: (err) => toast.error(apiErrorMessage(err), { title: 'Could not add question' }),
    })
  }

  const confirmRemove = () => {
    const title = pending.title
    removeQuestion({ contestId, questionId: pending.id }, {
      onSuccess: () => toast.success(`"${title}" removed from the contest.`),
      onError: (err) => toast.error(apiErrorMessage(err), { title: 'Could not remove question' }),
    })
    setPending(null)
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Current questions ─────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-container-high bg-surface-container">
          <span className="text-on-surface text-xs font-semibold uppercase tracking-wider">
            Added Questions
          </span>
          <span className={`text-xs ${isFull ? 'text-tertiary' : 'text-outline'}`}>
            {addedCount} / {MAX_QUESTIONS_PER_CONTEST}{isFull ? ' — full' : ''}
          </span>
        </div>

        {(contestQuestions || []).length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-outline text-sm">No questions yet — add some below.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0b0e14]">
            {(contestQuestions || []).map((q, i) => (
              <div key={q.id} className="grid grid-cols-[24px_1fr_100px_130px_80px] items-center px-5 py-2.5 hover:bg-surface-container transition-colors gap-3">
                <span className="text-outline text-xs font-mono">{i + 1}</span>
                <span className="text-on-surface text-sm truncate">{q.title}</span>
                <Badge variant={diffVariant(q.difficluty)} dot={false}>{diffLabel(q.difficluty)}</Badge>
                <PointsCell contestId={contestId} questionId={String(q.id)} initialPoints={q.points} />
                <div className="flex justify-end">
                  <button
                    onClick={() => setPending({ id: q.id, title: q.title })}
                    disabled={isRemoving}
                    className="px-2 py-1 rounded text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Available questions ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-outline-variant">
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-container-high bg-surface-container-low flex-shrink-0">
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
            Available Questions
          </span>
          <div className="relative">
            <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1 bg-surface border border-outline-variant text-on-surface placeholder-[#8c909f] rounded-lg text-xs focus:outline-none focus:border-emerald-400/40 w-40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {available.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mb-2"><span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--outline)' }}>{search ? 'search_off' : 'check_circle'}</span></div>
              <p className="text-outline text-sm">
                {search ? `No results for "${search}"` : 'All questions have been added.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#0b0e14]">
              {available.map((q, i) => (
                <div key={q.id} className="grid grid-cols-[24px_1fr_100px_90px_80px] items-center px-5 py-2.5 hover:bg-surface-container transition-colors gap-3">
                  <span className="text-outline text-xs font-mono">{i + 1}</span>
                  <span className="text-on-surface-variant text-sm truncate">{q.title}</span>
                  <Badge variant={diffVariant(q.difficluty)} dot={false}>{diffLabel(q.difficluty)}</Badge>
                  <input
                    type="number" min={1}
                    value={getPoints(q.id)}
                    onChange={e => setPoints(q.id, e.target.value)}
                    className="w-16 bg-surface border border-outline-variant text-on-surface rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-400/40"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleAdd(q.id, q.title)}
                      disabled={isAdding || isFull}
                      title={isFull
                        ? `A contest can hold at most ${MAX_QUESTIONS_PER_CONTEST} questions`
                        : 'Add this question to the contest'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pending && (
        <ConfirmDialog
          title="Remove question?"
          message={`"${pending.title}" will be removed from this contest.`}
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function MapQuestionsPage() {
  const { data: contests, isLoading } = useAllContests()
  const [selectedId, setSelectedId]   = useState(null)
  const [contestSearch, setContestSearch] = useState('')

  const selected = (contests || []).find(c => c.id === selectedId)

  const filteredContests = (contests || []).filter(c =>
    (c.title || '').toLowerCase().includes(contestSearch.toLowerCase())
  )

  return (
    <div className="page-fill animate-fade-in flex flex-col">

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-display-lg text-on-surface">Map Questions to Contests</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Select a contest and assign questions with custom points</p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="card overflow-hidden flex min-h-0 flex-1">

        {/* ── Left: contest list ─────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-surface-container-high flex flex-col">

          {/* Contest search */}
          <div className="p-3 border-b border-surface-container-high">
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Find contest…"
                value={contestSearch}
                onChange={e => setContestSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant text-on-surface placeholder-[#8c909f] rounded-lg text-xs focus:outline-none focus:border-emerald-400/40"
              />
            </div>
          </div>

          {/* Contest items */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : filteredContests.length === 0 ? (
              <div className="px-4 py-8 text-center text-outline text-sm">No contests found</div>
            ) : (
              filteredContests.map(c => {
                const status   = getStatus(c)
                const isActive = c.id === selectedId
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-outline-variant transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-400/8 border-l-2 border-l-emerald-400'
                        : 'hover:bg-surface-container border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`text-sm font-medium leading-snug line-clamp-2 ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {c.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(status)}>{status}</Badge>
                      <span className="text-outline text-xs">{format(new Date(c.start_time), 'MMM dd')}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right: question mapping ────────────────────────────────── */}
        {selectedId ? (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="px-5 py-3.5 border-b border-surface-container-high bg-surface-container-low flex-shrink-0 flex items-center justify-between">
              <div>
                <p className="text-on-surface font-semibold text-sm">{selected?.title}</p>
                <p className="text-outline text-xs mt-0.5">
                  {format(new Date(selected?.start_time), 'MMM dd, yyyy HH:mm')} → {format(new Date(selected?.end_time), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <Badge variant={statusVariant(getStatus(selected))}>{getStatus(selected)}</Badge>
            </div>
            <QuestionPanel contestId={String(selectedId)} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low">
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--outline)' }}>account_tree</span>
            </div>
            <p className="text-on-surface font-semibold">Select a contest</p>
            <p className="text-outline text-sm max-w-xs">
              Pick a contest from the left panel to view and manage its questions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
