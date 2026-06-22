import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import { Button, Input } from '@/components/ui/index.js'
import { useRegister as useRegisterMutation } from '@/features/auth/hooks/useAuth.js'

const ROLES = [
  { value: 'USER', label: 'User', description: 'Solve problems & compete' },
  { value: 'ADMIN', label: 'Admin', description: 'Manage problems & users' },
]

function SignupPage() {
  const { mutate: submitRegister, isPending, error } = useRegisterMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setFocus,
  } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'USER' },
  })

  const selectedRole = watch('role')

  useEffect(() => {
    setFocus('name')
  }, [setFocus])

  const onSubmit = (data) => {
    submitRegister(data)
  }

  const apiError =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error ? 'Registration failed. Please try again.' : null)

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Create an account</h2>
        <p className="mt-1 text-sm text-gray-400">
          Join thousands of developers on CodeArena
        </p>
      </div>

      {/* API error */}
      {apiError && (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Full name */}
        <Input
          label="Full name"
          type="text"
          placeholder="Jane Doe"
          error={errors.name?.message}
          leftIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          {...register('name', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 80, message: 'Name is too long' },
          })}
        />

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          leftIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          }
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
        />

        {/* Password */}
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          showPasswordToggle
          hint="Use 8+ characters with a mix of letters, numbers & symbols."
          error={errors.password?.message}
          leftIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          })}
        />

        {/* Role selector */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-300">Account type</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value, { shouldValidate: true })}
                className={[
                  'rounded-lg border p-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  selectedRole === value
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-[#2a2a2a] bg-[#0f0f0f] text-gray-400 hover:border-[#3a3a3a]',
                ].join(' ')}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs opacity-70 mt-0.5">{description}</span>
              </button>
            ))}
          </div>
          {/* Hidden input keeps role value tracked by react-hook-form */}
          <input type="hidden" {...register('role', { required: true })} />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isPending}
          size="md"
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-gray-600">
        By creating an account you agree to our{' '}
        <span className="text-gray-400 cursor-pointer hover:text-emerald-500 transition-colors">
          Terms of Service
        </span>{' '}
        and{' '}
        <span className="text-gray-400 cursor-pointer hover:text-emerald-500 transition-colors">
          Privacy Policy
        </span>
        .
      </p>

      {/* Login link */}
      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default SignupPage
