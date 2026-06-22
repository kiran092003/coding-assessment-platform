import axiosInstance from '@/lib/axios.js'

/**
 * Login with email and password.
 * Returns { accessToken, refreshToken, userId }
 */
export const loginApi = ({ email, password }) =>
  axiosInstance.post('/api/v1/login', { email, password }).then((res) => res.data)

/**
 * Register a new account.
 * @param {{ name: string, email: string, password: string, role: string }} data
 */
export const registerApi = ({ name, email, password, role }) =>
  axiosInstance
    .post('/api/v1/register', { name, email, password, role })
    .then((res) => res.data)

/**
 * Logout the current user.
 * Requires the refresh token so the server can invalidate it.
 */
export const logoutApi = ({ refreshToken }) =>
  axiosInstance.post('/api/v1/logout', { refreshToken }).then((res) => res.data)

/**
 * Obtain a new access token using the stored refresh token.
 * Returns { accessToken }
 */
export const refreshTokenApi = ({ refreshToken }) =>
  axiosInstance
    .post('/api/v1/refresh', { refreshToken })
    .then((res) => res.data)

export const getProfileApi    = ()     => axiosInstance.get('/api/v1/profile').then(r => r.data)
export const updateProfileApi = (data) => axiosInstance.put('/api/v1/profile', data).then(r => r.data)
export const changePasswordApi = (data) => axiosInstance.put('/api/v1/profile/password', data).then(r => r.data)
