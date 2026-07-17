// Foydalanuvchida haqiqiy ism yo'q bo'lsa — SMS yuborishdan oldin shu yerda so'raymiz.
// (Telegram profil nomi taxallus/emoji bo'lishi mumkin, SMS'da yaramaydi.)
import React, { useState } from 'react'
import { haptic } from '../utils'
import { useT } from '../i18n'

export default function AskNameSheet({ initialName = '', onClose, onSubmit }) {
  const t = useT()
  const [name, setName] = useState(initialName || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const nameOk = name.trim().replace(/\s/g, '').length >= 2

  const submit = async () => {
    if (!nameOk || busy) return
    haptic('light'); setBusy(true); setError('')
    try {
      await onSubmit(name.trim())   // ota: saqlaydi + SMS yuboradi
    } catch (e) {
      setError(e?.response?.data?.real_name?.[0] || e?.response?.data?.error || t('sms_err'))
      setBusy(false)
    }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-anim" style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, padding: '18px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#e5e7eb', margin: '0 auto 16px' }} />

        <div style={{ width: 54, height: 54, borderRadius: 16, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}>✍️</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>{t('ask_name_title')}</div>
        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>{t('ask_name_sub')}</div>

        <input
          type="text" autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); if (error) setError('') }}
          placeholder={t('name_ph')}
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 15, background: '#fff', fontSize: 17, fontWeight: 600, color: '#0f172a', fontFamily: 'inherit', outline: 'none',
            border: `2px solid ${name.trim() ? (nameOk ? '#16a34a' : '#f59e0b') : '#e5e7eb'}` }}
        />
        <div style={{ fontSize: 11.5, color: name.trim() && !nameOk ? '#b45309' : '#94a3b8', marginTop: 7, lineHeight: 1.4, textAlign: 'center' }}>
          {name.trim() && !nameOk ? t('name_hint_short') : t('name_hint')}
        </div>
        {error && <div style={{ marginTop: 11, fontSize: 13, color: '#ef4444', textAlign: 'center', lineHeight: 1.4 }}>{error}</div>}

        <button onClick={submit} disabled={busy || !nameOk} style={{
          width: '100%', marginTop: 18, padding: 15, borderRadius: 15, border: 'none',
          background: (busy || !nameOk) ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: (busy || !nameOk) ? '#94a3b8' : '#fff', fontSize: 15, fontWeight: 700,
          cursor: (busy || !nameOk) ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>
          {busy ? t('sms_sending') : t('ask_name_save_send')}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 9, padding: 13, borderRadius: 15, border: 'none', background: '#f3f4f6', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t('cancel_full')}
        </button>
      </div>
    </div>
  )
}
