import React from 'react'
import Spinner from './Spinner'

const variantMap = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
  outline: [
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
    'transition-all duration-200 cursor-pointer',
    'text-emerald-400 border border-emerald-500/30 bg-emerald-500/5',
    'hover:bg-emerald-500/10 hover:border-emerald-500/50',
    'disabled:opacity-45 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeExtra = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
  lg: 'px-6 py-3 text-base',
}

function Button({ variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled = false, type = 'button', className = '', children, ...rest }) {
  const isDisabled = disabled || loading
  const base = variantMap[variant] ?? variantMap.primary
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${base} ${sizeExtra[size] ?? ''} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

export default Button
