import api from '@/lib/axios'

export const createSubmission = (data) => api.post('/api/v1/submissions/create', data).then(r => r.data)
export const getSubmissionById = (id) => api.get(`/api/v1/submissions/getById/${id}`).then(r => r.data)
export const getMySubmissions = (questionId, contestId = null) =>
  api.get(`/api/v1/submissions/mySubmissions/${questionId}`, { params: contestId ? { contestId } : {} }).then(r => r.data)
export const getAllMySubmissions = () => api.get('/api/v1/submissions/me').then(r => r.data)
export const runCode = (data) => api.post('/api/v1/judge/run', data).then(r => r.data)
