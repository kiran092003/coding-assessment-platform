import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import { useAllContests } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

function getContestStatus(contest) {
  const now = new Date()
  if (now < new Date(contest.start_time)) return 'Upcoming'
  if (now > new Date(contest.end_time)) return 'Ended'
  return 'Active'
}

function diffVariant(d) {
  const l = (d || '').toLowerCase()
  if (l === 'low') return 'success'
  if (l === 'medium') return 'warning'
  if (l === 'high') return 'danger'
  return 'default'
}

function diffLabel(d) {
  if (!d) return 'N/A'
  if (d === 'Low') return 'Easy'
  if (d === 'High') return 'Hard'
  return d
}

function statusVariant(s) {
  if (s === 'Active') return 'success'
  if (s === 'Upcoming') return 'info'
  return 'default'
}

const STAT_COLORS = {
  emerald: { from: '#10B981', to: '#059669', glow: 'rgba(16,185,129,0.12)', bar: '#10B981' },
  violet:  { from: '#7C3AED', to: '#5B21B6', glow: 'rgba(124,58,237,0.12)', bar: '#7C3AED' },
  amber:   { from: '#F59E0B', to: '#D97706', glow: 'rgba(245,158,11,0.12)', bar: '#F59E0B' },
  blue:    { from: '#3B82F6', to: '#2563EB', glow: 'rgba(59,130,246,0.12)', bar: '#3B82F6' },
}

const StatCard = ({ icon, label, value, loading, color = 'emerald' }) => {
  const c = STAT_COLORS[color]
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#20233A] p-6 transition-all duration-300 group cursor-default"
      style={{ background: '#0E0F18' }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.from + '50'
        e.currentTarget.style.boxShadow = `0 0 32px ${c.glow}, 0 4px 24px rgba(0,0,0,0.4)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#20233A'
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Hover background glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ background: `radial-gradient(ellipse at top left, ${c.glow} 0%, transparent 65%)` }} />

      {/* Icon with gradient background */}
      <div className="relative z-10 mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
          style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`, boxShadow: `0 4px 16px ${c.glow}` }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        {loading
          ? <Spinner size="sm" />
          : <p className="text-4xl font-bold text-white tracking-tight tabular-nums leading-none">{value ?? 0}</p>
        }
        <p className="text-[#8890B0] text-sm mt-2 font-medium">{label}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ background: `linear-gradient(90deg, transparent, ${c.bar}90, transparent)` }} />
    </div>
  )
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { data: questions, isLoading: qLoading } = useAllQuestions()
  const { data: contests,  isLoading: cLoading } = useAllContests()

  const recentContests  = contests?.slice(0, 3) || []
  const recentQuestions = questions?.slice(0, 6) || []
  const activeContests  = (contests || []).filter(c => getContestStatus(c) === 'Active').length
  const easyCount       = (questions || []).filter(q => q.difficluty === 'Low').length

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#20233A] p-8 md:p-10 dot-grid"
           style={{ background: 'linear-gradient(135deg, #0E0F18 0%, #0E1420 60%, #0E0F18 100%)' }}>
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-16 right-8 w-56 h-56 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-5 tracking-wide uppercase">
            <span className="dot-live" style={{ width: 6, height: 6 }} />
            Platform Live
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Welcome back,{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0] || 'Coder'}</span>!
          </h1>
          <p className="text-[#8890B0] text-base max-w-xl">
            Compete, solve problems, and climb the leaderboard. Every submission gets you closer to the top.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link to="/questions" className="btn-primary text-sm px-5 py-2.5">
              Start Solving
            </Link>
            <Link to="/contests" className="btn-secondary text-sm px-5 py-2.5">
              View Contests
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📚" label="Total Problems"  value={questions?.length} loading={qLoading} color="emerald" />
        <StatCard icon="🏆" label="Total Contests"  value={contests?.length}  loading={cLoading} color="violet" />
        <StatCard icon="⚡" label="Active Contests" value={activeContests}    loading={cLoading} color="amber" />
        <StatCard icon="✅" label="Easy Problems"   value={easyCount}         loading={qLoading} color="blue" />
      </div>

      {/* ── Recent Contests ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Contests</h2>
            <p className="text-[#454A68] text-sm mt-0.5">Compete and earn points</p>
          </div>
          <Link to="/contests" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {cLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentContests.map(contest => {
              const status = getContestStatus(contest)
              return (
                <Link key={contest.id} to={`/contests/${contest.id}`} className="card-hover group p-5 block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#171828] border border-[#20233A] flex items-center justify-center text-lg flex-shrink-0">
                      🏆
                    </div>
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                  </div>
                  <h3 className="text-white font-semibold text-sm mt-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {contest.title}
                  </h3>
                  <p className="text-[#454A68] text-xs mt-2">
                    {format(new Date(contest.start_time), 'MMM dd, yyyy · HH:mm')}
                  </p>
                </Link>
              )
            })}
            {recentContests.length === 0 && (
              <div className="col-span-3 text-center py-10 text-[#454A68]">No contests yet.</div>
            )}
          </div>
        )}
      </section>

      {/* ── Recent Questions ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Problems</h2>
            <p className="text-[#454A68] text-sm mt-0.5">Jump in and start coding</p>
          </div>
          <Link to="/questions" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors flex items-center gap-1">
            All problems
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {qLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="tbl-wrap">
            {recentQuestions.map((q, idx) => (
              <Link key={q.id} to={`/questions/${q.id}`}
                className="tbl-row flex items-center justify-between px-5 py-3.5 group">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[#454A68] text-sm font-mono w-7 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors truncate">
                    {q.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={diffVariant(q.difficluty)}>{diffLabel(q.difficluty)}</Badge>
                  <svg className="w-4 h-4 text-[#454A68] group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {recentQuestions.length === 0 && (
              <div className="px-5 py-10 text-center text-[#454A68] text-sm">No questions yet.</div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}
