import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { debtsAPI } from '../api'
import { useDebtStore } from '../store'
import { haptic } from '../utils'
import { useT } from '../i18n'

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

export default function EditDebt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const { updateDebt } = useDebtStore()

  const [debt, setDebt] = useState(null)
  const [debtType, setDebtType] = useState('gave')
  const [amount, setAmount] = useState('')
  const [numStr, setNumStr] = useState('')
  const [currency, setCurrency] = useState('UZS')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmtNum = (raw) => raw ? new Intl.NumberFormat('uz-UZ').format(parseInt(raw)) : ''

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => {
      setDebt(data)
      setDebtType(data.debt_type)
      const amt = String(Math.round(parseFloat(data.amount)))
      setAmount(amt)
      setNumStr(fmtNum(amt))
      setCurrency(data.currency)
      setNote(data.note || '')
      setDueDate(data.due_date || '')
    }).catch(() => {})
  }, [id])

  const isGave = debtType === 'gave'
  const accent = isGave ? '#16a34a' : '#ef4444'
  const paid = debt ? parseFloat(debt.paid_amount || 0) : 0
  const canSubmit = parseFloat(amount) > 0

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return setError(t('err_amount'))
    if (parseFloat(amount) < paid) return setError(`${t('err_amount_lt_paid')} (${new Intl.NumberFormat('uz-UZ').format(paid)})`)

    setLoading(true); setError('')
    try {
      await updateDebt(id, {
        debt_type: debtType, amount, currency,
        note, due_date: dueDate || null,
      })
      haptic('success')
      navigate(`/debt/${id}`)
    } catch (e) {
      const d = e.response?.data
      setError(d?.detail || (d && typeof d === 'object' ? Object.values(d).flat().join(' · ') : t('err_generic')))
      haptic('error')
    } finally { setLoading(false) }
  }

  if (!debt) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>{t('loading')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>
      {/* HEADER */}
      <div style={{
        flexShrink: 0,
        background: isGave ? 'linear-gradient(135deg,#0a4d26,#16a34a)' : 'linear-gradient(135deg,#7f1d1d,#dc2626)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => navigate(`/debt/${id}`)} className="nav-btn" style={{
          width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.18)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('edit_debt')}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>{debt.contact_name}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {/* Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 14px 4px' }}>
          {[{ v: 'gave', l: t('gave_title'), green: true }, { v: 'got', l: t('got_title'), green: false }].map((it) => {
            const active = debtType === it.v
            return (
              <button key={it.v} className="pill-btn" onClick={() => { haptic('light'); setDebtType(it.v) }} style={{
                padding: '12px', borderRadius: 14, fontFamily: 'inherit', cursor: 'pointer',
                border: `2px solid ${active ? (it.green ? '#16a34a' : '#ef4444') : 'rgba(0,0,0,0.07)'}`,
                background: active ? (it.green ? '#f0fdf4' : '#fef2f2') : '#fff',
                fontSize: 13, fontWeight: 700, color: active ? (it.green ? '#16a34a' : '#ef4444') : '#374151',
              }}>{it.l}</button>
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
              fontSize: 14, fontWeight: currency === c ? 700 : 500, color: currency === c ? accent : '#94a3b8',
            }}>{c}</button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ margin: '0 14px 12px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>{t('amount_label')}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: '#fff', borderRadius: 16, border: `2px solid ${accent}`, boxSizing: 'border-box' }}>
            <span style={{ fontSize: 15, color: accent, fontWeight: 800, flexShrink: 0 }}>{currency === 'USD' ? '$' : 'UZS'}</span>
            <input type="text" inputMode="numeric" placeholder="0" value={numStr}
              onChange={(e) => { const r = e.target.value.replace(/\D/g, ''); setNumStr(fmtNum(r)); setAmount(r) }}
              style={{ flex: 1, padding: '15px 0', border: 'none', fontSize: 26, fontWeight: 800, color: '#0f172a', background: 'transparent', fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
          </div>
          {paid > 0 && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
              {t('already_paid')}: {new Intl.NumberFormat('uz-UZ').format(paid)} {currency}
            </div>
          )}
        </div>

        {/* Note */}
        <div style={{ padding: '0 14px', marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            <NoteIcon /> {t('note_optional')}
          </label>
          <input type="text" placeholder={t('note_ph')} value={note} onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '13px 14px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14, fontSize: 14, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Due date */}
        <div style={{ padding: '0 14px', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            <CalIcon /> {t('due_optional')}
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', background: '#fff', borderRadius: 14, border: dueDate ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)', minHeight: 50, boxSizing: 'border-box', pointerEvents: 'none' }}>
              <CalIcon />
              <span style={{ flex: 1, fontSize: 15, fontWeight: dueDate ? 600 : 400, color: dueDate ? '#0f172a' : '#94a3b8' }}>
                {dueDate ? new Date(dueDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' }) : t('due_optional')}
              </span>
            </div>
            <input type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0, margin: 0 }} />
            {dueDate && (
              <button onClick={(e) => { e.stopPropagation(); setDueDate('') }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 2, border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#e5e7eb"/>
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ margin: '0 14px 12px', padding: '10px 14px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13, color: '#ef4444', lineHeight: 1.4 }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, margin: '0 14px' }}>
          <button className="pill-btn" onClick={() => navigate(`/debt/${id}`)} style={{
            padding: '14px 10px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16,
            background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('cancel')}</button>
          <button className="pill-btn" onClick={handleSubmit} disabled={loading || !canSubmit} style={{
            padding: 14, border: 'none', borderRadius: 16,
            background: canSubmit ? (isGave ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f87171,#ef4444)') : '#e2e8f0',
            fontSize: 14, fontWeight: 700, color: canSubmit ? '#fff' : '#94a3b8',
            cursor: canSubmit && !loading ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>{loading ? t('saving') : t('save_changes')}</button>
        </div>
      </div>
    </div>
  )
}
