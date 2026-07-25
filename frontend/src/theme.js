// Tungi/kunduzgi rejim.
// Ranglar inline style'larda tarqoq bo'lgani uchun bitta token to'plami bilan
// ishlaymiz: har sahifa `const c = useTheme()` qiladi va c.bg / c.card / c.text
// kabi tokenlardan foydalanadi. Aksentlar (yashil/qizil) ikkala rejimda bir xil —
// kunduzgi dizayn shu ranglar ustiga qurilgan.
import { useEffect } from 'react'
import { useAuthStore } from './store'

const LIGHT = {
  dark: false,
  bg: '#F0F2F5',          // sahifa foni
  card: '#ffffff',        // karta / ro'yxat foni
  card2: '#f8fafc',       // ichki (ikkilamchi) yuza
  chip: '#f1f5f9',        // pill / badge foni
  text: '#0f172a',        // asosiy matn
  text2: '#64748b',       // ikkilamchi matn
  muted: '#94a3b8',       // uchinchi darajali matn
  faint: '#cbd5e1',       // eng och matn (valyuta yorlig'i va h.k.)
  border: 'rgba(0,0,0,0.06)',
  borderStrong: '#e5e7eb',
  shadow: '0 2px 10px rgba(0,0,0,.05)',
  shadowSm: '0 1px 8px rgba(0,0,0,.05)',
  inputBg: '#ffffff',
  navBg: '#ffffff',
  sheetBg: '#ffffff',
  greenSoft: '#f0fdf4',
  greenBorder: '#bbf7d0',
  redSoft: '#fef2f2',
  redBorder: '#fecaca',
  blueSoft: '#eff6ff',
  blueBorder: '#bfdbfe',
  amberSoft: '#fffbeb',
  amberBorder: '#fde68a',
  pillActiveBg: '#0f172a',
  pillActiveText: '#ffffff',
  overlay: 'rgba(15,23,42,.5)',
  tgHeader: '#16a34a',
}

const DARK = {
  dark: true,
  bg: '#0b1220',
  card: '#151f31',
  card2: '#1b2740',
  chip: '#22304a',
  text: '#e8eef7',
  text2: '#9aa9be',
  muted: '#7f8fa6',
  faint: '#5b6b82',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: '#2c3a52',
  shadow: '0 2px 12px rgba(0,0,0,.45)',
  shadowSm: '0 1px 8px rgba(0,0,0,.35)',
  inputBg: '#1b2740',
  navBg: '#111a2b',
  sheetBg: '#151f31',
  greenSoft: 'rgba(34,197,94,.14)',
  greenBorder: 'rgba(34,197,94,.35)',
  redSoft: 'rgba(239,68,68,.14)',
  redBorder: 'rgba(239,68,68,.35)',
  blueSoft: 'rgba(59,130,246,.14)',
  blueBorder: 'rgba(59,130,246,.35)',
  amberSoft: 'rgba(245,158,11,.14)',
  amberBorder: 'rgba(245,158,11,.35)',
  pillActiveBg: '#16a34a',
  pillActiveText: '#ffffff',
  overlay: 'rgba(0,0,0,.65)',
  tgHeader: '#0b1220',
}

export const THEMES = ['light', 'dark', 'auto']

const prefersDark = () => {
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
}

/** Tanlangan rejimni ('light'|'dark'|'auto') haqiqiy rejimga aylantiradi. */
export const resolveTheme = (pref) => {
  if (pref === 'dark') return 'dark'
  if (pref === 'light') return 'light'
  // 'auto' yoki noma'lum — Telegram mavzusiga, bo'lmasa tizimga ergashamiz
  const tg = window.Telegram?.WebApp
  if (tg?.colorScheme) return tg.colorScheme === 'dark' ? 'dark' : 'light'
  return prefersDark() ? 'dark' : 'light'
}

/** Joriy rang tokenlari. */
export function useTheme() {
  const pref = useAuthStore((s) => s.user?.theme) || 'light'
  return resolveTheme(pref) === 'dark' ? DARK : LIGHT
}

/** Faqat rejim nomi kerak bo'lganda. */
export function useThemeMode() {
  return useAuthStore((s) => s.user?.theme) || 'light'
}

/**
 * Rejim o'zgarganda hujjat foni, Telegram panel rangi va `data-theme`
 * atributini yangilaydi (CSS ichida ham ishlata olamiz).
 */
export function useApplyTheme() {
  const pref = useThemeMode()
  const mode = resolveTheme(pref)
  const c = mode === 'dark' ? DARK : LIGHT

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = mode
    root.style.colorScheme = mode
    document.body.style.background = c.bg
    const tg = window.Telegram?.WebApp
    try {
      tg?.setHeaderColor?.(c.tgHeader)
      tg?.setBackgroundColor?.(c.bg)
    } catch { /* eski Telegram versiyasi — muhim emas */ }
  }, [mode, c.bg, c.tgHeader])

  return c
}

export { LIGHT, DARK }
