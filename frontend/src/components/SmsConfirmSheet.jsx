// SMS yuborishdan oldingi tasdiqlash — kimga va aynan qanday matn ketishini ko'rsatadi.
// SMS qaytarib bo'lmaydi va pullik, shuning uchun bu oyna xato raqamdan saqlaydi.
// Matnni shu yerda tahrirlash mumkin — onConfirm(text) bilan qaytadi.
import React, { useState } from 'react'
import { initials, avatarColor, fmtPhone, normPhone } from '../utils'
import { useT } from '../i18n'

export default function SmsConfirmSheet({ preview, busy, onClose, onConfirm }) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(preview?.text || '')
  if (!preview) return null

  const av = avatarColor(preview.contact_name || '')
  const nice = fmtPhone(normPhone(preview.phone)) || preview.phone
  const maxLen = preview.max_len || 300
  const edited = editing && text.trim() !== (preview.text || '').trim()
  // Standart matnda o'zgartirilmagan bo'lsa text yubormaymiz (backend shablonni ishlatadi)
  const sendText = () => onConfirm(edited ? text : undefined)

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-anim" style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, padding: '16px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#e5e7eb', margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 18 18" fill="none">
              <path d="M2.5 4.5h13v9H8l-3 2.5V13.5h-2.5z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: '#0f172a' }}>{t('sms_confirm_title')}</div>
        </div>

        {/* Kimga — eng muhimi: xato raqamga ketmasin */}
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{t('sms_confirm_to')}</div>
        <div style={{ background: '#f8fafc', borderRadius: 13, padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
            {initials(preview.contact_name || '')}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.contact_name}</div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 1, letterSpacing: .2 }}>{nice}</div>
          </div>
        </div>

        {/* Qarzdor o'qiydigan aynan matn — tahrirlash mumkin */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, flex: 1 }}>{t('sms_confirm_text')}</span>
          {!busy && (
            <button onClick={() => { if (editing) { setText(preview.text || '') } setEditing((v) => !v) }}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
              {editing ? t('sms_edit_reset') : `✎ ${t('sms_edit_btn')}`}
            </button>
          )}
        </div>

        {editing ? (
          <>
            <textarea
              value={text} maxLength={maxLen} rows={5} autoFocus disabled={busy}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 13,
                padding: 12, marginBottom: 6, fontSize: 13, lineHeight: 1.6, color: '#0f172a',
                border: '1.5px solid #16a34a', fontFamily: 'inherit', outline: 'none', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{t('sms_brand_note')}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: text.length > maxLen * 0.9 ? '#f97316' : '#94a3b8' }}>
                {t('sms_len', { n: text.length, max: maxLen })}
              </span>
            </div>
          </>
        ) : (
          <div style={{ background: '#f8fafc', borderRadius: 13, padding: 12, marginBottom: 18, fontSize: 13, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap' }}>
            {edited ? text : preview.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 9 }}>
          <button onClick={onClose} disabled={busy} style={{
            padding: 14, borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#64748b', fontSize: 14, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>{t('cancel_full')}</button>
          <button onClick={sendText} disabled={busy || (editing && text.trim().length < 20)} style={{
            padding: 14, borderRadius: 14, border: 'none',
            background: busy ? '#e2e8f0' : 'linear-gradient(135deg,#22c55e,#16a34a)',
            color: busy ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700,
            cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {busy ? t('sms_sending') : <>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M16 2L8 10M16 2l-5 14-3-6-6-3 14-5z" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t('sms_confirm_send')}
            </>}
          </button>
        </div>
      </div>
    </div>
  )
}
