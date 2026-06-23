import React, { useState } from 'react'
import { useAuthStore } from '../store'
import { useT } from '../i18n'

const BOT_URL = 'https://t.me/Qarz_Yordamchi_Bot'

export default function CodeLogin() {
  const t = useT()
  const codeLogin = useAuthStore((s) => s.codeLogin)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const openBot = () => {
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) tg.openTelegramLink(BOT_URL)
    else window.open(BOT_URL, '_blank')
  }

  const submit = async () => {
    if (code.length !== 6) return setError(t('code_6digit'))
    setBusy(true); setError('')
    try {
      await codeLogin(code)
      // muvaffaqiyat — App o'zi qayta render qiladi (user o'rnatildi)
    } catch (e) {
      setError(e.response?.data?.error || t('code_wrong'))
      setBusy(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', padding: '0 28px' }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>📒</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{t('app_name')}</div>
      <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 26 }}>
        {t('code_hint')}
      </div>

      {/* 1-qadam: botdan kod olish */}
      <button onClick={openBot} style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%', maxWidth: 320, justifyContent: 'center',
        padding: '13px', borderRadius: 14, border: 'none', cursor: 'pointer', marginBottom: 14,
        background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', fontSize: 14, fontWeight: 700,
        boxShadow: '0 6px 18px rgba(22,163,74,.3)',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.94.44l-2.6-1.92-1.26 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.2-.18-.04-.28-.32-.1L7.74 14.6l-2.52-.78c-.55-.17-.56-.55.12-.82l9.84-3.8c.46-.16.86.1.46.6z"/></svg>
        {t('code_get')}
      </button>

      {/* 2-qadam: kodni kiritish */}
      <input
        inputMode="numeric" placeholder="• • • • • •" value={code}
        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        style={{
          width: '100%', maxWidth: 320, boxSizing: 'border-box', textAlign: 'center',
          padding: '14px', borderRadius: 14, border: `2px solid ${code.length === 6 ? '#16a34a' : 'rgba(0,0,0,0.12)'}`,
          fontSize: 24, fontWeight: 800, letterSpacing: 8, color: '#0f172a', background: '#fff',
          fontFamily: 'inherit', outline: 'none', marginBottom: 12,
        }}
      />

      {error && (
        <div style={{ width: '100%', maxWidth: 320, padding: '9px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, color: '#ef4444', textAlign: 'center', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button onClick={submit} disabled={busy || code.length !== 6} style={{
        width: '100%', maxWidth: 320, padding: '14px', borderRadius: 14, border: 'none',
        background: code.length === 6 ? '#0f172a' : '#cbd5e1', color: '#fff',
        fontSize: 15, fontWeight: 700, cursor: code.length === 6 ? 'pointer' : 'default',
        opacity: busy ? 0.6 : 1,
      }}>
        {busy ? t('loading') : t('code_enter')}
      </button>
    </div>
  )
}
