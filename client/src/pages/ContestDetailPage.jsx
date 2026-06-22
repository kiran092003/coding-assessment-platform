import { Link, useParams } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { useContest, useContestQuestions, useMyRegistration, useRegisterContest } from '@/features/contests/hooks/useContests'
import { useMyContestEntry } from '@/features/leaderboard/hooks/useLeaderboard'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

function getContestStatus(contest) {
  const now = new Date()
  if (now < new Date(contest.start_time)) return 'Upcoming'
  if (now > new Date(contest.end_time))   return 'Ended'
  return 'Active'
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

export default function ContestDetailPage() {
  const { id } = useParams()
  const { data: contest, isLoading: cLoading } = useContest(id)
  const { data: questions, isLoading: qLoading } = useContestQuestions(id)
  const { data: myEntry } = useMyContestEntry(id)
  const { data: regData, isLoading: regLoading } = useMyRegistration(id)
  const register = useRegisterContest(id)

  if (cLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!contest)  return <div className="text-red-400 text-center py-8">Contest not found.</div>

  const status       = getContestStatus(contest)
  const registered   = regData?.registered ?? false
  const regCount     = regData?.registrationCount ?? 0
  const userCompleted = myEntry?.hasEnded
  const canEnter     = registered && status === 'Active' && !userCompleted

  const statusVariant = status === 'Active' ? 'success' : status === 'Upcoming' ? 'info' : 'default'
  const start = new Date(contest.start_time)
  const end   = new Date(contest.end_time)

  const RegisterBtn = ({ size = 'sm' }) => (
    <button
      onClick={() => register.mutate()}
      disabled={register.isPending || regLoading}
      className={`inline-flex items-center justify-center gap-2 ${size === 'lg' ? 'px-6 py-2.5 text-sm' : 'px-5 py-2.5 text-sm'} rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-60 transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.25)]`}
    >
      {register.isPending ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )}
      Register
    </button>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Contest header card */}
      <div className="relative overflow-hidden card p-6 md:p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={statusVariant}>{status}</Badge>
                {registered && status !== 'Ended' && (
                  <span className="inline-flex items-center gap-1 text-xs text-violet-400 font-medium bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Registered
                  </span>
                )}
                {status === 'Active' && (
                  <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="dot-live" style={{ width: 6, height: 6 }} />
                    Ends {formatDistanceToNow(end, { addSuffix: true })}
                  </span>
                )}
                {status === 'Upcoming' && (
                  <span className="text-xs text-blue-400 font-medium">
                    Starts {formatDistanceToNow(start, { addSuffix: true })}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{contest.title}</h1>
              {contest.description && (
                <p className="text-[#8890B0] text-sm leading-relaxed">{contest.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              {/* Action button based on state */}
              {status === 'Ended' ? (
                userCompleted ? (
                  <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Completed · {myEntry.score} pts
                  </div>
                ) : null
              ) : !registered ? (
                <RegisterBtn />
              ) : status === 'Upcoming' ? (
                <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  You're Registered
                </div>
              ) : userCompleted ? (
                <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed · {myEntry.score} pts
                </div>
              ) : (
                <Link
                  to={`/contests/${id}/arena`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Test
                </Link>
              )}

              <Link
                to={`/contests/${id}/leaderboard`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Start date',    value: format(start, 'MMM dd, yyyy') },
              { label: 'Start at',      value: format(start, 'HH:mm') },
              { label: 'End date',      value: format(end, 'MMM dd, yyyy') },
              { label: 'End at',        value: format(end, 'HH:mm') },
              { label: 'Participants',  value: regCount },
            ].map(item => (
              <div key={item.label} className="bg-[#0E0F18] rounded-xl p-3.5 border border-[#15172A]">
                <p className="text-[#454A68] text-xs mb-1">{item.label}</p>
                <p className="text-white font-semibold text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Problems */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Problems</h2>

        {status === 'Upcoming' && !registered ? (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">📋</div>
            <p className="text-white font-semibold text-lg">Register to participate</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              This contest hasn't started yet. Register now to secure your spot and get access when it goes live.
            </p>
            <RegisterBtn size="lg" />
          </div>

        ) : status === 'Upcoming' && registered ? (
          <div className="card p-10 text-center space-y-3">
            <div className="text-5xl">🎯</div>
            <p className="text-white font-semibold text-lg">You're all set!</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              Contest starts {formatDistanceToNow(start, { addSuffix: true })}. Come back then to enter the arena.
            </p>
          </div>

        ) : status === 'Active' && !registered ? (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">🔐</div>
            <p className="text-white font-semibold text-lg">Registration required</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              Register to enter the contest arena and start solving problems.
            </p>
            <RegisterBtn size="lg" />
          </div>

        ) : status === 'Active' && userCompleted ? (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <p className="text-white font-semibold text-lg">You've completed the test!</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              You solved {myEntry.solvedCount} of {myEntry.totalQuestions} problem{myEntry.totalQuestions !== 1 ? 's' : ''} and earned{' '}
              <span className="text-emerald-400 font-semibold">{myEntry.score} points</span>.
            </p>
            <Link
              to={`/contests/${id}/leaderboard`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Leaderboard
            </Link>
          </div>

        ) : status === 'Active' ? (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">🏁</div>
            <p className="text-white font-semibold text-lg">Contest is live!</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              Problems are only accessible inside the contest arena. Click <strong className="text-white">Start Test</strong> to enter.
            </p>
            <Link
              to={`/contests/${id}/arena`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Test
            </Link>
          </div>

        ) : status === 'Ended' ? (
          <div className="card p-10 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-white font-semibold text-lg">Contest Ended</p>
            <p className="text-[#8890B0] text-sm max-w-sm mx-auto">
              This contest has ended. Check the leaderboard to see the final standings.
            </p>
            <Link
              to={`/contests/${id}/leaderboard`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Leaderboard
            </Link>
          </div>

        ) : qLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : null}
      </div>
    </div>
  )
}
