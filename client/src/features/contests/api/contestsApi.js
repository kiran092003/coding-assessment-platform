import api from '@/lib/axios'

export const getAllContests = () => api.get('/api/v1/contests/getAll').then(r => r.data)
export const getContestById = (id) => api.get(`/api/v1/contests/getById/${id}`).then(r => r.data)
export const createContest = (data) => api.post('/api/v1/contests/create', data).then(r => r.data)
export const updateContest = (id, data) => api.patch(`/api/v1/contests/update/${id}`, data).then(r => r.data)
export const deleteContest = (id) => api.delete(`/api/v1/contests/delete/${id}`).then(r => r.data)

export const registerForContest  = (id) => api.post(`/api/v1/contests/register/${id}`).then(r => r.data)
export const getMyRegistration   = (id) => api.get(`/api/v1/contests/registration/${id}`).then(r => r.data)

export const getContestQuestions = (contestId) => api.get(`/api/v1/contest-questions/${contestId}`).then(r => r.data)
export const addContestQuestion = (data) => api.post('/api/v1/contest-questions/add', data).then(r => r.data)
export const removeContestQuestion = (contestId, questionId) => api.delete(`/api/v1/contest-questions/remove/${contestId}/${questionId}`).then(r => r.data)
export const updateContestQuestionPoints = (contestId, questionId, data) => api.patch(`/api/v1/contest-questions/points/${contestId}/${questionId}`, data).then(r => r.data)
