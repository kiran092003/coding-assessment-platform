const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
    <path d="M14 2L25.5 8.5V19.5L14 26L2.5 19.5V8.5L14 2Z" stroke="#10B981" strokeWidth="1.5" />
    <path d="M10 10l-4 4 4 4M18 10l4 4-4 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.5 9l-3 10" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const features = [
  { icon: '⚡', text: 'Practice algorithms with real-time judging' },
  { icon: '🏆', text: 'Compete in timed contests and leaderboards' },
  { icon: '🎯', text: 'Partial scoring — every test case counts' },
  { icon: '💻', text: 'Code in C++, Java, Python, JavaScript, C' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden border-r"
           style={{ background: 'linear-gradient(145deg, #0A0B14 0%, #0E1020 100%)', borderColor: 'var(--border-subtle)' }}>

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl"
             style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />
        <div className="dot-grid absolute inset-0 opacity-40" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoIcon />
          <span className="text-xl font-bold text-white tracking-tight">
            Code<span className="text-gradient">Arena</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Code. Compete.{' '}
              <span className="text-gradient">Conquer.</span>
            </h1>
            <p className="mt-4 text-[#8890B0] text-base leading-relaxed max-w-sm">
              The competitive coding platform built for developers who want to level up their skills through real challenges.
            </p>
          </div>

          <ul className="space-y-3.5">
            {features.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  {icon}
                </span>
                <span className="text-sm text-[#8890B0]">{text}</span>
              </li>
            ))}
          </ul>

          {/* Fake stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { value: '500+', label: 'Problems' },
              { value: '24/7', label: 'Judge' },
              { value: '5',    label: 'Languages' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3 text-center border"
                   style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.12)' }}>
                <div className="text-xl font-bold text-gradient">{stat.value}</div>
                <div className="text-[10px] text-[#454A68] uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[#454A68]">
          © {new Date().getFullYear()} CodeArena. All rights reserved.
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <LogoIcon />
            <span className="text-xl font-bold text-white">
              Code<span className="text-gradient">Arena</span>
            </span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border p-8"
               style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
