export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div
        className="animate-fade-in relative z-10 w-full max-w-sm rounded-xl border p-6 shadow-level-4"
        style={{ background: 'var(--surface-highest)', borderColor: 'var(--outline-variant)' }}
      >
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ background: 'var(--error-dim)', border: '1px solid rgba(255,180,171,0.3)' }}
        >
          <span className="material-symbols-outlined text-error" style={{ fontSize: 24 }}>delete</span>
        </div>
        <h3 className="mb-1 text-center text-headline-sm text-on-surface">{title}</h3>
        {message
          ? <p className="mb-6 text-center text-body-md" style={{ color: 'var(--on-surface-variant)' }}>{message}</p>
          : <div className="mb-6" />}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger h-10 flex-1">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
