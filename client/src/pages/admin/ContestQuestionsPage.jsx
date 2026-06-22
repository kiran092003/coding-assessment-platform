import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useContest,
  useContestQuestions,
  useAddContestQuestion,
  useRemoveContestQuestion,
  useUpdateContestQuestionPoints,
} from '@/features/contests/hooks/useContests'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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

// ── Inline points editor on existing questions ────────────────────────────
function PointsCell({ contestId, questionId, initialPoints }) {
  const [editing, setEditing]   = useState(false)
  const [pts, setPts]           = useState(initialPoints)
  const { mutate, isPending }   = useUpdateContestQuestionPoints()

  const save = () => {
    mutate(
      { contestId, questionId, data: { points: Number(pts) } },
      { onSuccess: () => setEditing(false) }
    )
  }

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
      title="Click to edit"
    >
      {initialPoints} pts
      <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3.414.828.828-3.414a4 4 0 01.828-1.414z" />
      </svg>
    </button>
  )

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" min={1} value={pts} autoFocus
        onChange={e => setPts(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="w-20 bg-[#06070C] border border-emerald-500/50 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-emerald-400"
      />
      <button onClick={save} disabled={isPending}
        className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors">
        {isPending ? '…' : '✓'}
      </button>
      <button onClick={() => setEditing(false)}
        className="px-2 py-1 rounded-lg text-xs font-medium text-[#454A68] hover:text-white transition-colors">
        ✕
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ContestQuestionsPage() {
  const { id } = useParams()
  const { data: contest }                               = useContest(id)
  const { data: contestQuestions, isLoading: cqLoading } = useContestQuestions(id)
  const { data: allQuestions }                          = useAllQuestions()
  const { mutate: addQuestion,    isPending: isAdding } = useAddContestQuestion()
  const { mutate: removeQuestion, isPending: isRemoving } = useRemoveContestQuestion()

  const [search,  setSearch]  = useState('')
  const [pending, setPending] = useState(null)       // { id, title } for remove confirm
  const [pointsMap, setPointsMap] = useState({})     // questionId → points for "add" rows

  const contestQIds    = new Set((contestQuestions || []).map(q => String(q.id)))
  const availableQuestions = (allQuestions || []).filter(q =>
    !contestQIds.has(String(q.id)) &&
    (q.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const getPoints = (qId) => pointsMap[qId] ?? 100
  const setPoints = (qId, val) => setPointsMap(p => ({ ...p, [qId]: val }))

  const handleAdd = (questionId) => {
    addQuestion(
      { contestId: id, questionId, points: Number(getPoints(questionId)) },
      { onSuccess: () => setPointsMap(p => { const n = { ...p }; delete n[questionId]; return n }) }
    )
  }

  const handleRemove = (q) => setPending({ id: q.id, title: q.title })
  const confirmRemove = () => { removeQuestion({ contestId: id, questionId: pending.id }); setPending(null) }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/contests"
          className="flex items-center gap-1.5 text-[#8890B0] hover:text-white transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {contest?.title || <span className="opacity-40">Loading…</span>}
          </h1>
          <p className="text-[#8890B0] text-sm mt-0.5">Manage questions for this contest</p>
        </div>
      </div>

      {/* ── Current questions ────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#15172A]">
          <div>
            <h2 className="text-white font-semibold text-sm">Contest Questions</h2>
            <p className="text-[#454A68] text-xs mt-0.5">{(contestQuestions || []).length} question{(contestQuestions || []).length !== 1 ? 's' : ''} added</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 text-xs font-bold">{(contestQuestions || []).length}</span>
          </div>
        </div>

        {cqLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (contestQuestions || []).length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[#8890B0] text-sm">No questions added yet.</p>
            <p className="text-[#454A68] text-xs mt-1">Add questions from the list below.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[32px_1fr_120px_140px_100px] px-5 py-2.5 bg-[#171828] border-b border-[#15172A]">
              {['#', 'Title', 'Difficulty', 'Points', 'Action'].map(h => (
                <span key={h} className="text-[#454A68] text-xs font-semibold uppercase tracking-wider last:text-right">{h}</span>
              ))}
            </div>
            {(contestQuestions || []).map((q, idx) => (
              <div key={q.id} className="grid grid-cols-[32px_1fr_120px_140px_100px] px-5 py-3.5 items-center border-b border-[#0A0B14] last:border-0 hover:bg-[#171828] transition-colors">
                <span className="text-[#454A68] text-xs font-mono">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-white text-sm font-medium truncate pr-4">{q.title}</span>
                <div><Badge variant={diffVariant(q.difficluty)} dot={false}>{diffLabel(q.difficluty)}</Badge></div>
                <PointsCell contestId={id} questionId={String(q.id)} initialPoints={q.points} />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemove(q)}
                    disabled={isRemoving}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 disabled:opacity-50 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Add questions ────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#15172A]">
          <div>
            <h2 className="text-white font-semibold text-sm">Add Questions</h2>
            <p className="text-[#454A68] text-xs mt-0.5">{availableQuestions.length} available</p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#454A68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search questions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-1.5 bg-[#06070C] border border-[#20233A] text-white placeholder-[#454A68] rounded-lg text-xs focus:outline-none focus:border-emerald-500/50 w-52"
            />
          </div>
        </div>

        {availableQuestions.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-4xl mb-3">{search ? '🔍' : '✅'}</div>
            <p className="text-[#8890B0] text-sm">
              {search ? `No questions match "${search}"` : 'All questions have been added to this contest.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[32px_1fr_120px_120px_140px] px-5 py-2.5 bg-[#171828] border-b border-[#15172A]">
              {['#', 'Title', 'Difficulty', 'Points', 'Action'].map(h => (
                <span key={h} className="text-[#454A68] text-xs font-semibold uppercase tracking-wider last:text-right">{h}</span>
              ))}
            </div>
            {availableQuestions.map((q, idx) => (
              <div key={q.id} className="grid grid-cols-[32px_1fr_120px_120px_140px] px-5 py-3.5 items-center border-b border-[#0A0B14] last:border-0 hover:bg-[#171828] transition-colors">
                <span className="text-[#454A68] text-xs font-mono">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-white text-sm font-medium truncate pr-4">{q.title}</span>
                <div><Badge variant={diffVariant(q.difficluty)} dot={false}>{diffLabel(q.difficluty)}</Badge></div>

                {/* Points input per question */}
                <input
                  type="number" min={1}
                  value={getPoints(q.id)}
                  onChange={e => setPoints(q.id, e.target.value)}
                  className="w-20 bg-[#06070C] border border-[#20233A] text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => handleAdd(q.id)}
                    disabled={isAdding}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50 transition-all"
                  >
                    {isAdding ? (
                      <span className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Add
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Remove confirm dialog */}
      {pending && (
        <ConfirmDialog
          title="Remove question?"
          message={`"${pending.title}" will be removed from this contest. Scores already earned will not be affected.`}
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}
