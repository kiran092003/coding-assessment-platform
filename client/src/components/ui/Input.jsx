import React, { forwardRef, useState } from 'react'

const EyeOn = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const Input = forwardRef(function Input({ label, error, leftIcon, hint, showPasswordToggle = false, type = 'text', className = '', id, ...rest }, ref) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium" style={{ color: '#8890B0' }}>
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center" style={{ color: '#454A68' }}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          style={{
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            borderColor: error ? '#EF4444' : 'var(--border-default)',
          }}
          className={[
            'w-full rounded-lg border py-2.5 text-sm',
            'transition-all duration-200',
            'focus:outline-none focus:border-emerald-500',
            'placeholder:text-[#454A68]',
            leftIcon ? 'pl-10' : 'pl-4',
            showPasswordToggle ? 'pr-10' : 'pr-4',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].filter(Boolean).join(' ')}
          {...rest}
          onFocus={e => {
            e.target.style.borderColor = '#10B981'
            e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)'
            rest.onFocus?.(e)
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? '#EF4444' : 'var(--border-default)'
            e.target.style.boxShadow = 'none'
            rest.onBlur?.(e)
          }}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center transition-colors"
            style={{ color: '#454A68' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8890B0'}
            onMouseLeave={e => e.currentTarget.style.color = '#454A68'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff /> : <EyeOn />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && <p className="mt-1.5 text-xs" style={{ color: '#454A68' }}>{hint}</p>}
    </div>
  )
})

export default Input
