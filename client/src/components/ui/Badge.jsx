/* Status chips, per Stitch: full pill, 11px/700 uppercase with 0.05em tracking,
   a 15% tint of the semantic colour and a matching 30% border.
   Difficulty follows competitive-programming convention —
   Easy = primary blue, Medium = tertiary orange, Hard = error red.
   Accepted verdicts keep true green; system-level states use indigo. */
const variants = {
  success: 'chip-easy',      // Easy / passing / active
  accepted: 'chip-success',  // Accepted verdict — true green
  warning: 'chip-medium',    // Medium difficulty / pending
  danger:  'chip-hard',      // Hard difficulty / failed
  info:    'chip-easy',      // informational
  primary: 'chip-easy',
  violet:  'chip-system',    // system-level: MLE, compile error
  system:  'chip-system',
  default: 'chip-neutral',
}

const dots = {
  success:  'bg-primary',
  accepted: 'bg-success-400',
  warning:  'bg-tertiary',
  danger:   'bg-error',
  info:     'bg-primary',
  primary:  'bg-primary',
  violet:   'bg-secondary',
  system:   'bg-secondary',
  default:  'bg-outline',
}

export default function Badge({ variant = 'default', children, dot = false, className = '' }) {
  const cls = variants[variant] ?? variants.default
  const dotCls = dots[variant] ?? dots.default

  return (
    <span className={`chip ${cls} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotCls}`} />}
      {children}
    </span>
  )
}
