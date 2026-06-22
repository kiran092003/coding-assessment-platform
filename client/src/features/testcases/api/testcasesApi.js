import api from '@/lib/axios'

export const getTestCasesByQuestion = (questionId) => api.get(`/api/v1/testcases/getByQuestion/${questionId}`).then(r => r.data)
export const createTestCase = (data) => api.post('/api/v1/testcases/create', data).then(r => r.data)
export const updateTestCase = (id, data) => api.patch(`/api/v1/testcases/update/${id}`, data).then(r => r.data)
export const deleteTestCase = (id) => api.delete(`/api/v1/testcases/delete/${id}`).then(r => r.data)
