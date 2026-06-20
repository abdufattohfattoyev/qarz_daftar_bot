import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useContactStore } from '../store'
import { haptic } from '../utils'

const InfoIcon = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
    <path d="M8 7v4M8 5v.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3" width="13" height="11.5" rx="3" stroke="#16a34a" strokeWidth="1.4"/>
    <path d="M5 1.5V4M11 1.5V4M1.5 7h13" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M6.5 3h5l1.5 2H15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.5L6 3z" stroke="#16a34a" strokeWidth="1.4"/>
    <circle cx="9" cy="9.5" r="2.5" stroke="#16a34a" strokeWidth="1.4"/>
  </svg>
)

const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5" r="3" stroke="#64748b" strokeWidth="1.4"/>
    <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const NoteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1.5" width="12" height="13" rx="2.5" stroke="#64748b" strokeWidth="1.4"/>
    <path d="M5 6h6M5 9h6M5 12h4" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

export default function AddDebt() {
  const navigate = useNavigate()
  const { addDebt } = useDebtStore()
  const { contacts, fetchContacts } = useContactStore()

  const [form, setForm] = useState({
    contact: '', debt_type: 'gave', amount: '',
    currency: 'UZS', note: '', due_date: '', photo: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [numStr, setNumStr] = useState('')

  useEffect(() => { fetchContacts() }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.contact) return setError("Kontakt tanlang")
    if (!form.amount || parseFloat(form.amount) <= 0) return setError("Miqdor kiriting")
    setLoading(true); setError('')
    try {
      await addDebt(form)
      haptic('success')
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Xato yuz berdi')
      haptic('error')
    } finally { setLoading(false) }
  }

  const isGave = form.debt_type === 'gave'
  const accent = isGave ? '#16a34a' : '#ef4444'
  const accentLight = isGave ? '#f0fdf4' : '#fef2f2'

  const fmtNum = (s) => {
    const digits = s.replace(/\D/g, '')
    return digits ? new Intl.NumberFormat('uz-UZ').format(parseInt(digits)) : ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: isGave
          ? 'linear-gradient(145deg,#0a4d26,#16a34a 60%,#22c55e)'
          : 'linear-gradient(145deg,#7f1d1d,#dc2626 60%,#f87171)',
        padding: '14px 16px 16px',
        transition: 'background .3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={() => navigate('/')} className="nav-btn" style={{
            width: 34, height: 34, borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,.18)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.4 }}>Yangi qarz</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 }}>
              {isGave ? 'Siz berdingiz' : 'Siz oldingiz'}
            </div>
          </div>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { value: 'gave', title: 'Men berdim',   desc: 'U qaytarishi kerak',  arrow: '↗' },
            { value: 'got',  title: 'Mendan oldi',  desc: 'Men qaytarishim kerak', arrow: '↙' },
          ].map((t) => {
            const active = form.debt_type === t.value
            const green  = t.value === 'gave'
            return (
              <button key={t.value} className="pill-btn" onClick={() => { haptic('light'); set('debt_type', t.value) }} style={{
                padding: '12px 12px', border: 'none', borderRadius: 16,
                background: active ? '#fff' : 'rgba(255,255,255,.15)',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 4, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9, marginBottom: 2,
                  background: active ? (green ? '#dcfce7' : '#fee2e2') : 'rgba(255,255,255,.2)',
                  color: active ? (green ? '#16a34a' : '#ef4444') : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700,
                }}>{t.arrow}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? (green ? '#16a34a' : '#ef4444') : 'rgba(255,255,255,.9)' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 10, color: active ? '#94a3b8' : 'rgba(255,255,255,.55)', lineHeight: 1.3 }}>{t.desc}</div>
                {active && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: green ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SCROLL BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Hint */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '12px 14px 10px', padding: '10px 12px', borderRadius: 13, background: accentLight }}>
          <InfoIcon color={accent} />
          <span style={{ fontSize: 12, color: accent, lineHeight: 1.5 }}>
            {isGave
              ? "Siz berdingiz — u sizga qaytarishi kerak. Balansda + ko'rinadi."
              : "Siz oldingiz — siz qaytarishingiz kerak. Balansda − ko'rinadi."}
          </span>
        </div>

        {/* Currency tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#e8eaf0', borderRadius: 14, padding: 3, gap: 3, margin: '0 14px 12px' }}>
          {['UZS', 'USD'].map((c) => {
            const active = form.currency === c
            return (
              <button key={c} className="pill-btn" onClick={() => { haptic('light'); set('currency', c) }} style={{
                padding: '10px', border: active ? `1.5px solid ${accent}20` : 'none',
                borderRadius: 12, background: active ? '#fff' : 'transparent',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? accent : '#94a3b8', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}>{c}</button>
            )
          })}
        </div>

        {/* Amount big input */}
        <div style={{ margin: '0 14px 12px' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>
            Summa
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 14px', background: '#fff', borderRadius: 16,
            border: `2px solid ${accent}`, boxSizing: 'border-box',
          }}>
            <span style={{ fontSize: 16, color: accent, fontWeight: 800 }}>{form.currency === 'USD' ? '$' : 'UZS'}</span>
            <input
              type="text" inputMode="numeric" placeholder="0"
              value={numStr}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setNumStr(fmtNum(raw))
                set('amount', raw)
              }}
              style={{
                flex: 1, padding: '16px 0', border: 'none',
                fontSize: 26, fontWeight: 800, color: '#0f172a',
                background: 'transparent', fontFamily: 'inherit', outline: 'none', letterSpacing: -0.5,
                boxSizing: 'border-box', width: '100%',
              }}
            />
          </div>
        </div>

        {/* Contact select */}
        <Field label="Kim bilan" Icon={PersonIcon}>
          <div style={{ position: 'relative' }}>
            <select
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              style={{
                width: '100%', padding: '13px 40px 13px 14px',
                border: form.contact ? `2px solid ${accent}` : '1.5px solid rgba(0,0,0,0.1)',
                borderRadius: 14, fontSize: 14, color: form.contact ? '#0f172a' : '#94a3b8',
                background: '#fff', fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer',
                boxSizing: 'border-box',
              }}>
              <option value="">Kontakt tanlang...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </Field>

        {/* Note */}
        <Field label="Izoh (ixtiyoriy)" Icon={NoteIcon}>
          <input
            type="text" placeholder="Osh uchun, taksi, qarz..."
            value={form.note} onChange={(e) => set('note', e.target.value)}
            style={{
              width: '100%', padding: '13px 14px',
              border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14,
              fontSize: 14, color: '#111', background: '#fff',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </Field>

        {/* Due date */}
        <Field label="Qaytarish sanasi (ixtiyoriy)" Icon={CalIcon}>
          <div style={{ position: 'relative' }}>
            <input
              type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
              style={{
                width: '100%', padding: '13px 14px',
                border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14,
                fontSize: 14, color: form.due_date ? '#111' : '#94a3b8', background: '#fff',
                fontFamily: 'inherit', outline: 'none', appearance: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </Field>

        {/* Photo */}
        <div style={{ padding: '0 14px', marginBottom: 14 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', background: '#fff', borderRadius: 14,
            border: photoName ? `2px solid ${accent}` : '1.5px dashed rgba(0,0,0,0.13)',
            cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CameraIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Foto qo'shish</div>
              <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {photoName || 'Chek, hujjat, rasm...'}
              </div>
            </div>
            {photoName && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#16a34a"/>
                <path d="M4.5 8l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { set('photo', e.target.files[0]); setPhotoName(e.target.files[0]?.name || '') }} />
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: '0 14px 10px', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fef2f2', borderRadius: 12 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, margin: '0 14px' }}>
          <button className="pill-btn" onClick={() => navigate('/')} style={{
            padding: '14px 10px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16,
            background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
          }}>Bekor</button>
          <button className="pill-btn" onClick={handleSubmit} disabled={loading} style={{
            padding: 14, border: 'none', borderRadius: 16,
            background: isGave
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'linear-gradient(135deg,#f87171,#ef4444)',
            fontSize: 14, fontWeight: 700, color: '#fff', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: loading ? 0.75 : 1,
            boxShadow: isGave ? '0 4px 14px rgba(22,163,74,.35)' : '0 4px 14px rgba(239,68,68,.35)',
          }}>
            {loading ? 'Saqlanmoqda...' : isGave ? '+ Saqlash (Berdim)' : '+ Saqlash (Oldim)'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, Icon, children }) {
  return (
    <div style={{ padding: '0 14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Icon />
        <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</label>
      </div>
      {children}
    </div>
  )
}
