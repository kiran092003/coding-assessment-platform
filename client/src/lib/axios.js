import axios from 'axios'
import { useAuthStore } from '@/store/authStore.js'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Request interceptor — attach access token from Zustand store
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor — handle 401 by refreshing token and retrying
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If not a 401 or already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Avoid retrying the refresh endpoint itself
    if (originalRequest.url?.includes('/api/v1/refresh')) {
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = useAuthStore.getState().refreshToken

    if (!refreshToken) {
      isRefreshing = false
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/v1/refresh`, {
        refreshToken,
      })

      const { accessToken: newAccessToken } = response.data
      useAuthStore.getState().setAccessToken(newAccessToken)

      processQueue(null, newAccessToken)
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
