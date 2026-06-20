import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useContactStore, useAuthStore } from '../store'
import { haptic } from '../utils'
import { useT } from '../i18n'
import axios from 'axios'

const CalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3" width="13" height="11.5" rx="3" stroke="#16a34a" strokeWidth="1.4"/>
    <path d="M5 1.5V4M11 1.5V4M1.5 7h13" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
const NoteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1.5" width="12" height="13" rx="2.5" stroke="#64748b" strokeWidth="1.4"/>
    <path d="M5 6h6M5 9h6M5 12h4" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
const PhoneIcon = ({ color = '#16a34a' }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M14 11.2c-.2-.2-1-.7-1.5-.9-.5-.2-.8-.1-1 .1l-.6.7c-.2.2-.4.2-.6.1-1-.5-2.6-1.9-3.4-3-.2-.3-.1-.5.1-.7l.6-.6c.3-.2.3-.5.1-.9-.2-.5-.7-1.3-1-1.6-.3-.3-.6-.3-.8-.2L5 4.5c-.9.6-1.3 1.6-1 2.7.5 1.4 1.6 2.9 2.9 4.1 1.2 1.2 2.7 2.3 4.1 2.8 1.1.4 2.1 0 2.7-.9l.5-.8c.2-.3.1-.5-.2-.7z" fill={color}/>
  </svg>
)
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="6" r="3.5" stroke="#64748b" strokeWidth="1.4"/>
    <path d="M2 14c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const formatPhone = (raw) => {
  const d = raw.replace(/\D/g, '')
  if (!d) return '+998 '
  const base = d.startsWith('998') ? d : d.startsWith('0') ? '998' + d.slice(1) : '998' + d
  const n = base.slice(3, 12)
  let r = '+998'
  if (n.length > 0) r += ' ' + n.slice(0, 2)
  if (n.length > 2) r += ' ' + n.slice(2, 5)
  if (n.length > 5) r += ' ' + n.slice(5, 7)
  if (n.length > 7) r += ' ' + n.slice(7, 9)
  return r
}

