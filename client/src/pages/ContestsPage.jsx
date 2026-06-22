import { Link } from 'react-router-dom'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { useAllContests } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

function getContestStatus(contest) {
  const now   = new Date()
  const start = new Date(contest.start_time)
  const end   = new Date(contest.end_time)
  if (now < start) return 'Upcoming'
  if (now > end)   return 'Ended'
  return 'Active'
}

function statusVariant(s) {
  if (s === 'Active')   return 'success'
  if (s === 'Upcoming') return 'info'
  return 'default'
}

const statusIcons = { Active: '🟢', Upcoming: '🔵', Ended: '⚫' }

const accentGradients = [
  'from-emerald-500/20 to-transparent',
  'from-violet-500/20 to-transparent',
  'from-blue-500/20 to-transparent',
  'from-amber-500/20 to-transparent',
  'from-rose-500/20 to-transparent',
  'from-cyan-500/20 to-transparent',
]

export default function ContestsPage() {
  const { data: contests, isLoading, error } = useAllContests()

  return (
    <div className="space-y-6 animate-fade-in">

      <div>
        <h1 className="text-2xl font-bold text-white">Contests</h1>
        <p className="text-[#8890B0] text-sm mt-1">Compete against other developers and earn points</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">Failed to load contests.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(contests || []).map((contest, i) => {
            const status = getContestStatus(contest)
            const start  = new Date(contest.start_time)
            const end    = new Date(contest.end_time)
            const isLive = status === 'Active'
            const gradient = accentGradients[i % accentGradients.length]

            return (
              <Link key={contest.id} to={`/contests/${contest.id}`}
                className="card-hover group block p-6 relative overflow-hidden">

                {/* Top gradient accent */}
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${gradient} opacity-50 pointer-events-none`} />

                <div className="relative z-10">
                  {/* Status */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={statusVariant(status)}>
                      {statusIcons[status]} {status}
                    </Badge>
                    {isLive && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="dot-live" style={{ width: 6, height: 6 }} />
                        Live now
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-white font-bold text-base group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                    {contest.title}
                  </h2>

                  {contest.description && (
                    <p className="text-[#8890B0] text-xs line-clamp-2 mb-4">{contest.description}</p>
                  )}

                  {/* Time info */}
                  <div className="space-y-2 pt-4 border-t border-[#15172A]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#454A68]">Starts</span>
                      <span className="text-[#8890B0]">{format(start, 'MMM dd · HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#454A68]">Ends</span>
                      <span className="text-[#8890B0]">{format(end, 'MMM dd · HH:mm')}</span>
                    </div>
                    {status === 'Active' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#454A68]">Ends in</span>
                        <span className="text-amber-400 font-medium">{formatDistanceToNow(end)}</span>
                      </div>
                    )}
                    {status === 'Upcoming' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#454A68]">Starts in</span>
                        <span className="text-blue-400 font-medium">{formatDistanceToNow(start)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}

          {(!contests || contests.length === 0) && (
            <div className="col-span-3 text-center py-20">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-[#8890B0]">No contests available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
