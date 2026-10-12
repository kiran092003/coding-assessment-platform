export default function Footer() {
  return (
    <footer
      className="mt-auto flex w-full flex-col items-start justify-between gap-2 border-t px-container-padding py-stack-md sm:flex-row sm:items-center"
      style={{ background: 'var(--surface-lowest)', borderColor: 'var(--outline-variant)' }}
    >
      <div className="flex items-center gap-stack-md">
        <span className="text-body-lg font-bold text-on-surface">CodeArena</span>
        <span className="label">© {new Date().getFullYear()} CodeArena Platform</span>
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
