import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const SOLVE_PATTERNS = [
  /^\/questions\/\d+$/,
  /^\/contests\/\d+\/solve\/\d+$/,
]

export default function AppLayout() {
  const { pathname } = useLocation()
  const isFullHeight = SOLVE_PATTERNS.some(p => p.test(pathname))

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      {isFullHeight ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
            <Outlet />
          </div>
        </main>
      )}
    </div>
  )
}
