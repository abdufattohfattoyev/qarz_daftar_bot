// DebtDetail page
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { debtsAPI } from '../api'
import { fmt, fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'

export function DebtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [debt, setDebt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => { setDebt(data); setLoading(false) })
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Yuklanmoqda...</div>
  if (!debt) return null

  const isGave = debt.debt_type === 'gave'
  const av = avatarColor(debt.contact_name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 8px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#16a34a', cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>Qarz ma'lumoti</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {/* Hero */}
        <div style={{ margin: '0 16px 14px', borderRadius: 22, padding: 20, background: isGave ? 'linear-gradient(135deg,#4ade80,#16a34a)' : 'linear-gradient(135deg,#ff6b6b,#ef4444)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>
              {initials(debt.contact_name)}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{debt.contact_name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {isGave ? 'Menga berishi kerak' : 'Men beraman'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1.2, marginBottom: 6 }}>
            {fmt(debt.remaining_amount, debt.currency)}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            {fmtDate(debt.created_at)} · {debt.note || ''}
          </div>
        </div>

        {/* Progress */}
        {debt.amount > 0 && (
          <div style={{ margin: '0 16px 14px', padding: 14, background: '#fff', borderRadius: 16, border: '0.5px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888' }}>To'lov holati</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                {fmt(debt.paid_amount, debt.currency)} / {fmt(debt.amount, debt.currency)}
              </span>
            </div>
            <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: '#22c55e', width: `${debt.paid_percent}%`, transition: 'width .4s' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '0 16px 14px' }}>
          {[
            { label: '✓ To\'landi', action: () => { haptic(); navigate(`/debt/${id}/pay`) }, primary: true },
            { label: '📤 Ulashish', action: () => haptic() },
            { label: '🔔 Eslatma', action: () => haptic() },
            { label: '🗑 O\'chirish', action: () => { haptic('heavy'); navigate(-1) }, danger: true },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action} style={{
              padding: '12px 10px', borderRadius: 14, border: btn.primary ? 'none' : btn.danger ? '0.5px solid rgba(239,68,68,0.2)' : '1.5px solid rgba(0,0,0,0.08)',
              background: btn.primary ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              color: btn.primary ? '#fff' : btn.danger ? '#ef4444' : '#111',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>{btn.label}</button>
          ))}
        </div>

        {/* History */}
        <div style={{ margin: '0 16px', background: '#fff', borderRadius: 18, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '14px 16px 8px' }}>TARIX</div>
          <div style={{ padding: '0 0 8px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#111' }}>Qarz yaratildi</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDate(debt.created_at)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmt(debt.amount, debt.currency)}</div>
            </div>
            {debt.payments?.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#111' }}>To'lov {p.note || ''}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDate(p.paid_at)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmt(p.amount, debt.currency)}</div>
              </div>
            ))}
            {debt.payments?.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 13, color: '#bbb', opacity: 0.5 }}>To'lov kutilmoqda...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// PayDebt page
export function PayDebt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [debt, setDebt] = useState(null)
  const [payType, setPayType] = useState('full')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => setDebt(data))
  }, [id])

  const handlePay = async () => {
    setLoading(true)
    try {
      const payAmount = payType === 'full' ? debt.remaining_amount : amount
      await debtsAPI.pay(id, { amount: payAmount, note })
      haptic('success')
      navigate(-1)
    } catch (e) {
      haptic('error')
    } finally {
      setLoading(false)
    }
  }

  if (!debt) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Yuklanmoqda...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 8px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#16a34a', cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>To'lov</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <div style={{ margin: '0 16px 14px', background: '#fff', borderRadius: 20, padding: 20, textAlign: 'center', border: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>KIM UCHUN</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 14 }}>{debt.contact_name}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Qolgan qarz</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', letterSpacing: -1 }}>{fmt(debt.remaining_amount, debt.currency)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F5F6F8', borderRadius: 14, padding: 3, gap: 3, margin: '0 16px 14px' }}>
          {[{ value: 'full', label: "To'liq to'lov" }, { value: 'partial', label: 'Qisman' }].map((t) => (
            <button key={t.value} onClick={() => setPayType(t.value)} style={{
              padding: 10, border: payType === t.value ? '1.5px solid rgba(0,0,0,0.08)' : 'none',
              borderRadius: 12, background: payType === t.value ? '#fff' : 'transparent',
              fontSize: 13, fontWeight: payType === t.value ? 700 : 500,
              color: payType === t.value ? '#111' : '#999', cursor: 'pointer', fontFamily: 'inherit'
            }}>{t.label}</button>
          ))}
        </div>

        {payType === 'partial' && (
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>💰 To'lov miqdori</div>
            <input type="number" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #16a34a', borderRadius: 16, fontSize: 22, fontWeight: 700, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
          </div>
        )}

        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>📅 Sana</div>
          <input type="date" style={{ width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, fontSize: 15, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none', appearance: 'none' }} />
        </div>

        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>💬 Izoh (ixtiyoriy)</div>
          <input type="text" placeholder="To'lov usuli..." value={note} onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, fontSize: 15, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        <button onClick={handlePay} disabled={loading} style={{
          display: 'block', margin: '0 16px', width: 'calc(100% - 32px)',
          padding: 15, border: 'none', borderRadius: 16,
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit'
        }}>
          {loading ? 'Saqlanmoqda...' : "To'landi deb belgilash"}
        </button>
      </div>
    </div>
  )
}

export default DebtDetail
