export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#20233A] bg-[#0E0F18] shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 animate-fade-in">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-lg text-center mb-1">{title}</h3>
        {message && (
          <p className="text-[#8890B0] text-sm text-center mb-6">{message}</p>
        )}
        {!message && <div className="mb-6" />}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
