import { Link, useParams } from 'react-router-dom'
import { useContest } from '@/features/contests/hooks/useContests'
import { useRealtimeLeaderboard } from '@/features/leaderboard/hooks/useLeaderboard'
import Spinner from '@/components/ui/Spinner'

const MEDALS = ['🥇', '🥈', '🥉']

const rankColors = {
  1: { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', glow: 'rgba(245,158,11,0.15)' },
  2: { text: 'text-slate-300',  bg: 'bg-slate-400/10 border-slate-400/25',  glow: 'rgba(148,163,184,0.1)' },
  3: { text: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-600/25',  glow: 'rgba(180,83,9,0.1)' },
}

function PodiumCard({ entry, rank }) {
  const colors = rankColors[rank]
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }
  const orders  = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }

  return (
    <div className={`flex flex-col items-center gap-3 ${orders[rank]}`}>
      <div className={`card border ${colors.bg} p-5 text-center min-w-[140px] rounded-2xl`}
           style={{ boxShadow: `0 0 24px ${colors.glow}` }}>
        <div className="text-3xl mb-2">{MEDALS[rank - 1]}</div>
        <div className="text-white font-bold text-sm truncate max-w-[120px]">{entry.name}</div>
        <div className={`text-2xl font-bold mt-1 ${colors.text}`}>{entry.score}</div>
        <div className="text-[#454A68] text-xs mt-1">{entry.solvedCount} solved</div>
      </div>
      <div className={`w-full rounded-t-lg ${colors.bg} border border-b-0 flex items-end justify-center pb-2 ${heights[rank]}`}
           style={{ borderColor: colors.bg.split(' ')[1] }}>
        <span className={`text-2xl font-black ${colors.text}`}>#{rank}</span>
      </div>
    </div>
  )
}

export default function ContestLeaderboardPage() {
  const { id } = useParams()
  const { data: contest, isLoading: cLoading } = useContest(id)
  const { leaderboard, connected } = useRealtimeLeaderboard(id)

  if (cLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const top3 = leaderboard.slice(0, 3)
  const rest  = leaderboard.slice(3)

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link to={`/contests/${id}`} className="text-[#8890B0] hover:text-white transition-colors text-sm flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {contest?.title || 'Contest'}
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Leaderboard
          </h1>
          <p className="text-[#8890B0] text-sm mt-0.5">{contest?.title}</p>
        </div>

        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border text-sm font-medium ${
          connected
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            : 'bg-[#171828] border-[#20233A] text-[#8890B0]'
        }`}>
          {connected
            ? <span className="dot-live" style={{ width: 8, height: 8 }} />
            : <span className="dot-offline" />
          }
          {connected ? 'Live updates' : 'Connecting...'}
        </div>
      </div>

      {/* Podium (top 3) */}
      {top3.length >= 2 && (
        <div className="card p-8 dot-grid">
          <h2 className="text-center text-[#454A68] text-xs font-semibold uppercase tracking-widest mb-8">Top Performers</h2>
          <div className="flex items-end justify-center gap-4 max-w-md mx-auto">
            {[
              top3[1] && { entry: top3[1], rank: 2 },
              top3[0] && { entry: top3[0], rank: 1 },
              top3[2] && { entry: top3[2], rank: 3 },
            ].filter(Boolean).map(({ entry, rank }) => (
              <PodiumCard key={entry.userId} entry={entry} rank={rank} />
            ))}
          </div>
        </div>
      )}

      {/* Full table */}
      <div>
        <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-widest text-[#8890B0]">
          {leaderboard.length > 0 ? `All Participants (${leaderboard.length})` : 'Rankings'}
        </h2>

        <div className="tbl-wrap">
          <div className="tbl-head grid grid-cols-[64px_1fr_120px_100px] px-5 py-3">
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Rank</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Participant</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Score</span>
            <span className="text-[#454A68] text-xs font-semibold uppercase tracking-wider">Solved</span>
          </div>

          {leaderboard.map((entry, i) => {
            const rankColor = rankColors[entry.rank]
            const isTop3 = entry.rank <= 3
            return (
              <div
                key={entry.userId}
                className={`tbl-row grid grid-cols-[64px_1fr_120px_100px] px-5 py-3.5 items-center animate-slide-up`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-2">
                  {isTop3
                    ? <span className="text-xl">{MEDALS[entry.rank - 1]}</span>
                    : <span className={`text-sm font-bold ${rankColor ? rankColor.text : 'text-[#8890B0]'}`}>#{entry.rank}</span>
                  }
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-700 to-arena-600 flex items-center justify-center text-white text-xs font-bold border border-arena-600">
                    {(entry.name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-medium">{entry.name}</span>
                </div>
                <div>
                  <span className={`text-sm font-bold ${isTop3 && rankColor ? rankColor.text : 'text-emerald-400'}`}>
                    {entry.score}
                  </span>
                  <span className="text-[#454A68] text-xs ml-1">pts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8890B0] text-sm">{entry.solvedCount}</span>
                  <span className="text-[#454A68] text-xs">solved</span>
                </div>
              </div>
            )
          })}

          {leaderboard.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">🏁</div>
              <p className="text-[#8890B0] text-sm">
                {connected ? 'No submissions yet. Waiting for participants...' : 'Connecting to leaderboard...'}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
