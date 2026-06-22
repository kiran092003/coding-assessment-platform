import api from '@/lib/axios'

export const getLeaderboard   = (contestId) => api.get(`/api/v1/leaderboard/${contestId}`).then(r => r.data)
export const getMyEntry       = (contestId) => api.get(`/api/v1/leaderboard/${contestId}/me`).then(r => r.data)
export const recordStart      = (contestId) => api.post(`/api/v1/leaderboard/${contestId}/start`).then(r => r.data)
export const recordEnd        = (contestId) => api.post(`/api/v1/leaderboard/${contestId}/end`).then(r => r.data)
