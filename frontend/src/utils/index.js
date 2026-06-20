import dayjs from 'dayjs'
import 'dayjs/locale/uz'
dayjs.locale('uz')

export const fmt = (amount, currency = 'UZS') => {
  const num = parseFloat(amount || 0)
  return new Intl.NumberFormat('uz-UZ').format(Math.abs(num)) + ' ' + currency
}

export const fmtDate = (date) => dayjs(date).format('D MMMM YYYY')
export const fmtTime = (date) => dayjs(date).format('HH:mm')
export const fmtShort = (date) => dayjs(date).format('D MMM')

export const initials = (name = '') => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export const avatarColor = (name = '') => {
  const colors = [
    { bg: '#dcfce7', text: '#0f6e56' },
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fee2e2', text: '#991b1b' },
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export const haptic = (type = 'light') => {
  // success/error/warning → notificationOccurred; light/medium/heavy/rigid/soft → impactOccurred.
  // Noto'g'ri turdan Telegram xato otadi (WebAppHapticImpactStyleInvalid) — shuning uchun
  // to'g'ri API tanlaymiz va try/catch bilan o'raymiz; haptic ixtiyoriy, oqimni hech qachon buzmasin.
  try {
    const hf = window.Telegram?.WebApp?.HapticFeedback
    if (!hf) return
    if (type === 'success' || type === 'error' || type === 'warning') {
      hf.notificationOccurred(type)
    } else {
      hf.impactOccurred(type)
    }
  } catch { /* haptic muhim emas */ }
}
