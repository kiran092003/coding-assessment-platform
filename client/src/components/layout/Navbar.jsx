import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import SearchBox from './SearchBox'
import { useLogout } from '@/features/auth/hooks/useAuth'

const Icon = ({ name, className = '', size = 20 }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>
)

function Avatar({ name }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-bold"
      style={{
        background: 'var(--primary)',
        color: 'var(--on-primary)',
        borderColor: 'var(--outline-variant)',
      }}
    >
      {initials}
    </div>
  )
}

function UserMenu({ user, isAdmin, onLogout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const go = (path) => { setOpen(false); navigate(path) }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 rounded px-2 py-1 transition-colors hover:bg-surface-container"
      >
        <Avatar name={user?.name} />
        <div className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-body-md text-on-surface">{user?.name || user?.email?.split('@')[0]}</span>
          {isAdmin && <span className="label text-secondary">Admin</span>}
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-on-surface-variant" size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="animate-fade-in absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border p-1 shadow-level-2"
            style={{ background: 'var(--surface-highest)', borderColor: 'var(--outline-variant)' }}
          >
            <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--outline-variant)' }}>
              <p className="text-body-md truncate text-on-surface">{user?.name}</p>
              <p className="truncate text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{user?.email}</p>
            </div>

            {[
              { icon: 'person',  label: 'Profile & Settings', path: '/profile' },
              { icon: 'history', label: 'My Submissions',     path: '/submissions' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-body-md text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-primary"
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </button>
            ))}

            <div className="mt-1 border-t pt-1" style={{ borderColor: 'var(--outline-variant)' }}>
              <button
                onClick={() => { setOpen(false); onLogout() }}
                className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-body-md text-error transition-colors hover:bg-error/10"
              >
                <Icon name="logout" size={18} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar({ onMenuClick, collapsed = false, onToggleCollapse }) {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const isAdmin = user?.role === 'ADMIN'
  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-container-padding"
        style={{ background: 'var(--surface)', borderColor: 'var(--outline-variant)' }}
      >
        <div className="flex items-center gap-2">
          <button onClick={onMenuClick} className="btn-ghost -ml-2 lg:hidden" aria-label="Open navigation">
            <Icon name="menu" />
          </button>

          {/* Desktop rail toggle — gives the editor room on solve views */}
          <button
            onClick={onToggleCollapse}
            className="btn-ghost -ml-2 hidden lg:flex"
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Icon name={collapsed ? 'menu' : 'menu_open'} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <SearchBox />

          <Link to="/submissions" className="btn-ghost" aria-label="Recent submissions">
            <Icon name="notifications" />
          </Link>

          <UserMenu user={user} isAdmin={isAdmin} onLogout={() => setConfirmLogout(true)} />
        </div>
      </header>

      {/* Logout confirmation — kept outside <header> so the sticky stacking
          context doesn't trap the fixed overlay. */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmLogout(false)} />
          <div
            className="animate-fade-in relative z-10 w-full max-w-sm rounded-xl border p-6 shadow-level-4"
            style={{ background: 'var(--surface-highest)', borderColor: 'var(--outline-variant)' }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: 'var(--error-dim)', border: '1px solid rgba(255,180,171,0.3)' }}
            >
              <Icon name="logout" className="text-error" size={24} />
            </div>
            <h3 className="mb-1 text-center text-headline-sm text-on-surface">Sign out?</h3>
            <p className="mb-6 text-center text-body-md" style={{ color: 'var(--on-surface-variant)' }}>
              You'll need to sign in again to access the console.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => { setConfirmLogout(false); logout() }}
                className="btn-danger h-10 flex-1"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
