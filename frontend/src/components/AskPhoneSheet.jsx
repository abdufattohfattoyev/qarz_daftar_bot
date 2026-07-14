// Qarzdorda (kontaktda) telefon bo'lmaganda — SMS yuborishdan oldin raqamni
// shu yerda so'raymiz. Kiritilgan raqam kontaktga saqlanadi va SMS yuboriladi.
import React, { useState } from 'react'
import { haptic, normPhone, fmtPhone } from '../utils'
import { useT } from '../i18n'

export default function AskPhoneSheet({ contactName, onClose, onSubmit }) {
  const t = useT()
  const [phone, setPhone] = useState('+998 ')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const normalized = normPhone(phone)
  const typedDigits = phone.replace(/\D/g, '').length

  const submit = async () => {
    if (!normalized || busy) return
    haptic('light'); setBusy(true); setError('')
    try {
      await onSubmit(normalized)   // ota: kontaktga saqlaydi + SMS yuboradi
    } catch (e) {
      setError(e?.response?.data?.error || t('sms_err'))
      setBusy(false)
    }
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-anim" style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, padding: '18px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#e5e7eb', margin: '0 auto 16px' }} />

        <div style={{ width: 54, height: 54, borderRadius: 16, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}>📱</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>{t('ask_phone_title')}</div>
        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>
          {t('ask_phone_sub', { name: contactName || '' })}
        </div>

        <input
          type="tel" inputMode="tel" autoFocus
          value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/[^\d+ ]/g, '')); if (error) setError('') }}
          placeholder="+998 90 123 45 67"
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 15, background: '#fff', fontSize: 19, fontWeight: 700, color: '#0f172a', textAlign: 'center', letterSpacing: 1, fontFamily: 'inherit', outline: 'none',
            border: `2px solid ${typedDigits >= 3 ? (normalized ? '#16a34a' : '#f59e0b') : '#e5e7eb'}` }}
        />
        {/* Yozayotganda darhol izoh */}
        {typedDigits >= 3 && !error && (
          <div style={{ marginTop: 9, fontSize: 12.5, fontWeight: 600, textAlign: 'center', color: normalized ? '#16a34a' : '#b45309' }}>
            {normalized ? `✓ ${fmtPhone(normalized)}` : t('phone_hint_incomplete')}
          </div>
        )}
        {error && <div style={{ marginTop: 11, fontSize: 13, color: '#ef4444', textAlign: 'center', lineHeight: 1.4 }}>{error}</div>}

        <button onClick={submit} disabled={busy || !normalized} style={{
          width: '100%', marginTop: 18, padding: 15, borderRadius: 15, border: 'none',
          background: (busy || !normalized) ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: (busy || !normalized) ? '#94a3b8' : '#fff', fontSize: 15, fontWeight: 700,
          cursor: (busy || !normalized) ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>
          {busy ? t('sms_sending') : t('ask_phone_save_send')}
        </button>
        <button onClick={onClose} style={{ width: '100%', marginTop: 9, padding: 13, borderRadius: 15, border: 'none', background: '#f3f4f6', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t('cancel_full')}
        </button>
      </div>
    </div>
  )
}
