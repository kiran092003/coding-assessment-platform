import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loginApi, registerApi, logoutApi, updateProfileApi, changePasswordApi } from '../api/authApi.js'
import { useAuthStore } from '@/store/authStore.js'

/**
 * Hook for handling user login.
 * On success: stores auth state and redirects to home.
 */
export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Decode JWT payload to get name, email, role
      const payload = JSON.parse(atob(data.accessToken.split('.')[1]))
      const user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role }
      setAuth(user, data.accessToken, data.refreshToken)
      navigate('/', { replace: true })
    },
  })
}

/**
 * Hook for handling user registration.
 * On success: redirects to login with a success message.
 */
export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully! Please log in.' },
      })
    },
  })
}

/**
 * Hook for handling user logout.
 * On success: clears auth state and redirects to login.
 */
export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  return useMutation({
    mutationFn: () => logoutApi({ refreshToken }),
    onSuccess: () => {
      clearAuth()
      navigate('/login', { replace: true })
    },
    onError: () => {
      // Even if the server call fails, clear local auth state
      clearAuth()
      navigate('/login', { replace: true })
    },
  })
}

export function useUpdateProfile() {
  const { user, accessToken, refreshToken, setAuth } = useAuthStore()
  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (data) => {
      setAuth({ ...user, name: data.name }, accessToken, refreshToken)
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePasswordApi })
}
