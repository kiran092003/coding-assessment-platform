import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { useAllQuestions } from '@/features/questions/hooks/useQuestions'
import { useAllContests } from '@/features/contests/hooks/useContests'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

const Icon = ({ name, size = 20, className = '', style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }}>{name}</span>
)

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
  if (s === 'Active') return 'accepted'
  if (s === 'Upcoming') return 'warning'
  return 'default'
}

/* Stitch stat card: surface-container-low panel, hairline outline, label-md
   caption, display-lg figure. Hover brightens the border only. */
const StatCard = ({ icon, label, value, loading, accent = 'var(--primary)' }) => (
  <div
    className="flex flex-col justify-between rounded-xl border p-stack-md transition-colors hover:border-primary/50"
    style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
  >
    <div className="flex items-start justify-between">
      <span className="label">{label}</span>
      <Icon name={icon} style={{ color: accent }} />
    </div>
    <div className="mt-4">
      {loading
        ? <Spinner size="sm" />
        : <p className="text-display-lg tabular-nums text-on-surface">{value ?? 0}</p>}
    </div>
  </div>
)

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const { data: questions, isLoading: qLoading } = useAllQuestions()
  const { data: contests,  isLoading: cLoading } = useAllContests()

  const recentContests  = contests?.slice(0, 3) || []
  const recentQuestions = questions?.slice(0, 6) || []
  const activeContests  = (contests || []).filter(c => getContestStatus(c) === 'Active').length

  const byDiff = {
    easy: (questions || []).filter(q => q.difficluty === 'Low').length,
    med:  (questions || []).filter(q => q.difficluty === 'Medium').length,
    hard: (questions || []).filter(q => q.difficluty === 'High').length,
  }
  const total = questions?.length || 0
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)

  return (
    <div className="animate-fade-in space-y-stack-lg">

      {/* ── Welcome + quick actions ── */}
      <section className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-headline-md text-on-surface">
            Hello, {user?.name?.split(' ')[0] || 'Coder'}
          </h2>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
            {activeContests > 0
              ? <>You have <span className="font-bold text-primary">{activeContests}</span> contest{activeContests > 1 ? 's' : ''} running right now.</>
              : 'No contests running — a good moment to grind the problem set.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/questions" className="btn-primary">
            <Icon name="add" size={18} />
            Solve New Problems
          </Link>
          <Link to="/contests" className="btn-secondary">
            <Icon name="leaderboard" size={18} />
            Browse Contests
          </Link>
          <Link to="/submissions" className="btn-tertiary">
            <Icon name="history" size={18} />
            My Submissions
          </Link>
        </div>
      </section>

      {/* ── Statistics (bento grid) ── */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="code"         label="Total Problems"  value={questions?.length} loading={qLoading} />
        <StatCard icon="emoji_events" label="Total Contests"  value={contests?.length}  loading={cLoading} />
        <StatCard icon="bolt"         label="Active Contests" value={activeContests}    loading={cLoading} accent="var(--tertiary)" />

        {/* Difficulty breakdown — thin meters, per the design system */}
        <div
          className="rounded-xl border p-stack-md transition-colors hover:border-primary/50"
          style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
        >
          <span className="label mb-4 block">Difficulty Breakdown</span>
          <div className="space-y-3">
            {[
              { label: 'Easy',   n: byDiff.easy, color: 'var(--primary)' },
              { label: 'Medium', n: byDiff.med,  color: 'var(--tertiary)' },
              { label: 'Hard',   n: byDiff.hard, color: 'var(--error)' },
            ].map(row => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-body-md">
                  <span style={{ color: 'var(--on-surface-variant)' }}>{row.label}</span>
                  <span className="tabular-nums text-on-surface">{row.n}/{total}</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${pct(row.n)}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent contests ── */}
      <section>
        <div className="mb-stack-md flex items-center justify-between">
          <h3 className="text-headline-sm text-on-surface">Recent Contests</h3>
          <Link to="/contests" className="label text-primary hover:underline">View All</Link>
        </div>

        {cLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {recentContests.map(contest => {
              const status = getContestStatus(contest)
              const accent = status === 'Active' ? 'var(--success)'
                : status === 'Upcoming' ? 'var(--tertiary)' : 'var(--outline-variant)'
              return (
                <Link
                  key={contest.id}
                  to={`/contests/${contest.id}`}
                  className="card-hover block border-l-4 p-stack-md"
                  style={{ borderLeftColor: accent }}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <Icon name="emoji_events" className="text-tertiary" />
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                  </div>
                  <h4 className="text-body-lg text-on-surface line-clamp-2">{contest.title}</h4>
                  <p className="label mt-2">
                    {format(new Date(contest.start_time), 'MMM dd, yyyy · HH:mm')}
                  </p>
                </Link>
              )
            })}
            {recentContests.length === 0 && (
              <div className="card col-span-3 py-10 text-center text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                No contests yet.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Recent problems ── */}
      <section>
        <div className="mb-stack-md flex items-center justify-between">
          <h3 className="text-headline-sm text-on-surface">Recent Problems</h3>
          <Link to="/questions" className="label text-primary hover:underline">All Problems</Link>
        </div>

        {qLoading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="tbl-wrap">
            <table className="w-full border-collapse text-left">
              <thead className="tbl-head">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Problem Name</th>
                  <th className="w-32 px-4 py-3">Difficulty</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentQuestions.map((q, idx) => (
                  <tr key={q.id} className="tbl-row group">
                    <td className="px-4 py-4 text-center font-mono-code" style={{ color: 'var(--on-surface-variant)' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/questions/${q.id}`} className="text-body-lg text-on-surface transition-colors group-hover:text-primary">
                        {q.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={diffVariant(q.difficluty)}>{diffLabel(q.difficluty)}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/questions/${q.id}`} className="text-on-surface-variant group-hover:text-primary">
                        <Icon name="chevron_right" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentQuestions.length === 0 && (
              <div className="px-5 py-10 text-center text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
                No questions yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
