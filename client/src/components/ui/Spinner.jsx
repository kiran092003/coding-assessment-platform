const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`relative flex-shrink-0 ${sizes[size] ?? sizes.md} ${className}`} role="status" aria-label="Loading">
      <span className="absolute inset-0 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
    </div>
  )
}
