/* Stitch auth screens are a single centred 480px column on the lowest
   surface, with the brand mark above the card and a tonal card footer. */
export default function AuthLayout({ children, footer }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-gutter"
      style={{ background: 'var(--surface-lowest)' }}
    >
      <div className="dot-grid pointer-events-none fixed inset-0 opacity-50" />

      <main className="animate-slide-up relative z-10 w-full max-w-[480px]">
        {/* Brand */}
        <div className="mb-stack-lg flex flex-col items-center">
          <div
            className="mb-stack-sm flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'var(--primary-container)', color: '#00285d' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>terminal</span>
          </div>
          <h1 className="mb-base text-headline-md text-primary">CodeArena</h1>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
            The Flow State of Competitive Programming
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel overflow-hidden rounded-xl shadow-level-3">
          <div className="p-stack-lg">{children}</div>

          {footer && (
            <div
              className="border-t px-stack-lg py-stack-md text-center"
              style={{ background: 'var(--surface-high)', borderColor: 'var(--outline-variant)' }}
            >
              {footer}
            </div>
          )}
        </div>

        {/* Secondary links */}
        <footer className="mt-stack-lg flex flex-col items-center gap-stack-sm">
          <div className="label flex gap-stack-lg">
            <span>C / C++ / Java / Python / JavaScript</span>
          </div>
          <p className="label" style={{ color: 'var(--outline-variant)' }}>
            © {new Date().getFullYear()} CodeArena Platform · Secure JWT Auth
          </p>
        </footer>
      </main>
    </div>
  )
}
