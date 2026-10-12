import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

/* Solve views own the full viewport: the editor needs the height, and the
   sidebar collapses to a rail so the three-column split has room. */
const SOLVE_PATTERNS = [
  /^\/questions\/\d+$/,
  /^\/contests\/\d+\/solve\/\d+$/,
]

const isSolveRoute = (pathname) => SOLVE_PATTERNS.some(p => p.test(pathname))

export default function AppLayout() {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const solving = isSolveRoute(pathname)

  // Collapse on entering a solve view; restore on leaving. Kept as state so
  // the user can still expand it mid-problem via the toggle.
  const [collapsed, setCollapsed] = useState(solving)

  useEffect(() => {
    setNavOpen(false)
    setCollapsed(isSolveRoute(pathname))
  }, [pathname])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
      <Sidebar
        open={navOpen}
        collapsed={collapsed}
        onClose={() => setNavOpen(false)}
        onToggleCollapse={() => setCollapsed(v => !v)}
      />

      <div
        className={`flex h-screen min-w-0 flex-1 flex-col transition-all duration-200 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <Navbar
          onMenuClick={() => setNavOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
        />

        {solving ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="w-full max-w-7xl mx-auto flex-1 px-container-padding py-container-padding">
              <Outlet />
            </div>
            <Footer />
          </main>
        )}
      </div>
    </div>
  )
}
