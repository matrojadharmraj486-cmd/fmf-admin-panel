import axios from 'axios'
import { getToken } from './authStorage'

export const api = axios.create({
  baseURL: import.meta?.env?.VITE_API_BASE_URL || 'https://fmf-backend.onrender.com',
  timeout: 20000
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('fmf_admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const loginAdmin = async (email, password) => {
  const { data } = await api.post('/api/admin/auth/login', { email, password })
  return data
}

// Dashboard
export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data
}

// Users
export const listUsers = async (q = '') => {
  const { data } = await api.get('/api/admin/users', { params: { q } })
  return data
}
export const blockUser = async (id) => (await api.post(`/admin/users/${id}/block`)).data
export const unblockUser = async (id) => (await api.post(`/admin/users/${id}/unblock`)).data
export const deleteUser = async (id) => (await api.delete(`/admin/users/${id}`)).data
export const subscribeUser = async (id) => (await api.put(`/api/admin/users/${id}/subscription`)).data
export const unsubscribeUser = async (id) => (await api.post(`/admin/users/${id}/unsubscribe`)).data

// Questions
export const createQuestion = async ({ text, year, part, answerType, answerText, answerImage }) => {
  if (answerType === 'image' && answerImage) {
    const form = new FormData()
    form.append('text', text)
    form.append('year', year)
    form.append('part', part)
    form.append('answerType', 'image')
    form.append('answerImage', answerImage)
    const { data } = await api.post('/admin/questions', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  } else {
    const { data } = await api.post('/admin/questions', { text, year, part, answerType: 'text', answerText })
    return data
  }
}
export const listQuestions = async (params = {}) => (await api.get('/admin/questions', { params })).data
export const deleteQuestion = async (id) => (await api.delete(`/admin/questions/${id}`)).data

// Question of the Day
export const setQOTD = async ({ text, answerType, answerText, answerImage }) => {
  if (answerType === 'image' && answerImage) {
    const form = new FormData()
    form.append('text', text)
    form.append('answerType', 'image')
    form.append('answerImage', answerImage)
    return (await api.post('/api/question-of-the-day', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
  return (await api.post('/api/question-of-the-day', { text, answerType: 'text', answerText })).data
}
export const getQOTD = async () => (await api.get('/api/question-of-the-day')).data

// Banners
export const uploadBanner = async (file) => {
  const form = new FormData()
  form.append('image', file)
  return (await api.post('/api/admin/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const listBanners = async () => (await api.get('/api/admin/banner')).data
export const deleteBanner = async (id) => (await api.delete(`/api/admin/banners/${id}`)).data

// Local mock (fallback optionally)
export const mockApi = {
  getStats: async () => ({
    users: 1243,
    questions: 43210,
    papers: 318,
    bookmarks: 9876
  }),
  listUsers: async (query = '') => {
    const all = Array.from({ length: 25 }).map((_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@fmf.dev`,
      blocked: i % 7 === 0,
      subscribed: i % 3 === 0
    }))
    return all.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  }
}

// Structured Questions (Admin)
export const uploadStructuredQuestions = async ({ file, year, part }) => {
  const form = new FormData()
  form.append('file', file)
  if (year) form.append('year', year)
  if (part) form.append('part', part)
  return (await api.post('/api/admin/questions-structured/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const getStructuredQuestions = async () => (await api.get('/api/admin/questions-structured')).data
export const getStructuredQuestionsFiltered = async (year, part) => {
  const partParam = String(part || '').toLowerCase().includes('2') ? 'Part 2' : 'Part 1'
  const res = await api.get('/api/admin/questions-structured', { params: { year, part: partParam } })
  return res.data?.data || res.data
}
export const updateStructuredParent = async (id, payload) => (await api.put(`/api/admin/questions-structured/${id}`, payload)).data
export const updateStructuredSub = async (id, subId, payload) => (await api.put(`/api/admin/questions-structured/${id}/sub/${subId}`, payload)).data
export const deleteStructuredParent = async (id) => (await api.delete(`/api/admin/questions-structured/${id}`)).data
export const deleteStructuredSub = async (id, subId) => (await api.delete(`/api/admin/questions-structured/${id}/sub/${subId}`)).data
export const uploadStructuredSubImage = async (id, subId, file) => {
  const form = new FormData()
  form.append('image', file)
  return (await api.post(`/api/admin/questions-structured/${id}/sub/${subId}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

// Structured Questions (Public)
export const getPublicQuestions = async (params = {}) => (await api.get('/api/questions', { params })).data

// Editor image upload
export const uploadEditorImage = async (file) => {
  const form = new FormData()
  form.append('image', file)
  return (await api.post('/api/admin/editor-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
