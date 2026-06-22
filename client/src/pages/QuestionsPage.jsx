import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

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
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('All')

  const filtered = (questions || []).filter(q => {
    const matchSearch = (q.title || '').toLowerCase().includes(search.toLowerCase())
    const matchDiff   = difficulty === 'All' || q.difficluty === difficulty
    return matchSearch && matchDiff
  })

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Problems{' '}
          <span className="text-[#454A68] text-lg font-normal">
            ({isLoading ? '…' : filtered.length})
          </span>
        </h1>
        <p className="text-[#8890B0] text-sm mt-1">Solve problems, improve your skills</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#454A68]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl border border-[#20233A] bg-[#0E0F18]">
          {DIFFS.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                difficulty === d
                  ? 'bg-[#171828] text-white border border-[#20233A] shadow-sm'
                  : 'text-[#8890B0] hover:text-white'
              }`}
            >
              {DIFF_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">Failed to load problems. Please try again.</div>
      ) : (
        <div className="tbl-wrap">
          <div className="tbl-head grid grid-cols-[48px_1fr_140px_100px] px-5 py-3">
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">#</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Title</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Difficulty</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider text-right">Action</span>
          </div>

          {filtered.map((q, idx) => (
            <div key={q.id} className="tbl-row grid grid-cols-[48px_1fr_140px_100px] px-5 py-3.5 items-center group">
              <span className="text-[#454A68] text-sm font-mono">{String(idx + 1).padStart(2, '0')}</span>
              <Link to={`/questions/${q.id}`} className="text-white text-sm font-medium hover:text-emerald-400 transition-colors truncate pr-4">
                {q.title}
              </Link>
              <div>
                <Badge variant={diffVariant(q.difficluty)} dot={false}>
                  {diffLabel(q.difficluty)}
                </Badge>
              </div>
              <div className="flex justify-end">
                <Link
                  to={`/questions/${q.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200"
                >
                  Solve
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-[#8890B0] text-sm">No problems match your search.</p>
              <button onClick={() => { setSearch(''); setDifficulty('All') }}
                className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm transition-colors">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
