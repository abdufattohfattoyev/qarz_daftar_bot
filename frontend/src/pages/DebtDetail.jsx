// DebtDetail page
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { debtsAPI } from '../api'
import { fmt, fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'
import { useT } from '../i18n'

export function DebtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const [debt, setDebt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => { setDebt(data); setLoading(false) })
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>{t('loading')}</div>
  if (!debt) return null

  const isGave = debt.debt_type === 'gave'
  const av = avatarColor(debt.contact_name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 8px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#16a34a', cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{t('debt_info')}</div>
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
                {isGave ? t('must_give_me') : t('i_must_give')}
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
              <span style={{ fontSize: 12, color: '#888' }}>{t('pay_status')}</span>
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
            { label: t('paid_btn'), action: () => { haptic(); navigate(`/debt/${id}/pay`) }, primary: true },
            { label: t('share_btn'), action: () => haptic() },
            { label: t('remind_btn'), action: () => haptic() },
            { label: t('delete_act'), action: () => { haptic('heavy'); navigate(-1) }, danger: true },
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
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '14px 16px 8px' }}>{t('history')}</div>
          <div style={{ padding: '0 0 8px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#111' }}>{t('debt_created')}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDate(debt.created_at)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmt(debt.amount, debt.currency)}</div>
            </div>
            {debt.payments?.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#111' }}>{t('payment')} {p.note || ''}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDate(p.paid_at)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmt(p.amount, debt.currency)}</div>
              </div>
            ))}
            {debt.payments?.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 13, color: '#bbb', opacity: 0.5 }}>{t('awaiting_pay')}</div>
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
  const t = useT()
  const [debt, setDebt] = useState(null)
  const [payType, setPayType] = useState('full')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => setDebt(data)).catch(() => {})
  }, [id])

  const handlePay = async () => {
    const remaining = parseFloat(debt.remaining_amount || 0)
    const payAmount = payType === 'full' ? remaining : parseFloat(amount)
    if (!payAmount || payAmount <= 0) { setError(t('err_amount')); haptic('error'); return }
    if (payAmount > remaining) { setError(`${t('remaining_debt')}: ${fmt(remaining, debt.currency)}`); haptic('error'); return }

    setLoading(true); setError('')
    try {
      await debtsAPI.pay(id, { amount: payAmount, note })
      haptic('success')
      navigate('/')
    } catch (e) {
      const d = e.response?.data
      const msg = d?.error || d?.detail
        || (d && typeof d === 'object' ? Object.values(d).flat().join(' · ') : null)
        || `[${e.response?.status || 'net'}] ${t('err_generic')}`
      setError(msg)
      haptic('error')
    } finally {
      setLoading(false)
    }
  }

  if (!debt) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>{t('loading')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 8px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#16a34a', cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{t('pay_title')}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <div style={{ margin: '0 16px 14px', background: '#fff', borderRadius: 20, padding: 20, textAlign: 'center', border: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('for_whom')}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 14 }}>{debt.contact_name}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{t('remaining_debt')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', letterSpacing: -1 }}>{fmt(debt.remaining_amount, debt.currency)}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F5F6F8', borderRadius: 14, padding: 3, gap: 3, margin: '0 16px 14px' }}>
          {[{ value: 'full', label: t('full_pay') }, { value: 'partial', label: t('partial') }].map((opt) => (
            <button key={opt.value} onClick={() => setPayType(opt.value)} style={{
              padding: 10, border: payType === opt.value ? '1.5px solid rgba(0,0,0,0.08)' : 'none',
              borderRadius: 12, background: payType === opt.value ? '#fff' : 'transparent',
              fontSize: 13, fontWeight: payType === opt.value ? 700 : 500,
              color: payType === opt.value ? '#111' : '#999', cursor: 'pointer', fontFamily: 'inherit'
            }}>{opt.label}</button>
          ))}
        </div>

        {payType === 'partial' && (
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>{t('pay_amount')}</div>
            <input type="number" inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #16a34a', borderRadius: 16, fontSize: 22, fontWeight: 700, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
          </div>
        )}

        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>{t('date')}</div>
          <input type="date"
            onClick={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
            onFocus={(e) => { try { e.currentTarget.showPicker?.() } catch {} }}
            style={{ width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, fontSize: 16, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none', WebkitAppearance: 'none', minHeight: 48, boxSizing: 'border-box' }} />
        </div>

        <div style={{ padding: '0 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>{t('pay_note')}</div>
          <input type="text" placeholder={t('pay_method_ph')} value={note} onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, fontSize: 15, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        {error && (
          <div style={{ margin: '0 16px 12px', padding: '10px 14px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 13, color: '#ef4444', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        <button onClick={handlePay} disabled={loading} style={{
          display: 'block', margin: '0 16px', width: 'calc(100% - 32px)',
          padding: 15, border: 'none', borderRadius: 16,
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? t('saving') : t('mark_paid')}
        </button>
      </div>
    </div>
  )
}

export default DebtDetail
