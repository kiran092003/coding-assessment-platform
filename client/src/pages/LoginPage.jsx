import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout.jsx'
import { Button, Input } from '@/components/ui/index.js'
import { useLogin } from '@/features/auth/hooks/useAuth.js'

function LoginPage() {
  const location = useLocation()
  const successMessage = location.state?.message ?? null

  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    setFocus('email')
  }, [setFocus])

  const onSubmit = (data) => {
    login(data)
  }

  // Extract a human-readable error message from the API response
  const apiError =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error ? 'Invalid email or password. Please try again.' : null)

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
        <p className="mt-1 text-sm" style={{ color: '#8890B0' }}>
          Sign in to continue to CodeArena
        </p>
      </div>

      {successMessage && (
        <div className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <span>✓</span>{successMessage}
        </div>
      )}

      {apiError && (
        <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          showPasswordToggle
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
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
        />

        {/* Forgot password placeholder */}
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isPending}
          size="md"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#454A68' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-emerald-500 hover:text-emerald-400 transition-colors">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage
