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

      // 1-urinish: refresh token bilan yangi access olamiz
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch { /* refresh ishlamadi — pastdagi Telegram auth'ga o'tamiz */ }
      }

      // 2-urinish: Telegram initData bilan butunlay qayta auth
      // (refresh muvaffaqiyatsiz bo'lsa ham bu yerga tushadi — avval to'xtab qolardi)
      const tg = window.Telegram?.WebApp
      if (tg?.initData) {
        try {
          const { data } = await axios.post('/api/auth/telegram/', { init_data: tg.initData })
          localStorage.setItem('access_token', data.tokens.access)
          localStorage.setItem('refresh_token', data.tokens.refresh)
          original.headers.Authorization = `Bearer ${data.tokens.access}`
          return api(original)
        } catch { /* bu ham ishlamadi — pastda tozalaymiz */ }
      }

      // Hech narsa ishlamadi — FAQAT tokenlarni o'chiramiz (prefs/til tegmaydi!)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  telegramAuth: (init_data) => api.post('/auth/telegram/', { init_data }),
  devLogin: () => api.post('/auth/dev-login/', {}),
  codeLogin: (code) => api.post('/auth/code-login/', { code }),
  me: () => api.get('/auth/me/'),
  appMeta: () => api.get('/auth/app-meta/'),
  updateMe: (data) => api.patch('/auth/me/', data),
  setPin: (pin) => api.post('/auth/pin/set/', { pin }),
  verifyPin: (pin) => api.post('/auth/pin/verify/', { pin }),
  disablePin: (pin) => api.post('/auth/pin/disable/', { pin }),
  sendPhoneCode: (phone) => api.post('/auth/phone/send-code/', { phone }),
  verifyPhoneCode: (phone, code) => api.post('/auth/phone/verify-code/', { phone, code }),
}

// Admin panel (faqat admin)
export const adminAPI = {
  overview: () => api.get('/auth/admin/overview/'),
  users: (q) => api.get('/auth/admin/users/', { params: q ? { q } : {} }),
  userDebts: (id) => api.get(`/auth/admin/user/${id}/debts/`),
  smsMode: () => api.get('/auth/admin/sms-toggle/'),
  setSmsMode: (mode) => api.post('/auth/admin/sms-toggle/', { mode }),
  userSmsAllow: (id, allowed) => api.post(`/auth/admin/user/${id}/sms-allow/`, { allowed }),
  smsLogs: () => api.get('/auth/admin/sms-logs/'),
  broadcast: (payload) => api.post('/auth/admin/broadcast/', payload),
  broadcastStatus: (id) => api.get(`/auth/admin/broadcast/${id}/status/`),
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
    // Bo'sh qiymatlarni ('') yubormaymiz — due_date='' backend DateField'ni yiqitadi
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, v) })
    return api.post('/debts/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  update: (id, data) => api.patch(`/debts/${id}/`, data),
  delete: (id) => api.delete(`/debts/${id}/`),
  pay: (id, data) => api.post(`/debts/${id}/pay/`, data),
  sendSms: (id) => api.post(`/debts/${id}/send_sms/`),
  payments: (id) => api.get(`/debts/${id}/payments/`),
}

// Stats
export const statsAPI = {
  get: (params) => api.get('/stats/', { params }),
  export: () => api.get('/stats/export/', { responseType: 'blob' }),
  send: (format) => api.post('/stats/send/', { format }),
  deleteAll: () => api.delete('/debts/delete_all/'),
}

export default api
