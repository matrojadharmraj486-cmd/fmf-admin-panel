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
      localStorage.removeItem('fm_admin_token')
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

// Dashboard (robust stats fetch: supports multiple backend route variants)
export const getDashboardStats = async () => {
  try {
    const { data } = await api.get('/admin/stats')
    return data
  } catch (err) {
    if (err?.response?.status === 404) {
      const { data } = await api.get('/api/admin/stats')
      return data
    }
    throw err
  }
}

export const getDashboardTimeseries = async (params = {}) => {
  const query = typeof params === 'number' ? { days: params } : (params || {})
  try {
    const { data } = await api.get('/admin/stats/timeseries', { params: query })
    return data
  } catch (err) {
    if (err?.response?.status === 404) {
      const { data } = await api.get('/api/admin/stats/timeseries', { params: query })
      return data
    }
    throw err
  }
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

// Notifications (Admin)
export const sendNotification = async ({ userId, title, body, data = {} }) => (
  await api.post('/api/admin/notifications/send', { userId, title, body, data })
).data

// Payments (Admin)
export const listPayments = async (params = {}) => (await api.get('/api/admin/payments', { params })).data

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
export const setQOTD = async ({ question, answerType, answer, answerImage, answerImageUrl }) => {
  if (answerType === 'image' && answerImage && typeof answerImage !== 'string') {
    const form = new FormData()
    form.append('question', question)
    form.append('answerType', 'image')
    form.append('answerImage', answerImage)
    return (await api.post('/api/question-of-the-day', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
  if (answerType === 'image' && (answerImageUrl || typeof answerImage === 'string')) {
    return (await api.post('/api/question-of-the-day', { question, answerType: 'image', answerImageUrl: answerImageUrl || answerImage })).data
  }
  return (await api.post('/api/question-of-the-day', { question, answerType: 'text', answer })).data
}
export const getQOTD = async () => (await api.get('/api/question-of-the-day')).data

// Banners
export const uploadBanner = async ({ file, imageUrl, bannerType, redirectionUrl }) => {
  if (file) {
    const form = new FormData()
    form.append('image', file)
    if (bannerType) form.append('bannerType', bannerType)
    if (redirectionUrl) form.append('redirectionUrl', redirectionUrl)
    return (await api.post('/api/admin/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
  return (await api.post('/api/admin/banners', { imageUrl, bannerType, redirectionUrl })).data
}
export const listBanners = async (params = {}) => (await api.get('/api/admin/banner', { params })).data
export const deleteBanner = async (id) => (await api.delete(`/api/admin/banners/${id}`)).data
export const updateBanner = async (id, { file, imageUrl, bannerType, redirectionUrl, isActive }) => {
  if (file) {
    const form = new FormData()
    if (bannerType) form.append('bannerType', bannerType)
    if (redirectionUrl) form.append('redirectionUrl', redirectionUrl)
    if (typeof isActive !== 'undefined') form.append('isActive', String(isActive))
    form.append('image', file)
    return (await api.put(`/api/admin/banners/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
  const payload = {}
  if (bannerType) payload.bannerType = bannerType
  if (redirectionUrl) payload.redirectionUrl = redirectionUrl
  if (imageUrl) payload.imageUrl = imageUrl
  if (typeof isActive !== 'undefined') payload.isActive = isActive
  return (await api.put(`/api/admin/banners/${id}`, payload)).data
}

// Testimonials
export const createTestimonial = async ({ photo, name, designation, location, review }) => {
  const form = new FormData()
  if (photo) form.append('photo', photo)
  form.append('name', name)
  form.append('designation', designation)
  form.append('location', location)
  form.append('review', review)
  return (await api.post('/api/admin/testimonials', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const listTestimonials = async () => (await api.get('/api/admin/testimonials')).data
export const deleteTestimonial = async (id) => (await api.delete(`/api/admin/testimonials/${id}`)).data
export const updateTestimonial = async (id, { photo, name, designation, location, review }) => {
  if (photo) {
    const form = new FormData()
    if (name) form.append('name', name)
    if (designation) form.append('designation', designation)
    if (location) form.append('location', location)
    if (review) form.append('review', review)
    form.append('photo', photo)
    return (await api.put(`/api/admin/testimonials/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
  const payload = {}
  if (name) payload.name = name
  if (designation) payload.designation = designation
  if (location) payload.location = location
  if (review) payload.review = review
  return (await api.put(`/api/admin/testimonials/${id}`, payload)).data
}

// FAQs
export const listFaqsAdmin = async () => {
  try {
    return (await api.get('/api/admin/faqs')).data
  } catch (err) {
    if (err?.response?.status === 404) {
      return (await api.get('/api/admin/faq')).data
    }
    throw err
  }
}
export const createFaq = async (payload) => {
  try {
    return (await api.post('/api/admin/faqs', payload)).data
  } catch (err) {
    if (err?.response?.status === 404) {
      return (await api.post('/api/admin/faq', payload)).data
    }
    throw err
  }
}
export const updateFaq = async (id, payload) => {
  try {
    return (await api.put(`/api/admin/faqs/${id}`, payload)).data
  } catch (err) {
    if (err?.response?.status === 404) {
      return (await api.put(`/api/admin/faq/${id}`, payload)).data
    }
    throw err
  }
}
export const deleteFaq = async (id) => {
  try {
    return (await api.delete(`/api/admin/faqs/${id}`)).data
  } catch (err) {
    if (err?.response?.status === 404) {
      return (await api.delete(`/api/admin/faq/${id}`)).data
    }
    throw err
  }
}

// FAQs (Public)
export const listFaqsPublic = async () => {
  try {
    return (await api.get('/api/faqs')).data
  } catch (err) {
    if (err?.response?.status === 404) {
      return (await api.get('/api/faq')).data
    }
    throw err
  }
}

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
export const uploadStructuredQuestions = async ({ file, year, part, paper }) => {
  const form = new FormData()
  form.append('file', file)
  if (year) form.append('year', year)
  if (part) form.append('part', part)
  if (paper) form.append('paper', paper)
  return (await api.post('/api/admin/questions-structured/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const createStructuredQuestion = async (payload) => (await api.post('/api/admin/questions-structured', payload)).data
export const getStructuredQuestions = async () => (await api.get('/api/admin/questions-structured')).data
export const getStructuredQuestionsFiltered = async (year, part, paper) => {
  const partParam = String(part || '').toLowerCase().includes('2') ? 'Part 2' : 'Part 1'
  const params = { year, part: partParam }
  if (paper) params.paper = paper
  const res = await api.get('/api/admin/questions-structured', { params })
  return res.data?.data || res.data
}
export const deleteStructuredQuestionsByYearPart = async (year, part) => {
  const partParam = String(part || '').toLowerCase().includes('2') ? 'Part 2' : 'Part 1'
  return (await api.delete('/api/admin/questions-structured', { params: { year, part: partParam } })).data
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

// Questions metadata (Year/Part/Paper)
export const getQuestionYears = async () => (await api.get('/api/questions/years')).data
export const getQuestionParts = async (year) => (await api.get('/api/questions/parts', { params: { year } })).data
export const getQuestionPapers = async (year, part) => (await api.get('/api/questions/papers', { params: { year, part } })).data

// Editor image upload
export const uploadEditorImage = async (file) => {
  const form = new FormData()
  form.append('image', file)
  return (await api.post('/api/admin/editor-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}

// Subscriptions
export const listSubscriptions = async (includeInactive = true) => {
  const { data } = await api.get('/api/admin/subscriptions', { params: { includeInactive } })
  return data
}
export const createSubscription = async (payload) => (await api.post('/api/admin/subscriptions', payload)).data
export const updateSubscription = async (id, payload) => (await api.put(`/api/admin/subscriptions/${id}`, payload)).data
export const updateSubscriptionStatus = async (id, isActive) => (
  await api.patch(`/api/admin/subscriptions/${id}/status`, { isActive })
).data

// Payment Gateway (Admin)
export const getPaymentGatewaySettings = async () => (await api.get('/api/admin/payment-gateway')).data
export const updatePaymentGatewaySettings = async (payload) => (await api.put('/api/admin/payment-gateway', payload)).data

// Support Tickets
export const listSupportTickets = async (params = {}) => {
  const { data } = await api.get('/api/admin/support-tickets', { params })
  return data
}
export const updateSupportTicket = async (id, payload) => (
  await api.patch(`/api/admin/support-tickets/${id}`, payload)
).data

// Opinions
export const listOpinions = async () => {
  try {
    const { data } = await api.get('/api/admin/opinions')
    return data
  } catch (err) {
    if (err?.response?.status === 404) {
      const { data } = await api.get('/api/opinions')
      return data
    }
    throw err
  }
}

export const deleteOpinion = async (id) => (await api.delete(`/api/admin/opinions/${id}`)).data
export const bulkDeleteOpinions = async (ids = []) => (
  await api.post('/api/admin/opinions/bulk-delete', { ids })
).data
