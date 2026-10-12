export default function Footer() {
  return (
    <footer
      className="flex h-12 w-full flex-shrink-0 items-center justify-between gap-4 border-t px-container-padding"
      style={{ background: 'var(--surface-lowest)', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex min-w-0 items-center gap-stack-md">
        <span className="text-body-md font-bold text-on-surface">CodeArena</span>
        <span className="label truncate hidden sm:inline">© {new Date().getFullYear()} CodeArena Platform</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="label flex items-center gap-2">
          <span className="dot-live" style={{ width: 6, height: 6 }} />
          Judge Operational
        </span>
      </div>
    </footer>
  )
}
