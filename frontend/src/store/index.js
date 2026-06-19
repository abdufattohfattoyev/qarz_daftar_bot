import { create } from 'zustand'
import { authAPI, debtsAPI, contactsAPI, statsAPI } from '../api'

// Auth store
export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      const tg = window.Telegram?.WebApp
      if (tg) {
        tg.ready()
        tg.expand()
      }

      const initData = tg?.initData || ''

      if (!initData && import.meta.env.DEV) {
        // Dev rejimida test uchun
        console.warn('Dev mode: initData yo\'q, test user ishlatilmoqda')
        set({ loading: false })
        return
      }

      const { data } = await authAPI.telegramAuth(initData)
      localStorage.setItem('access_token', data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      set({ user: data.user, loading: false })
    } catch (err) {
      console.error('Auth xatosi:', err)
      set({ error: 'Autentifikatsiya xatosi', loading: false })
    }
  },

  updateUser: async (updates) => {
    const { data } = await authAPI.updateMe(updates)
    set({ user: data })
  },
}))

// Debts store
export const useDebtStore = create((set, get) => ({
  debts: [],
  loading: false,
  filters: { status: '', debt_type: '', currency: '', date_from: '', date_to: '' },

  fetchDebts: async (params = {}) => {
    set({ loading: true })
    try {
      const { data } = await debtsAPI.list({ ...get().filters, ...params })
      set({ debts: data.results || data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addDebt: async (debtData) => {
    const { data } = await debtsAPI.create(debtData)
    set((s) => ({ debts: [data, ...s.debts] }))
    return data
  },

  payDebt: async (id, payData) => {
    const { data } = await debtsAPI.pay(id, payData)
    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? data.debt : d)),
    }))
    return data
  },

  deleteDebt: async (id) => {
    await debtsAPI.delete(id)
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }))
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }))
  },

  // Sana bo'yicha guruhlab qaytarish
  groupedByDate: () => {
    const debts = get().debts
    const groups = {}
    debts.forEach((debt) => {
      const date = debt.created_at.split('T')[0]
      if (!groups[date]) groups[date] = { date, debts: [], total: 0 }
      const sign = debt.debt_type === 'gave' ? 1 : -1
      groups[date].debts.push(debt)
      groups[date].total += sign * parseFloat(debt.remaining_amount)
    })
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  },
}))

// Contacts store
export const useContactStore = create((set) => ({
  contacts: [],
  loading: false,

  fetchContacts: async (params = {}) => {
    set({ loading: true })
    try {
      const { data } = await contactsAPI.list(params)
      set({ contacts: data.results || data, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addContact: async (contactData) => {
    const { data } = await contactsAPI.create(contactData)
    set((s) => ({ contacts: [data, ...s.contacts] }))
    return data
  },

  deleteContact: async (id) => {
    await contactsAPI.delete(id)
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }))
  },
}))

// Stats store
export const useStatsStore = create((set) => ({
  stats: null,
  loading: false,
  period: 'month',
  currency: 'UZS',

  fetchStats: async (period, currency) => {
    set({ loading: true })
    try {
      const { data } = await statsAPI.get({ period, currency })
      set({ stats: data, loading: false, period, currency })
    } catch {
      set({ loading: false })
    }
  },

  exportExcel: async () => {
    const { data } = await statsAPI.export()
    const url = URL.createObjectURL(new Blob([data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'qarz_daftar.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  },
}))
