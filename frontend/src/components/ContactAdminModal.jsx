// "SMS yuborish uchun adminga murojaat qiling" modali.
// Bosilganda admin Telegram lichkasiga o'tadi.
import React from 'react'
import { haptic } from '../utils'
import { useT } from '../i18n'

const ADMIN_TG = 'https://t.me/fattoyev_a'   // admin support akkaunti

export default function ContactAdminModal({ onClose }) {
  const t = useT()

  const openAdmin = () => {
    haptic('light')
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) tg.openTelegramLink(ADMIN_TG)
    else window.open(ADMIN_TG, '_blank')
  }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-anim" style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520, padding: '20px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        {/* Tepada X close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="#64748b" strokeWidth="1.7" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ width: 60, height: 60, borderRadius: 20, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 30 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>{t('sms_need_admin_title')}</div>
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>{t('sms_need_admin_desc')}</div>

        <button onClick={openAdmin} style={{
          width: '100%', padding: 15, borderRadius: 16, border: 'none',
          background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 5px 16px rgba(37,99,235,.35)', marginBottom: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M9.8 16.6l-.4 3.7c.5 0 .8-.2 1-.5l2.5-2.4 5.2 3.8c1 .5 1.6.3 1.9-.9L23.9 4.6c.3-1.4-.5-2-1.5-1.6L1.1 11.3c-1.4.5-1.4 1.3-.2 1.7l5.4 1.7L18.9 6c.6-.4 1.1-.2.7.2"/></svg>
          {t('sms_contact_admin_btn')}
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: '#f3f4f6', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{t('close')}</button>
      </div>
    </div>
  )
}
