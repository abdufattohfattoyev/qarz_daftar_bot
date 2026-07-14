// Qarz detali — pastdan chiqadigan modal (bottom sheet).
// Home ro'yxatidan ochiladi: sahifaga o'tmasdan tez ko'rish + asosiy amallar.
// To'lash/Tahrirlash kabi murakkab formalar o'z sahifalariga olib boradi.
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { debtsAPI, authAPI } from '../api'
import { useDebtStore, useAuthStore } from '../store'
import { fmt, fmtDate, fmtDateTime, initials, haptic } from '../utils'
import { useT } from '../i18n'

// app-meta bir marta olinadi (DebtDetail bilan bir xil naqsh)
let _appMeta = null
const getAppMeta = async () => {
  if (_appMeta) return _appMeta
  try { _appMeta = (await authAPI.appMeta()).data } catch { _appMeta = {} }
  return _appMeta
}

export default function DebtSheet({ debt: initial, onClose }) {
  const navigate = useNavigate()
  const t = useT()
  const { user } = useAuthStore()
  const { deleteDebt } = useDebtStore()
  const [debt, setDebt] = useState(initial)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [smsState, setSmsState] = useState({ status: 'idle', msg: '' })

  // Ro'yxatdagi obyekt bilan darhol ochamiz, fonda yangilaymiz (payments/holat eskirgan bo'lishi mumkin)
  useEffect(() => {
    setDebt(initial); setConfirmDel(false); setSmsState({ status: 'idle', msg: '' })
    if (initial?.id) debtsAPI.get(initial.id).then(({ data }) => setDebt(data)).catch(() => {})
  }, [initial?.id])

  if (!initial || !debt) return null

  const isGave = debt.debt_type === 'gave'
  const isPaid = debt.status === 'paid'

  const shareDebt = async () => {
    haptic('light')
    const meta = await getAppMeta()
    const link = meta?.bot_username
      ? `https://t.me/${meta.bot_username}?start=ref_${user?.telegram_id || ''}`
      : ''
    const text = t(isGave ? 'share_text_gave' : 'share_text_got',
      { amount: fmt(debt.remaining_amount, debt.currency) })
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    const twa = window.Telegram?.WebApp
    if (twa?.openTelegramLink) twa.openTelegramLink(shareUrl)
    else window.open(shareUrl, '_blank')
  }

  const sendSms = async () => {
    if (smsState.status === 'sending' || smsState.status === 'sent') return
    haptic('light')
    setSmsState({ status: 'sending', msg: '' })
    try {
      await debtsAPI.sendSms(debt.id)
      haptic('success')
      setSmsState({ status: 'sent', msg: '' })
    } catch (e) {
      haptic('error')
      setSmsState({ status: 'error', msg: e.response?.data?.error || t('sms_err') })
    }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteDebt(debt.id)
      haptic('success')
      onClose()
    } catch {
      haptic('error')
      setDeleting(false)
    }
  }

  const go = (path) => { onClose(); navigate(path) }

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-anim" style={{
        background: '#F0F2F5', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 520,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Grabber + yopish */}
        <div style={{ flexShrink: 0, position: 'relative', padding: '10px 0 2px' }}>
          <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#d1d5db', margin: '0 auto' }} />
          <button onClick={onClose} style={{ position: 'absolute', right: 12, top: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '10px 16px', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', scrollbarWidth: 'none' }}>
          {confirmDel ? (
            /* ── O'chirishni tasdiqlash ── */
            <div style={{ padding: '14px 2px 6px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>🗑</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>{t('delete_debt_q')}</div>
              <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>{t('delete_debt_desc')}</div>
              <button onClick={() => setConfirmDel(false)} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: '#fff', color: '#111', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>{t('cancel_full')}</button>
              <button onClick={handleDelete} disabled={deleting} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {deleting ? t('deleting') : t('yes_delete')}
              </button>
            </div>
          ) : (
            <>
              {/* ── Hero ── */}
              <div style={{ borderRadius: 20, padding: 18, marginBottom: 12, background: isGave ? 'linear-gradient(135deg,#4ade80,#16a34a)' : 'linear-gradient(135deg,#ff6b6b,#ef4444)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials(debt.contact_name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debt.contact_name}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                      {isPaid ? t('status_paid') : isGave ? t('must_give_me') : t('i_must_give')}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 'clamp(24px, 8vw, 30px)', fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 4, textDecoration: isPaid ? 'line-through' : 'none' }}>
                  {fmt(isPaid ? debt.amount : debt.remaining_amount, debt.currency)}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  {fmtDate(debt.created_at)}{debt.note ? ` · ${debt.note}` : ''}
                  {debt.due_date ? ` · ⏰ ${fmtDate(debt.due_date)}` : ''}
                </div>
              </div>

              {/* ── Progress ── */}
              {debt.amount > 0 && !isPaid && (
                <div style={{ padding: 13, background: '#fff', borderRadius: 15, border: '0.5px solid rgba(0,0,0,0.06)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 11.5, color: '#888' }}>{t('pay_status')}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111' }}>
                      {fmt(debt.paid_amount, debt.currency)} / {fmt(debt.amount, debt.currency)}
                    </span>
                  </div>
                  <div style={{ height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: '#22c55e', width: `${debt.paid_percent}%`, transition: 'width .4s' }} />
                  </div>
                </div>
              )}

              {/* ── Amallar ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {!isPaid && (
                  <button onClick={() => { haptic(); go(`/debt/${debt.id}/pay`) }} style={{
                    width: '100%', padding: '14px 10px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 4px 14px rgba(22,163,74,.3)',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t('pay_btn')}
                  </button>
                )}
                {!isPaid && (
                  <div style={{ display: 'grid', gridTemplateColumns: isGave ? '1fr 1fr' : '1fr', gap: 8 }}>
                    <button onClick={shareDebt} className="pill-btn" style={{
                      padding: '12px 8px', borderRadius: 14,
                      border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                        <path d="M13 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM13 16.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.2 7.9l3.6-1.8M7.2 10.1l3.6 1.8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {t(isGave ? 'share_remind_btn' : 'share_card_btn')}
                    </button>
                    {/* SMS eslatma — telefoni tasdiqlangan foydalanuvchilar uchun
                        (tasdiqlanmagan bo'lsa backend Sozlamalarga yo'naltiradi) */}
                    {isGave && (
                      <button onClick={sendSms} className="pill-btn" disabled={smsState.status === 'sending'} style={{
                        padding: '12px 8px', borderRadius: 14,
                        border: '1.5px solid #fde68a',
                        background: smsState.status === 'sent' ? '#f0fdf4' : '#fffbeb',
                        color: smsState.status === 'sent' ? '#16a34a' : '#b45309',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        opacity: smsState.status === 'sending' ? 0.7 : 1,
                      }}>
                        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                          <path d="M2.5 4.5h13v9h-13z M2.5 5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                        {smsState.status === 'sending' ? t('sms_sending')
                          : smsState.status === 'sent' ? t('sms_sent')
                          : t('sms_remind_btn')}
                      </button>
                    )}
                  </div>
                )}
                {smsState.status === 'error' && (
                  <div style={{ padding: '9px 14px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 12.5, color: '#ef4444', lineHeight: 1.4 }}>
                    {smsState.msg}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SheetBtn onClick={() => { haptic('light'); go(`/add?contact=${debt.contact}&name=${encodeURIComponent(debt.contact_name)}`) }}
                    color="#16a34a" bg="#f0fdf4" border="#bbf7d0" label={t('add_short')}
                    icon={<path d="M9 4v10M4 9h10" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>} />
                  <SheetBtn onClick={() => { haptic('light'); go(`/debt/${debt.id}/edit`) }}
                    color="#2563eb" bg="#eff6ff" border="#bfdbfe" label={t('edit_btn')}
                    icon={<path d="M12 3l3 3-8 8-3.5.5L5 11l7-8z" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>} />
                  <SheetBtn onClick={() => { haptic('medium'); setConfirmDel(true) }}
                    color="#ef4444" bg="#fef2f2" border="#fecaca" label={t('delete_btn')}
                    icon={<path d="M4 5h10M7.5 5V3.5h3V5M5.5 5l.5 9h6l.5-9" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>} />
                </div>
              </div>

              {/* ── Tarix ── */}
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '12px 15px 7px' }}>{t('history')}</div>
                <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', paddingBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 15px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: '#111' }}>{t('debt_created')}</div>
                      <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{fmtDateTime(debt.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>{fmt(debt.amount, debt.currency)}</div>
                  </div>
                  {debt.payments?.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 15px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('payment')} {p.note || ''}</div>
                        <div style={{ fontSize: 10.5, color: '#aaa', marginTop: 1 }}>{fmtDateTime(p.paid_at)}</div>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>{fmt(p.amount, debt.currency)}</div>
                    </div>
                  ))}
                  {(!debt.payments || debt.payments.length === 0) && (
                    <div style={{ padding: '12px 15px', fontSize: 12.5, color: '#bbb', opacity: 0.6 }}>{t('awaiting_pay')}</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SheetBtn({ onClick, color, bg, border, icon, label }) {
  return (
    <button onClick={onClick} className="pill-btn" style={{
      padding: '10px 4px', borderRadius: 14, border: `1.5px solid ${border}`,
      background: bg, cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">{icon}</svg>
      <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{label}</span>
    </button>
  )
}
