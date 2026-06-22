import { create } from 'zustand'
import { authAPI, debtsAPI, contactsAPI, statsAPI } from '../api'

// ── Lokal sozlama (pref) saqlash ──────────────────────────────────────
// Til/valyuta/eslatma tanlovi backendga yozilmasa ham refreshdan keyin
// yo'qolmasligi uchun localStorage'da ham saqlaymiz.
const PREF_KEYS = ['currency', 'language', 'notifications_enabled']
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem('prefs') || '{}') } catch { return {} }
}
const savePrefs = (updates) => {
  const prefs = loadPrefs()
  PREF_KEYS.forEach((k) => { if (k in updates) prefs[k] = updates[k] })
  localStorage.setItem('prefs', JSON.stringify(prefs))
}

// Auth store
export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.initData) {
        tg.ready()
        tg.expand()

        // Telegram dan darhol user ma'lumotini olamiz (backend javobini kutmasdan)
        const tgUser = tg.initDataUnsafe?.user
        if (tgUser) {
          const display_name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
          set({ user: { display_name, telegram_username: tgUser.username || '', full_name: display_name, ...loadPrefs() }, loading: false })
        }

        const { data } = await authAPI.telegramAuth(tg.initData)
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        // Lokal tanlovni server qiymati ustiga qo'yamiz (server saqlamagan bo'lsa ham qoladi)
        set({ user: { ...data.user, ...loadPrefs() }, loading: false })
        return
      }

      // Telegram'dan ochilmagan — saqlangan token bor bo'lsa ishlatamiz
      const saved = localStorage.getItem('access_token')
      if (saved) {
        try {
          const { data } = await authAPI.me()
          set({ user: { ...data, ...loadPrefs() }, loading: false })
          return
        } catch {
          // FAQAT tokenlarni o'chiramiz — til/valyuta prefs saqlanib qoladi
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }

      // Hech narsa yo'q — dev login ekranini ko'rsat
      set({ loading: false, needDevLogin: true })
    } catch (err) {
      console.error('Auth xatosi:', err)
      set({ error: 'Autentifikatsiya xatosi', loading: false })
    }
  },

  devLogin: async () => {
    const { data } = await authAPI.devLogin()
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    set({ user: data.user, needDevLogin: false })
  },

  updateUser: async (updates) => {
    // 1. Lokal saqlaymiz — refreshdan keyin ham qoladi (backendga bog'liq emas)
    savePrefs(updates)
    // 2. UI ni darhol yangilaymiz (optimistic)
    set((s) => ({ user: { ...s.user, ...updates } }))
    // 3. Backend bilan sinxron — ishlamasa ham UI o'zgargan, lokal saqlangan
    try {
      const { data } = await authAPI.updateMe(updates)
      set((s) => ({ user: { ...data, ...loadPrefs() } }))
    } catch { /* server yangilanmadi — lokal qiymat qoladi */ }
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

  updateDebt: async (id, updates) => {
    const { data } = await debtsAPI.update(id, updates)
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? data : d)) }))
    return data
  },

  payDebt: async (id, payData) => {
    const { data } = await debtsAPI.pay(id, payData)
    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? data.debt : d)),
    }))
    return data
  },

  updateDebt: async (id, data) => {
    const { data: updated } = await debtsAPI.update(id, data)
    set((s) => ({ debts: s.debts.map((d) => (d.id === id ? updated : d)) }))
    return updated
  },

  deleteDebt: async (id) => {
    await debtsAPI.delete(id)
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }))
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value } }))
  },

  // Sana bo'yicha guruhlab qaytarish (to'langanlar ham ko'rinadi, lekin
  // guruh summasiga faqat to'lanmaganlar qo'shiladi)
  groupedByDate: () => {
    const debts = get().debts
    const groups = {}
    debts.forEach((debt) => {
      // created_at ba'zan bo'lmasligi mumkin (optimistic qo'shilgan) — qulamaslik uchun himoya
      const date = (debt.created_at || new Date().toISOString()).split('T')[0]
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

  updateContact: async (id, updates) => {
    const { data } = await contactsAPI.update(id, updates)
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? data : c)) }))
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
    a.download = 'qarz_yordamchi.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  },
}))
