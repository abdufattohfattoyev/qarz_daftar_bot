// Telefonni tasdiqlash — 2 bosqichli to'liq ekran modal.
// 1) Raqam kiritish → SMS orqali 4 xonali kod yuboriladi
// 2) Kodni kiritish → tasdiqlanadi (backend user.phone_verified = true qiladi)
import React, { useEffect, useRef, useState } from 'react'
import { authAPI } from '../api'
import { haptic } from '../utils'
import { useT } from '../i18n'

export default function PhoneVerify({ initialPhone = '', onClose, onVerified, mandatory = false }) {
  const t = useT()
  const [step, setStep] = useState('phone')   // 'phone' | 'code'
  const [phone, setPhone] = useState(initialPhone || '+998 ')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const codeRef = useRef(null)

  // Qayta yuborish taymeri
  useEffect(() => {
    if (resendIn <= 0) return
    const id = setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [resendIn])

  useEffect(() => { if (step === 'code') setTimeout(() => codeRef.current?.focus(), 200) }, [step])

  const sendCode = async () => {
    if (busy) return
    setError(''); setBusy(true)
    try {
      const { data } = await authAPI.sendPhoneCode(phone)
      haptic('success')
      setPhone(data.phone || phone)
      setStep('code'); setCode(''); setResendIn(60)
    } catch (e) {
      haptic('error')
      setError(e.response?.data?.error || t('sms_err'))
    } finally { setBusy(false) }
  }

  const verify = async () => {
    if (busy || code.length < 4) return
    setError(''); setBusy(true)
    try {
      const { data } = await authAPI.verifyPhoneCode(phone, code)
      haptic('success')
      onVerified?.(data)
    } catch (e) {
      haptic('error')
      setError(e.response?.data?.error || t('sms_err'))
      setCode('')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>
      {/* Header — chapda ortga (kod bosqichida), o'ngda X yopish (majburiy bo'lmasa) */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 10, flexShrink: 0 }}>
        {step === 'code' ? (
          <button onClick={() => { setStep('phone'); setError('') }}
            style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        ) : <div style={{ width: 34 }} />}
        <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: '#111', textAlign: 'center' }}>{t('phone_verify_row')}</div>
        {!mandatory ? (
          <button onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        ) : <div style={{ width: 34 }} />}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0 18px', fontSize: 34 }}>
          {step === 'phone' ? '📱' : '🔑'}
        </div>

        {step === 'phone' ? (
          <>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 6, textAlign: 'center' }}>{t('phone_enter_title')}</div>
            {mandatory && (
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 8, textAlign: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '7px 14px' }}>
                {t('phone_mandatory_note')}
              </div>
            )}
            <div style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 22, textAlign: 'center', lineHeight: 1.5, maxWidth: 300 }}>{t('phone_enter_sub')}</div>
            <input
              type="tel" inputMode="tel" autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ''))}
              placeholder="+998 90 123 45 67"
              style={{ width: '100%', maxWidth: 340, padding: '15px 18px', borderRadius: 16, border: '2px solid #16a34a', background: '#fff', fontSize: 20, fontWeight: 700, color: '#0f172a', textAlign: 'center', letterSpacing: 1, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <div style={{ marginTop: 14, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</div>}
            <button onClick={sendCode} disabled={busy} style={btn(busy)}>
              {busy ? t('phone_sending') : t('phone_send_code')}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 6, textAlign: 'center' }}>{t('phone_code_title')}</div>
            <div style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 22, textAlign: 'center', lineHeight: 1.5, maxWidth: 300 }}>
              {t('phone_code_sub', { phone })}
            </div>
            <input
              ref={codeRef}
              type="tel" inputMode="numeric" maxLength={4}
              value={code}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCode(v); if (v.length === 4) setError('') }}
              placeholder="0000"
              style={{ width: 180, padding: '15px 0', borderRadius: 16, border: '2px solid #16a34a', background: '#fff', fontSize: 34, fontWeight: 800, color: '#0f172a', textAlign: 'center', letterSpacing: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <div style={{ marginTop: 14, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</div>}
            <button onClick={verify} disabled={busy || code.length < 4} style={btn(busy || code.length < 4)}>
              {busy ? t('phone_verifying') : t('phone_verify_btn')}
            </button>
            <button onClick={sendCode} disabled={resendIn > 0 || busy}
              style={{ marginTop: 14, background: 'none', border: 'none', color: resendIn > 0 ? '#94a3b8' : '#16a34a', fontSize: 13.5, fontWeight: 700, cursor: resendIn > 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {resendIn > 0 ? `${t('phone_resend')} (${resendIn})` : t('phone_resend')}
            </button>
          </>
        )}

        {/* Majburiy rejimda: kod kelmasa yordam (o'zini tuzoqqa tushgandek his qilmasin) */}
        {mandatory && (
          <button onClick={() => {
            const url = 'https://t.me/fattoyev_a'
            const tg = window.Telegram?.WebApp
            if (tg?.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank')
          }} style={{ marginTop: 28, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
            {t('phone_help')}
          </button>
        )}
      </div>
    </div>
  )
}

const btn = (disabled) => ({
  width: '100%', maxWidth: 340, marginTop: 22, padding: 16, borderRadius: 16, border: 'none',
  background: disabled ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
  color: disabled ? '#94a3b8' : '#fff', fontSize: 15, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
  boxShadow: disabled ? 'none' : '0 5px 16px rgba(22,163,74,.35)',
})
