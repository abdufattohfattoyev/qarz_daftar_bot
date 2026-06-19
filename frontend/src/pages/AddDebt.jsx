import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useContactStore } from '../store'
import { haptic } from '../utils'

export default function AddDebt() {
  const navigate = useNavigate()
  const { addDebt } = useDebtStore()
  const { contacts, fetchContacts } = useContactStore()

  const [form, setForm] = useState({
    contact: '', debt_type: 'gave', amount: '',
    currency: 'UZS', note: '', due_date: '', photo: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchContacts() }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.contact) return setError('Kontakt tanlang')
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Miqdor kiriting')

    setLoading(true)
    setError('')
    try {
      await addDebt(form)
      haptic('success')
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail || 'Xato yuz berdi')
      haptic('error')
    } finally {
      setLoading(false)
    }
  }

  const isGave = form.debt_type === 'gave'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Yangi tranzaksiya</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>Qarz</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {/* Type cards */}
        <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Qarz turi
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 8px' }}>
          {[
            { value: 'gave', icon: '↗', title: 'Men berdim', desc: 'U menga qaytarishi kerak' },
            { value: 'got', icon: '↙', title: 'Mendan oldi', desc: 'Men qaytarishim kerak' },
          ].map((t) => {
            const active = form.debt_type === t.value
            const green = t.value === 'gave'
            return (
              <button key={t.value} onClick={() => set('debt_type', t.value)} style={{
                border: `2px solid ${active ? (green ? '#16a34a' : '#ef4444') : 'rgba(0,0,0,0.08)'}`,
                borderRadius: 20, padding: '16px 14px',
                background: active ? (green ? '#f0fdf4' : '#fef2f2') : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: green ? '#dcfce7' : '#fee2e2',
                  color: green ? '#16a34a' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
                }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: active ? (green ? '#16a34a' : '#ef4444') : '#111' }}>{t.title}</div>
                <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.4 }}>{t.desc}</div>
                {active && (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: green ? '#16a34a' : '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, alignSelf: 'flex-end' }}>✓</div>
                )}
              </button>
            )
          })}
        </div>

        {/* Hint */}
        <div style={{
          margin: '0 16px 12px', padding: '12px 14px', borderRadius: 14, fontSize: 12, lineHeight: 1.5,
          background: isGave ? '#f0fdf4' : '#fef2f2', color: isGave ? '#16a34a' : '#ef4444',
          display: 'flex', alignItems: 'flex-start', gap: 8
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ</span>
          {isGave
            ? 'Siz berdingiz — u sizga qaytarishi kerak. Balansda + ko\'rinadi.'
            : 'Siz oldingiz — siz qaytarishingiz kerak. Balansda − ko\'rinadi.'
          }
        </div>

        {/* Currency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F5F6F8', borderRadius: 14, padding: 3, gap: 3, margin: '0 16px 12px' }}>
          {['UZS', 'USD'].map((c) => (
            <button key={c} onClick={() => set('currency', c)} style={{
              padding: 10, border: form.currency === c ? '1.5px solid rgba(22,163,74,0.2)' : 'none',
              borderRadius: 12, background: form.currency === c ? '#fff' : 'transparent',
              fontSize: 14, fontWeight: form.currency === c ? 700 : 500,
              color: form.currency === c ? '#16a34a' : '#999', cursor: 'pointer', fontFamily: 'inherit'
            }}>{c}</button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ margin: '0 16px 12px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -8, left: 12, fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#F5F6F8', padding: '0 6px', zIndex: 1 }}>
            Summa
          </div>
          <input
            type="number" inputMode="numeric" placeholder="0"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            style={{
              width: '100%', padding: '16px 14px', border: '2px solid #16a34a',
              borderRadius: 16, fontSize: 24, fontWeight: 700, color: '#111',
              background: '#fff', fontFamily: 'inherit', outline: 'none', letterSpacing: -0.5
            }}
          />
        </div>

        {/* Contact */}
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>👤 Kim bilan</div>
          <select
            value={form.contact}
            onChange={(e) => set('contact', e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: 16, fontSize: 15, color: form.contact ? '#111' : '#bbb',
              background: '#fff', fontFamily: 'inherit', outline: 'none', appearance: 'none'
            }}>
            <option value="">Kontakt tanlang...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>💬 Izoh (ixtiyoriy)</div>
          <input
            type="text" placeholder="Osh uchun, taksi..."
            value={form.note} onChange={(e) => set('note', e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: 16, fontSize: 15, color: '#111', background: '#fff',
              fontFamily: 'inherit', outline: 'none'
            }}
          />
        </div>

        {/* Due date */}
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>📅 Qaytarish sanasi (ixtiyoriy)</div>
          <input
            type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: 16, fontSize: 15, color: '#111', background: '#fff',
              fontFamily: 'inherit', outline: 'none', appearance: 'none'
            }}
          />
        </div>

        {/* Photo */}
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: 'calc(100% - 32px)', margin: '0 16px 12px', padding: 14,
          background: '#F5F6F8', borderRadius: 16, border: '1.5px dashed rgba(0,0,0,0.12)',
          fontSize: 14, fontWeight: 600, color: '#16a34a', cursor: 'pointer'
        }}>
          📸 + Foto qo'shish ({form.photo ? '1' : '0'}/10)
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => set('photo', e.target.files[0])} />
        </label>

        {error && (
          <div style={{ margin: '0 16px 10px', padding: '10px 14px', background: '#fef2f2', borderRadius: 12, fontSize: 13, color: '#ef4444' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px' }}>
          <button onClick={() => navigate('/')} style={{
            padding: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16,
            background: '#fff', fontSize: 14, fontWeight: 600, color: '#111', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            Bekor qilish
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: 14, border: 'none', borderRadius: 16,
            background: isGave ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#f87171,#ef4444)',
            fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
