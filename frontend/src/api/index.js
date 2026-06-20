import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Token ni har so'rovga qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 bo'lsa token yangilash
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // Avval refresh token bilan urinib ko'r
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        }
        // Refresh token yo'q — Telegram initData bilan qayta auth
        const tg = window.Telegram?.WebApp
        if (tg?.initData) {
          const { data } = await axios.post('/api/auth/telegram/', { init_data: tg.initData })
          localStorage.setItem('access_token', data.tokens.access)
          localStorage.setItem('refresh_token', data.tokens.refresh)
          original.headers.Authorization = `Bearer ${data.tokens.access}`
          return api(original)
        }
        // Hech narsa yo'q — clear
        localStorage.clear()
      } catch {
        localStorage.clear()
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  telegramAuth: (init_data) => api.post('/auth/telegram/', { init_data }),
  devLogin: () => api.post('/auth/dev-login/', {}),
  me: () => api.get('/auth/me/'),
  updateMe: (data) => api.patch('/auth/me/', data),
}

// Contacts
export const contactsAPI = {
  list: (params) => api.get('/contacts/', { params }),
  get: (id) => api.get(`/contacts/${id}/`),
  create: (data) => api.post('/contacts/', data),
  update: (id, data) => api.patch(`/contacts/${id}/`, data),
  delete: (id) => api.delete(`/contacts/${id}/`),
  debts: (id) => api.get(`/contacts/${id}/debts/`),
}

// Debts
export const debtsAPI = {
  list: (params) => api.get('/debts/', { params }),
  get: (id) => api.get(`/debts/${id}/`),
  create: (data) => {
    const form = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) form.append(k, v) })
    return api.post('/debts/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  update: (id, data) => api.patch(`/debts/${id}/`, data),
  delete: (id) => api.delete(`/debts/${id}/`),
  pay: (id, data) => api.post(`/debts/${id}/pay/`, data),
  payments: (id) => api.get(`/debts/${id}/payments/`),
}

// Stats
export const statsAPI = {
  get: (params) => api.get('/stats/', { params }),
  export: () => api.get('/stats/export/', { responseType: 'blob' }),
}

export default api
