import api from '@/lib/axios'

export const getAllQuestions = () => api.get('/api/v1/questions/getAll').then(r => r.data)
export const getQuestionById = (id) => api.get(`/api/v1/questions/getById/${id}`).then(r => r.data)
export const createQuestion = (data) => api.post('/api/v1/questions/create', data).then(r => r.data)
export const updateQuestion = (id, data) => api.patch(`/api/v1/questions/update/${id}`, data).then(r => r.data)
export const deleteQuestion = (id) => api.delete(`/api/v1/questions/delete/${id}`).then(r => r.data)
