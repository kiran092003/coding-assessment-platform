import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/features/auth/hooks/useAuth'

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 2L25.5 8.5V19.5L14 26L2.5 19.5V8.5L14 2Z" stroke="#10B981" strokeWidth="1.5" />
    <path d="M10 10l-4 4 4 4M18 10l4 4-4 4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.5 9l-3 10" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation()
  const active = pathname === to || pathname.startsWith(to + '/')
  return (
    <Link
      to={to}
      className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-white bg-arena-750 border border-arena-600'
          : 'text-[#8890B0] hover:text-white hover:bg-arena-800'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-emerald-400" />
      )}
    </Link>
  )
}

const Avatar = ({ name }) => {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-emerald-500/20">
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
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0E0F18] border border-[#20233A] hover:border-[#20233A]/80 transition-all"
      >
        <Avatar name={user?.name} />
        <div className="flex flex-col leading-tight text-left">
          <span className="text-white text-sm font-medium">{user?.name || user?.email?.split('@')[0]}</span>
          {isAdmin && (
            <span className="text-[10px] font-semibold tracking-widest uppercase text-violet-400">Admin</span>
          )}
        </div>
        <svg className={`w-3 h-3 text-[#454A68] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-12 right-0 z-20 w-52 rounded-xl border border-[#20233A] bg-[#0E0F18] shadow-[0_16px_48px_rgba(0,0,0,0.7)] p-1 animate-fade-in">
            <div className="px-3 py-2 border-b border-[#15172A] mb-1">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[#454A68] text-xs truncate">{user?.email}</p>
            </div>
            {[
              { icon: '👤', label: 'Profile & Settings', path: '/profile' },
              { icon: '📋', label: 'My Submissions',     path: '/submissions' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#8890B0] hover:text-white hover:bg-[#171828] transition-colors text-left"
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="border-t border-[#15172A] mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); onLogout() }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()
  const [adminOpen, setAdminOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  return (
    <>
      <nav className="glass border-b border-[#15172A] px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <LogoIcon />
          <span className="text-white font-bold text-lg tracking-tight group-hover:text-emerald-300 transition-colors">
            Code<span className="text-gradient">Arena</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink to="/questions">Questions</NavLink>
          <NavLink to="/contests">Contests</NavLink>

          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setAdminOpen(v => !v)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${
                  adminOpen
                    ? 'text-white bg-arena-750 border border-arena-600'
                    : 'text-[#8890B0] hover:text-white hover:bg-arena-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
                <svg className={`w-3 h-3 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {adminOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAdminOpen(false)} />
                  <div className="absolute top-11 left-0 z-20 min-w-[200px] rounded-xl border border-[#20233A] bg-[#0E0F18] shadow-[0_16px_48px_rgba(0,0,0,0.7)] p-1 animate-fade-in">
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#454A68] mb-1">
                      Administration
                    </div>
                    {[
                      { to: '/admin/questions',     label: 'Manage Questions',       icon: '📝' },
                      { to: '/admin/contests',      label: 'Manage Contests',        icon: '🏆' },
                      { to: '/admin/map-questions', label: 'Map Questions to Contest', icon: '🗂️' },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setAdminOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#8890B0] hover:text-white hover:bg-[#171828] transition-colors"
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <UserMenu user={user} isAdmin={isAdmin} onLogout={() => setConfirmLogout(true)} />
        </div>
      </nav>

      {/* Logout confirmation — outside <nav> so backdrop-filter stacking context doesn't trap fixed positioning */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmLogout(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#20233A] bg-[#0E0F18] shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 animate-fade-in">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg text-center mb-1">Sign out?</h3>
            <p className="text-[#8890B0] text-sm text-center mb-6">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmLogout(false); logout() }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
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