export default function AddDebt() {
  const navigate   = useNavigate()
  const t = useT()
  const { addDebt }                       = useDebtStore()
  const { contacts, fetchContacts, addContact } = useContactStore()

  const [debtType,  setDebtType]  = useState('gave')
  const [amount,    setAmount]    = useState('')
  const [numStr,    setNumStr]    = useState('')
  const [currency,  setCurrency]  = useState('UZS')
  const [note,      setNote]      = useState('')
  const [dueDate,   setDueDate]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const [phone,         setPhone]         = useState('+998 ')
  const [name,          setName]          = useState('')
  const [foundContact,  setFoundContact]  = useState(null)
  const [isNew,         setIsNew]         = useState(false)

  // track already-created contactId across retries
  const createdContactId = useRef(null)

  useEffect(() => { fetchContacts() }, [])

  useEffect(() => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) {
      setFoundContact(null); setIsNew(false)
      createdContactId.current = null
      return
    }
    const match = contacts.find(c => c.phone && c.phone.replace(/\D/g, '').includes(digits))
    if (match) {
      setFoundContact(match); setIsNew(false)
      setName(match.name)
      createdContactId.current = null
    } else {
      setFoundContact(null); setIsNew(true)
    }
  }, [phone, contacts])

  const handlePhoneChange = (e) => {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, '')
    if (!digits) { setPhone('+998 '); return }
    setPhone(formatPhone(digits))
  }

  const fmtNum = (raw) => raw ? new Intl.NumberFormat('uz-UZ').format(parseInt(raw)) : ''

  // Core save — idempotent (tracks contactId to avoid duplicate on retry)
  const doSave = async () => {
    const digits = phone.replace(/\D/g, '')
    let contactId = createdContactId.current
    if (!contactId) {
      if (foundContact) {
        contactId = foundContact.id
      } else {
        // Yangi kontakt yaratamiz. Backend ba'zan id qaytarmasligi yoki kontakt
        // allaqachon mavjud bo'lishi mumkin — har holatda ro'yxatdan id'ni topamiz.
        let newC = null
        let createErr = null
        try {
          newC = await addContact({ name: name.trim(), phone: '+' + digits })
        } catch (e) { createErr = e }
        contactId = newC?.id
        if (!contactId) {
          await fetchContacts().catch(() => {})
          const found = useContactStore.getState().contacts.find(
            (c) => c.phone && c.phone.replace(/\D/g, '') === digits
          )
          contactId = found?.id
        }
        // Topilmadi va kontakt yaratishda xato bo'lgan bo'lsa — o'sha aniq xatoni ko'rsatamiz
        if (!contactId && createErr) throw createErr
        createdContactId.current = contactId
      }
    }
    if (!contactId) throw new Error('Kontakt yaratilmadi')
    await addDebt({ contact: contactId, debt_type: debtType, amount, currency, note, due_date: dueDate })
  }

  // Xatoni aniq ko'rsatamiz: HTTP status + server xabari (diagnostika uchun)
  const describeError = (e) => {
    if (!e.response) return `Tarmoq xatosi: ${e.message || 'javob yo\'q'}`
    const d = e.response.data
    let body = ''
    if (typeof d === 'string') body = d.slice(0, 160)
    else if (d?.detail) body = d.detail
    else if (d && typeof d === 'object') body = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
    return `[${e.response.status}] ${body || t('err_generic')}`
  }

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9)                 return setError(t('err_phone'))
    if (!amount || parseFloat(amount) <= 0) return setError(t('err_amount'))
    if (!foundContact && !name.trim())      return setError(t('err_name'))

    setLoading(true); setError('')
    try {
      await doSave()
      haptic('success')
      navigate('/')
    } catch (e) {
      if (e.response?.status === 401) {
        // Token eskirgan → auth store init() orqali qayta auth qilib, bir marta qayta urinamiz
        try {
          await useAuthStore.getState().init()
          await doSave()
          haptic('success')
          navigate('/')
          return
        } catch (e2) {
          setError(describeError(e2))
          haptic('error')
          return
        }
      }
      setError(describeError(e))
      haptic('error')
    } finally { setLoading(false) }
  }

  const isGave     = debtType === 'gave'
  const accent     = isGave ? '#16a34a' : '#ef4444'
  const digits     = phone.replace(/\D/g, '')
  const canSubmit  = digits.length >= 9
    && parseFloat(amount) > 0
    && (foundContact || name.trim())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── STICKY HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: isGave
          ? 'linear-gradient(135deg,#0a4d26,#16a34a)'
          : 'linear-gradient(135deg,#7f1d1d,#dc2626)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background .3s',
      }}>
        <button onClick={() => navigate('/')} className="nav-btn" style={{
          width: 32, height: 32, borderRadius: 9, border: 'none',
          background: 'rgba(255,255,255,.18)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('new_debt')}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>
            {isGave ? t('you_gave') : t('you_got')}
          </div>
        </div>
        <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,.2)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff' }}>
          {isGave ? t('gave_chip') : t('got_chip')}
        </div>
      </div>

      {/* ── SCROLL BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>

        {/* Type toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 14px 4px' }}>
          {[
            { value: 'gave', title: t('gave_title'), desc: t('gave_desc'),  arrow: '↗', green: true },
            { value: 'got',  title: t('got_title'),  desc: t('got_desc'),     arrow: '↙', green: false },
          ].map((t) => {
            const active = debtType === t.value
            return (
              <button key={t.value} className="pill-btn"
                onClick={() => { haptic('light'); setDebtType(t.value) }}
                style={{
                  padding: '12px', borderRadius: 16, fontFamily: 'inherit', cursor: 'pointer',
                  border: `2px solid ${active ? (t.green ? '#16a34a' : '#ef4444') : 'rgba(0,0,0,0.07)'}`,
                  background: active ? (t.green ? '#f0fdf4' : '#fef2f2') : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  gap: 4, textAlign: 'left', position: 'relative',
                  boxShadow: active ? (t.green ? '0 3px 12px rgba(22,163,74,.2)' : '0 3px 12px rgba(239,68,68,.2)') : '0 1px 4px rgba(0,0,0,.05)',
                }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: t.green ? '#dcfce7' : '#fee2e2', color: t.green ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{t.arrow}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? (t.green ? '#16a34a' : '#ef4444') : '#374151' }}>{t.title}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>{t.desc}</div>
                {active && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: t.green ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Currency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#e8eaf0', borderRadius: 14, padding: 3, gap: 3, margin: '12px 14px' }}>
          {['UZS', 'USD'].map((c) => (
            <button key={c} className="pill-btn" onClick={() => { haptic('light'); setCurrency(c) }} style={{
              padding: '10px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer',
              border: currency === c ? `1.5px solid ${accent}40` : 'none',
              background: currency === c ? '#fff' : 'transparent',
              fontSize: 14, fontWeight: currency === c ? 700 : 500,
              color: currency === c ? accent : '#94a3b8',
            }}>{c}</button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ margin: '0 14px 12px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>
            {t('amount_label')}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: '#fff', borderRadius: 16, border: `2px solid ${accent}`, boxSizing: 'border-box' }}>
            <span style={{ fontSize: 15, color: accent, fontWeight: 800, flexShrink: 0 }}>{currency === 'USD' ? '$' : 'UZS'}</span>
            <input
              type="text" inputMode="numeric" placeholder="0" value={numStr}
              onChange={(e) => { const r = e.target.value.replace(/\D/g, ''); setNumStr(fmtNum(r)); setAmount(r) }}
              style={{ flex: 1, padding: '15px 0', border: 'none', fontSize: 26, fontWeight: 800, color: '#0f172a', background: 'transparent', fontFamily: 'inherit', outline: 'none', letterSpacing: -0.5, minWidth: 0 }}
            />
          </div>
        </div>

        {/* Phone */}
        <div style={{ padding: '0 14px', marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
            <PhoneIcon color="#64748b" /> {t('phone_num')}
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
            background: '#fff', borderRadius: 14, boxSizing: 'border-box',
            border: foundContact ? '2px solid #22c55e' : isNew ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)',
          }}>
            <PhoneIcon color={foundContact ? '#22c55e' : accent} />
            <input
              type="tel" inputMode="numeric" placeholder="+998 90 123 45 67"
              value={phone} onChange={handlePhoneChange}
              style={{ flex: 1, padding: '13px 0', border: 'none', fontSize: 16, fontWeight: 600, color: '#0f172a', background: 'transparent', fontFamily: 'inherit', outline: 'none', letterSpacing: .3, minWidth: 0 }}
            />
            {digits.length > 3 && (
              <button onClick={() => { setPhone('+998 '); setFoundContact(null); setIsNew(false); setName(''); createdContactId.current = null }}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#e5e7eb"/>
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Name — always visible */}
        <div style={{ padding: '0 14px', marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
            <PersonIcon /> {t('name_req')}
            {foundContact && <span style={{ marginLeft: 4, fontSize: 11, color: '#22c55e', fontWeight: 700 }}>{t('found_tag')}</span>}
            {isNew && digits.length >= 9 && <span style={{ marginLeft: 4, fontSize: 11, color: accent, fontWeight: 700 }}>{t('new_contact_tag')}</span>}
          </label>
          <input
            type="text" placeholder={t('name_ph2')}
            value={name} onChange={(e) => { if (!foundContact) setName(e.target.value) }}
            readOnly={!!foundContact}
            style={{
              width: '100%', padding: '13px 14px', borderRadius: 14, boxSizing: 'border-box',
              border: foundContact ? '2px solid #22c55e' : name.trim() ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)',
              fontSize: 15, fontWeight: 600,
              color: foundContact ? '#15803d' : '#111',
              background: foundContact ? '#f0fdf4' : '#fff',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        {/* Note */}
        <div style={{ padding: '0 14px', marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            <NoteIcon /> {t('note_optional')}
          </label>
          <input
            type="text" placeholder={t('note_ph')}
            value={note} onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '13px 14px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14, fontSize: 14, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Due date */}
        <div style={{ padding: '0 14px', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            <CalIcon /> {t('due_optional')}
          </label>
          <input
            type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            onClick={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
            onFocus={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
            style={{ width: '100%', padding: '13px 14px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14, fontSize: 16, color: dueDate ? '#111' : '#94a3b8', background: '#fff', fontFamily: 'inherit', outline: 'none', WebkitAppearance: 'none', boxSizing: 'border-box', minHeight: 48 }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '0 14px 12px', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, margin: '0 14px' }}>
          <button className="pill-btn" onClick={() => navigate('/')} style={{
            padding: '14px 10px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16,
            background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('cancel')}</button>
          <button className="pill-btn" onClick={handleSubmit} disabled={loading || !canSubmit} style={{
            padding: 14, border: 'none', borderRadius: 16,
            background: canSubmit
              ? isGave ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f87171,#ef4444)'
              : '#e2e8f0',
            fontSize: 14, fontWeight: 700,
            color: canSubmit ? '#fff' : '#94a3b8',
            cursor: canSubmit && !loading ? 'pointer' : 'default', fontFamily: 'inherit',
            opacity: loading ? 0.8 : 1,
            boxShadow: canSubmit ? (isGave ? '0 4px 14px rgba(22,163,74,.35)' : '0 4px 14px rgba(239,68,68,.35)') : 'none',
          }}>
            {loading ? t('saving') : isGave ? t('save_gave') : t('save_got')}
          </button>
        </div>
      </div>
    </div>
  )
}
