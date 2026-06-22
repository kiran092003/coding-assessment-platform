import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center max-w-md animate-fade-in">

        {/* Glowing 404 */}
        <div className="relative mb-8 inline-block">
          <div
            className="pointer-events-none absolute inset-0 blur-3xl rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
          />
          <p
            className="relative text-[120px] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 60%, #065F46 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </p>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-[#8890B0] text-sm mb-8">
          The page you're looking for doesn't exist or was moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary px-6 py-2.5 text-sm rounded-xl">
            Back to Home
          </Link>
          <Link to="/questions" className="btn-secondary px-6 py-2.5 text-sm rounded-xl">
            Browse Problems
          </Link>
        </div>

      </div>
    </div>
  )
}
