import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDebtStore, useContactStore, useAuthStore } from '../store'
import { haptic } from '../utils'
import { useT } from '../i18n'

const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M14 11.2c-.2-.2-1-.7-1.5-.9-.4-.2-.7-.1-1 .2l-.6.7c-.2.2-.4.3-.7.1-1-.5-2.6-2-3.4-3.1-.2-.3-.1-.5.1-.7l.7-.6c.3-.3.3-.6.2-1-.2-.5-.7-1.3-.9-1.5-.3-.3-.5-.3-.8-.2l-.8.5C3.2 5 2.9 6 3.3 7.3c.4 1.4 1.6 2.9 2.9 4.1 1.2 1.2 2.7 2.4 4.1 2.9 1.3.4 2.3.1 3-1l.5-.8c.1-.3.1-.5-.3-.7z" stroke="#64748b" strokeWidth="1.2" fill="none"/>
  </svg>
)

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
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="6" r="3.5" stroke="#64748b" strokeWidth="1.4"/>
    <path d="M2 14c0-3.5 2.7-5.5 6-5.5s6 2 6 5.5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

export default function AddDebt() {
  const navigate = useNavigate()
  const t = useT()
  const { addDebt } = useDebtStore()
  const { addContact, contacts, fetchContacts } = useContactStore()

  const [params] = useSearchParams()
  const existingContactId = params.get('contact')   // mavjud kontaktga qarz qo'shish — ism so'ralmaydi
  const existingName = params.get('name') || ''

  const [debtType,  setDebtType]  = useState('gave')
  const [amount,    setAmount]    = useState('')
  const [numStr,    setNumStr]    = useState('')
  const [currency,  setCurrency]  = useState('UZS')
  const [note,      setNote]      = useState('')
  const [dueDate,   setDueDate]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Kontaktlarni yuklab olamiz — telefon bo'yicha mavjud odamni aniqlash uchun
  useEffect(() => { if (!existingContactId) fetchContacts() }, [])

  // Telefon raqamidan raqamlarni ajratib, mavjud kontaktni topamiz
  const phoneDigits = phone.replace(/\D/g, '')
  const matched = (!existingContactId && phoneDigits.length >= 9)
    ? contacts.find((c) => (c.phone || '').replace(/\D/g, '') === phoneDigits)
    : null

  // Mavjud kontakt bo'lsa — uning id'sidan boshlaymiz; aks holda qayta urinishda
  // dublikat bo'lmasligi uchun yaratilgan kontakt id'sini eslab qolamiz
  const createdContactId = useRef(existingContactId || null)

  const fmtNum = (raw) => raw ? new Intl.NumberFormat('uz-UZ').format(parseInt(raw)) : ''

  const doSave = async () => {
    let contactId = createdContactId.current
    if (!contactId) {
      // Telefon bo'yicha mavjud odam topilgan bo'lsa — o'shani ishlatamiz
      if (matched?.id) {
        contactId = matched.id
        createdContactId.current = contactId
      } else {
        // Yangi kontakt — backend telefon/ism bo'yicha dublikatni qayta ishlatadi
        let newC = null
        let createErr = null
        try {
          newC = await addContact({ name: name.trim(), phone: phone.trim() })
        } catch (e) { createErr = e }
        contactId = newC?.id
        if (!contactId && createErr) throw createErr
        if (!contactId) throw new Error('Kontakt yaratilmadi')
        createdContactId.current = contactId
      }
    }
    await addDebt({ contact: contactId, debt_type: debtType, amount, currency, due_date: dueDate, note })
  }

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
    if (!existingContactId && !matched && !name.trim())  return setError(t('err_name'))
    if (!amount || parseFloat(amount) <= 0)  return setError(t('err_amount'))

    setLoading(true); setError('')
    try {
      await doSave()
      haptic('success')
      navigate(existingContactId ? `/contacts/${existingContactId}` : '/')
    } catch (e) {
      if (e.response?.status === 401) {
        try {
          await useAuthStore.getState().init()
          await doSave()
          haptic('success')
          navigate(existingContactId ? `/contacts/${existingContactId}` : '/')
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

  const isGave    = debtType === 'gave'
  const accent    = isGave ? '#16a34a' : '#ef4444'
  const goBack    = () => navigate(existingContactId ? `/contacts/${existingContactId}` : '/')
  const canSubmit = (existingContactId || matched || name.trim()) && parseFloat(amount) > 0

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
        <button onClick={goBack} className="nav-btn" style={{
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
            {existingName ? existingName : (isGave ? t('you_gave') : t('you_got'))}
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

        {/* Name — faqat yangi qarzda. Mavjud kontaktga qo'shilsa ism so'ralmaydi */}
        {existingContactId ? (
          <div style={{ padding: '0 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
              <PersonIcon />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>{existingName || t('name_req')}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 700 }}>✓</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 14px', marginBottom: 12 }}>
            {/* Ism */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
              <PersonIcon /> {t('name_req')}
            </label>
            <input
              type="text" placeholder={t('name_ph2')}
              value={matched ? matched.name : name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!matched}
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 14, boxSizing: 'border-box',
                border: (matched || name.trim()) ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)',
                fontSize: 15, fontWeight: 600, color: matched ? '#15803d' : '#111',
                background: matched ? '#f0fdf4' : '#fff',
                fontFamily: 'inherit', outline: 'none',
              }}
            />

            {/* Telefon (ixtiyoriy, lekin chalkashlikni oldini oladi) */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#64748b', margin: '10px 0 6px' }}>
              <PhoneIcon /> {t('phone_optional')}
            </label>
            <input
              type="tel" inputMode="tel" placeholder="+998 90 123 45 67"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 14, boxSizing: 'border-box',
                border: matched ? '2px solid #16a34a' : (phone.trim() ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)'),
                fontSize: 15, fontWeight: 600, color: '#111', background: '#fff',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            {matched && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                <span>✓</span> <span>Mavjud kontakt: <b>{matched.name}</b> — shu odamga qo'shiladi</span>
              </div>
            )}
          </div>
        )}

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
          <div style={{ position: 'relative' }}>
            {/* Visual button */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 14px', background: '#fff', borderRadius: 14,
              border: dueDate ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)',
              minHeight: 50, boxSizing: 'border-box', pointerEvents: 'none',
            }}>
              <CalIcon />
              <span style={{ flex: 1, fontSize: 15, fontWeight: dueDate ? 600 : 400, color: dueDate ? '#0f172a' : '#94a3b8' }}>
                {dueDate
                  ? new Date(dueDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
                  : t('due_optional')}
              </span>
              {dueDate
                ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#e5e7eb"/>
                    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 7l2 2 2-2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
            </div>
            {/* Actual date input — transparent, covers full area */}
            <input
              type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
              style={{
                position: 'absolute', inset: 0, opacity: 0,
                width: '100%', height: '100%', cursor: 'pointer',
                WebkitAppearance: 'none', border: 'none', padding: 0, margin: 0,
              }}
            />
            {/* Clear button — above the overlay */}
            {dueDate && (
              <button
                onClick={(e) => { e.stopPropagation(); setDueDate('') }}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  zIndex: 2, border: 'none', background: 'none', cursor: 'pointer', padding: 4,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#e5e7eb"/>
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
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
          <button className="pill-btn" onClick={goBack} style={{
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
