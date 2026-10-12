import React, { forwardRef, useState } from 'react'

const Icon = ({ name, size = 18 }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size }}>{name}</span>
)

/* Stitch form field: 40px tall, 4px radius, surface-container-low fill,
   outline-variant border, primary border + 2px ring on focus.
   The label above it is label-md (12px/600 uppercase). */
const Input = forwardRef(function Input(
  { label, error, leftIcon, hint, showPasswordToggle = false, type = 'text', className = '', id, ...rest },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label mb-1.5 block">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          style={{ borderColor: error ? 'var(--error)' : undefined }}
          className={[
            'input-field',
            leftIcon ? 'pl-10' : 'pl-4',
            showPasswordToggle ? 'pr-11' : 'pr-4',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].filter(Boolean).join(' ')}
          {...rest}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute inset-y-0 right-3 flex items-center transition-colors hover:text-on-surface"
            style={{ color: 'var(--on-surface-variant)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-error">
          <Icon name="error" size={14} />
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>{hint}</p>
      )}
    </div>
  )
})

export default Input
