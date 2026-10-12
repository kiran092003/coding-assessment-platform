import React from 'react'
import Spinner from './Spinner'

/* Stitch buttons: 40px tall, 4px radius, label-md type (12px/600/0.05em).
   Primary is solid blue and reserved for Submit / Run / Create. */
const variantMap = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  tertiary:  'btn-tertiary',
  outline: [
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded',
    'text-label-md transition-colors cursor-pointer',
    'text-primary border border-primary/30 bg-primary/10',
    'hover:bg-primary/20 hover:border-primary',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeExtra = {
  sm: 'h-8 px-3 text-[11px]',
  md: '',
  lg: 'h-12 px-6 text-body-md',
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  type = 'button',
  icon,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading
  const base = variantMap[variant] ?? variantMap.primary

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${base} ${sizeExtra[size] ?? ''} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading
        ? <Spinner size="sm" />
        : icon && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>}
      {children}
    </button>
  )
}

export default Button
