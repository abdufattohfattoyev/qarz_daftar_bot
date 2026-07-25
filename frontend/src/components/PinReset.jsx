// PIN esdan chiqqanda tiklash oynasi.
// Telegramga 6 xonali kod yuboriladi; kod to'g'ri bo'lsa PIN o'chadi va
// foydalanuvchi ilovaga kiradi (keyin xohlasa Sozlamalardan yangi PIN qo'yadi).
import React, { useState } from 'react'
import { authAPI } from '../api'
import { haptic } from '../utils'
import { useT } from '../i18n'

export default function PinReset({ onClose, onDone }) {
  const t = useT()
  const [stage, setStage] = useState('send')   // 'send' | 'code'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const sendCode = async () => {
    if (busy) return
    setBusy(true); setErr(''); setMsg('')
    try {
      await authAPI.resetPinRequest()
      haptic('success')
      setMsg(t('pin_reset_sent'))
      setStage('code')
    } catch (e) {
      haptic('error')
      setErr(e.response?.data?.error || t('err_generic'))
    } finally { setBusy(false) }
  }

  const confirm = async () => {
    if (busy || code.length !== 6) return
    setBusy(true); setErr('')
    try {
      await authAPI.resetPinConfirm(code)
      haptic('success')
      onDone()      // App: PIN o'chdi — ochilsin
    } catch (e) {
      haptic('error')
      setErr(e.response?.data?.error || t('err_generic'))
    } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.08)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>🔑</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{t('pin_reset_title')}</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24, lineHeight: 1.5, maxWidth: 300 }}>
          {stage === 'send' ? t('pin_reset_sub') : t('pin_reset_sub')}
        </div>

        {stage === 'code' && (
          <input
            type="text" inputMode="numeric" placeholder={t('pin_reset_code_ph')}
            value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%', maxWidth: 280, padding: '15px 18px', boxSizing: 'border-box',
              border: '2px solid #16a34a', borderRadius: 16, textAlign: 'center',
              fontSize: 26, fontWeight: 800, letterSpacing: 8, color: '#0f172a',
              background: '#fff', fontFamily: 'inherit', outline: 'none', marginBottom: 14,
            }}
          />
        )}

        {msg && <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 12 }}>{msg}</div>}
        {err && <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>{err}</div>}

        <button
          onClick={stage === 'send' ? sendCode : confirm}
          disabled={busy || (stage === 'code' && code.length !== 6)}
          className="pill-btn"
          style={{
            width: '100%', maxWidth: 280, padding: 15, border: 'none', borderRadius: 16,
            background: (stage === 'code' && code.length !== 6) ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: (stage === 'code' && code.length !== 6) ? '#94a3b8' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
            fontFamily: 'inherit', opacity: busy ? 0.8 : 1,
          }}
        >
          {busy ? t('loading') : stage === 'send' ? t('pin_reset_send') : t('pin_reset_confirm')}
        </button>

        {stage === 'code' && (
          <button onClick={sendCode} disabled={busy} style={{ marginTop: 16, background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('pin_reset_send')}
          </button>
        )}
      </div>
    </div>
  )
}
