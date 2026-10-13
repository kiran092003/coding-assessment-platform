import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const Icon = ({ name, className = '', size = 20 }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>
)

const NAV_ITEMS = [
  { to: '/',            icon: 'dashboard',    label: 'Dashboard',       exact: true },
  { to: '/questions',   icon: 'code',         label: 'Problems' },
  { to: '/contests',    icon: 'emoji_events', label: 'Contests' },
  { to: '/submissions', icon: 'history',      label: 'My Submissions' },
  { to: '/profile',     icon: 'settings',     label: 'Account Settings' },
]

const ADMIN_ITEMS = [
  { to: '/admin/questions',     icon: 'edit_note',    label: 'Manage Questions' },
  { to: '/admin/contests',      icon: 'event',        label: 'Manage Contests' },
  { to: '/admin/map-questions', icon: 'account_tree', label: 'Map Questions' },
]

function NavItem({ to, icon, label, exact, collapsed, onNavigate }) {
  const { pathname } = useLocation()
  const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={`nav-item ${active ? 'nav-item-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
    >
      <Icon name={icon} />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

/* Collapsing is driven from the top bar's toggle; the sidebar deliberately
   has no second control for it. */
export default function Sidebar({ open = false, collapsed = false, onClose }) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN'

  // The mobile drawer always shows the full sidebar; `collapsed` is a
  // desktop-only rail used to give the editor room on solve views.
  const rail = collapsed

  return (
    <>
      {/* Scrim — mobile drawer only */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r py-stack-lg transition-all duration-200
          ${rail ? 'w-16' : 'w-64'}
          ${open ? 'w-64 translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ background: 'var(--surface-low)', borderColor: 'var(--outline-variant)' }}
      >
        {/* Brand */}
        <div className={`mb-stack-lg flex items-start ${rail ? 'justify-center px-0' : 'justify-between px-container-padding'}`}>
          {rail && !open ? (
            <Link to="/" title="CodeArena" className="flex h-8 w-8 items-center justify-center rounded"
                  style={{ background: 'var(--primary-container)', color: '#00285d' }}>
              <Icon name="terminal" size={20} />
            </Link>
          ) : (
            <>
              <Link to="/" onClick={onClose} className="block">
                <h1 className="text-headline-sm text-primary">CodeArena</h1>
                <p className="label mt-0.5">Judge Console</p>
              </Link>
              <button onClick={onClose} className="btn-ghost -mr-2 lg:hidden" aria-label="Close navigation">
                <Icon name="close" />
              </button>
            </>
          )}
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            {NAV_ITEMS.map(item => (
              <NavItem key={item.to} {...item} collapsed={rail && !open} onNavigate={onClose} />
            ))}
          </div>

          {isAdmin && (
            <div className="mt-stack-lg">
              {!(rail && !open) && (
                <p className="label px-4 mb-2" style={{ color: 'var(--outline)' }}>Administration</p>
              )}
              <div className="space-y-1">
                {ADMIN_ITEMS.map(item => (
                  <NavItem key={item.to} {...item} collapsed={rail && !open} onNavigate={onClose} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Judge status panel — hidden in the rail, there's no room for it */}
        {!(rail && !open) && (
          <div className="px-4 pt-stack-sm">
            <div className="rounded-xl p-4" style={{ background: 'var(--surface-highest)' }}>
              <p className="label text-primary mb-2 flex items-center gap-2">
                <span className="dot-live" style={{ width: 6, height: 6 }} />
                Judge Online
              </p>
              <p className="text-body-md mb-4" style={{ color: 'var(--on-surface-variant)' }}>
                Sandboxed execution across C, C++, Java, Python and JavaScript.
              </p>
              <Link to="/questions" onClick={onClose} className="btn-primary w-full">
                Solve a Problem
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
