import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react'

/* Transient feedback for actions whose outcome isn't obvious from the page —
   above all, a request the server refused. Without this an admin clicks "Add"
   and nothing happens, with the reason sitting unread in a 400 response. */

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: 'check_circle', color: 'var(--success)',   tint: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)' },
  error:   { icon: 'error',        color: 'var(--error)',     tint: 'rgba(255,180,171,0.12)', border: 'rgba(255,180,171,0.35)' },
  warning: { icon: 'warning',      color: 'var(--tertiary)',  tint: 'rgba(255,183,134,0.12)', border: 'rgba(255,183,134,0.35)' },
  info:    { icon: 'info',         color: 'var(--primary)',   tint: 'rgba(173,198,255,0.12)', border: 'rgba(173,198,255,0.35)' },
}

const DEFAULT_MS = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id))
    const handle = timers.current.get(id)
    if (handle) { clearTimeout(handle); timers.current.delete(id) }
  }, [])

  const push = useCallback((variant, message, options = {}) => {
    if (!message) return
    const id = Date.now() + Math.random()
    const duration = options.duration ?? DEFAULT_MS
    setToasts(list => [...list, { id, variant, message, title: options.title }])
    // Errors stay until dismissed when asked to; everything else self-clears.
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
    }
    return id
  }, [dismiss])

  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  const api = useRef({
    success: (m, o) => push('success', m, o),
    error:   (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info:    (m, o) => push('info', m, o),
  })
  api.current = {
    success: (m, o) => push('success', m, o),
    error:   (m, o) => push('error', m, o),
    warning: (m, o) => push('warning', m, o),
    info:    (m, o) => push('info', m, o),
  }

  return (
    <ToastContext.Provider value={api.current}>
      {children}

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => {
          const v = VARIANTS[t.variant] || VARIANTS.info
          return (
            <div
              key={t.id}
              className="animate-slide-up pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-level-3"
              style={{ background: 'var(--surface-highest)', borderColor: v.border }}
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
                style={{ background: v.tint }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: v.color }}>
                  {v.icon}
                </span>
              </span>

              <div className="min-w-0 flex-1">
                {t.title && <p className="label mb-0.5" style={{ color: v.color }}>{t.title}</p>}
                <p className="text-body-md text-on-surface">{t.message}</p>
              </div>

              <button
                onClick={() => dismiss(t.id)}
                className="-mr-1 -mt-1 flex-shrink-0 rounded p-1 transition-colors hover:bg-surface-bright"
                style={{ color: 'var(--on-surface-variant)' }}
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider')
  return ctx
}

/* Pulls the server's own explanation out of an axios error. The services
   answer with { error: "..." }, and that text is the whole point — it says
   which rule was broken. */
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  )
}
