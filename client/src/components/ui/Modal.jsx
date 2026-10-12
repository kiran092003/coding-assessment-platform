import { useEffect } from 'react'

/* Tier-4 surface per Stitch: surface-container-highest, hairline outline,
   8px radius, 4px-blur shadow over a plain scrim. */
export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="animate-fade-in relative z-10 max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-xl border shadow-level-4"
        style={{ background: 'var(--surface-highest)', borderColor: 'var(--outline-variant)' }}
      >
        <div
          className="flex items-center justify-between border-b px-stack-md py-stack-md"
          style={{ borderColor: 'var(--outline-variant)' }}
        >
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <button onClick={onClose} className="btn-ghost -mr-2" aria-label="Close">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="p-stack-md">{children}</div>
      </div>
    </div>
  )
}
