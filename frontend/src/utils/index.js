import dayjs from 'dayjs'
import 'dayjs/locale/uz'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('uz')

// Barcha sana/vaqt O'zbekiston vaqtida ko'rsatiladi (qurilma vaqt zonasidan qat'i nazar)
const TZ = 'Asia/Tashkent'

export const fmt = (amount, currency = 'UZS') => {
  const num = parseFloat(amount || 0)
  return new Intl.NumberFormat('uz-UZ').format(Math.abs(num)) + ' ' + currency
}

// Telefonni backend normalize_phone bilan bir xil tekshiradi — to'g'ri bo'lsa
// +998XXXXXXXXX, aks holda null
export const normPhone = (raw) => {
  let d = (raw || '').replace(/\D/g, '')
  if (d.length === 9) d = '998' + d
  return (d.length === 12 && d.startsWith('998')) ? '+' + d : null
}
// +998901234567 → +998 90 123 45 67
export const fmtPhone = (n) => {
  if (!n) return ''
  const d = n.slice(4)
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`
}

export const fmtDate = (date) => dayjs(date).tz(TZ).format('D MMMM YYYY')
export const fmtTime = (date) => dayjs(date).tz(TZ).format('HH:mm')
export const fmtDateTime = (date) => dayjs(date).tz(TZ).format('D MMMM YYYY, HH:mm')
export const fmtShort = (date) => dayjs(date).tz(TZ).format('D MMM')

// Bugundan berilgan sanagacha qancha kun (manfiy = o'tib ketgan, 0 = bugun)
export const daysUntil = (date) => {
  if (!date) return null
  const today = dayjs().tz(TZ).startOf('day')
  return dayjs(date).tz(TZ).startOf('day').diff(today, 'day')
}
// Til-aniq: global dayjs locale o'zgarib qolsa ham shu chaqiriqda majburlaymiz
export const nowTashkent = (loc = 'uz') => dayjs().tz(TZ).locale(loc === 'ru' ? 'ru' : 'uz').format('D MMMM YYYY, HH:mm')

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
