const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10  text-amber-400  border border-amber-500/20',
  danger:  'bg-red-500/10    text-red-400    border border-red-500/20',
  info:    'bg-blue-500/10   text-blue-400   border border-blue-500/20',
  violet:  'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  default: 'bg-white/5       text-[#8890B0]  border border-white/10',
}

const dots = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  violet:  'bg-violet-400',
  default: 'bg-[#454A68]',
}

export default function Badge({ variant = 'default', children, dot = true, className = '' }) {
  const cls = variants[variant] ?? variants.default
  const dotCls = dots[variant] ?? dots.default
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${cls} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />}
      {children}
    </span>
  )
}
