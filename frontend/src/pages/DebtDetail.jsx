// DebtDetail page
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { debtsAPI, authAPI } from '../api'
import { useDebtStore, useAuthStore } from '../store'
import { fmt, fmtDate, fmtDateTime, nowTashkent, initials, avatarColor, haptic } from '../utils'
import PhoneVerify from '../components/PhoneVerify'
import ContactAdminModal from '../components/ContactAdminModal'
import { useT, getLang } from '../i18n'

// app-meta bir marta olinadi (bot username backend'da ham keshlangan)
let _appMeta = null
const getAppMeta = async () => {
  if (_appMeta) return _appMeta
  try { _appMeta = (await authAPI.appMeta()).data } catch { _appMeta = {} }
  return _appMeta
}

export function DebtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const { user } = useAuthStore()
  const { deleteDebt } = useDebtStore()
  const [debt, setDebt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [smsState, setSmsState] = useState({ status: 'idle', msg: '' }) // idle|sending|sent|error
  const [showContactAdmin, setShowContactAdmin] = useState(false)
  const [showVerify, setShowVerify] = useState(false)

  useEffect(() => {
    debtsAPI.get(id).then(({ data }) => { setDebt(data); setLoading(false) })
  }, [id])

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await deleteDebt(id)
      haptic('success')
      navigate('/')
    } catch {
      haptic('error')
      setDeleting(false)
    }
  }

  // Qarz kartochkasini Telegram orqali ulashish — qarzdor havola bosса botga tushadi
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

  // Qarzdorga SMS eslatma (TextUP) — pullik, shuning uchun faqat tugma bosilganda
  const doSendSms = async () => {
    if (smsState.status === 'sending' || smsState.status === 'sent') return
    haptic('light')
    setSmsState({ status: 'sending', msg: '' })
    try {
      await debtsAPI.sendSms(id)
      haptic('success')
      setSmsState({ status: 'sent', msg: '' })
    } catch (e) {
      haptic('error')
      const d = e.response?.data
      if (d?.contact_admin) { setShowContactAdmin(true); setSmsState({ status: 'idle', msg: '' }); return }
      if (d?.need_verify) { setShowVerify(true); setSmsState({ status: 'idle', msg: '' }); return }
      setSmsState({ status: 'error', msg: d?.error || t('sms_err') })
    }
  }

  const sendSms = () => {
    if (!user?.can_send_sms) { haptic('medium'); setShowContactAdmin(true); return }
    if (!user?.phone_verified) { haptic('light'); setShowVerify(true); return }
    doSendSms()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>{t('loading')}</div>
  if (!debt) return null

  const isGave = debt.debt_type === 'gave'
  const av = avatarColor(debt.contact_name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 8px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#16a34a', cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111', flex: 1 }}>{t('debt_info')}</div>
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
        <div style={{ margin: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* To'lash — asosiy amal */}
          {debt.status !== 'paid' && (
            <button onClick={() => { haptic(); navigate(`/debt/${id}/pay`) }} style={{
              width: '100%', padding: '15px 10px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 14px rgba(22,163,74,.3)',
            }}>
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t('pay_btn')}
            </button>
          )}
          {/* Ulashish — qarzdorga eslatma (viral: havola botga olib keladi) */}
          {debt.status !== 'paid' && (
            <button onClick={shareDebt} className="pill-btn" style={{
              width: '100%', padding: '13px 10px', borderRadius: 14,
              border: '1.5px solid #bfdbfe', background: '#eff6ff', color: '#2563eb',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M13 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM13 16.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.2 7.9l3.6-1.8M7.2 10.1l3.6 1.8" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t(isGave ? 'share_remind_btn' : 'share_card_btn')}
            </button>
          )}
          {/* SMS eslatma — rejim 'off' bo'lmasa ko'rinadi; ruxsat/tasdiq bosilganda tekshiriladi */}
          {debt.status !== 'paid' && isGave && user?.sms_mode !== 'off' && (
            <>
              <button onClick={sendSms} className="pill-btn" disabled={smsState.status === 'sending'} style={{
                width: '100%', padding: '13px 10px', borderRadius: 14,
                border: '1.5px solid #fde68a',
                background: smsState.status === 'sent' ? '#f0fdf4' : '#fffbeb',
                color: smsState.status === 'sent' ? '#16a34a' : '#b45309',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: smsState.status === 'sending' ? 0.7 : 1,
              }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M2.5 4.5h13v9h-13z M2.5 5l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
                {smsState.status === 'sending' ? t('sms_sending')
                  : smsState.status === 'sent' ? t('sms_sent')
                  : t('sms_remind_btn')}
              </button>
              {smsState.status === 'error' && (
                <div style={{ padding: '9px 14px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontSize: 12.5, color: '#ef4444', lineHeight: 1.4 }}>
                  {smsState.msg}
                </div>
              )}
            </>
          )}
          {/* Yana qarz + Tahrirlash + O'chirish */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <ActionBtn
              onClick={() => { haptic('light'); navigate(`/add?contact=${debt.contact}&name=${encodeURIComponent(debt.contact_name)}`) }}
              color="#16a34a" bg="#f0fdf4" border="#bbf7d0"
              icon={<path d="M9 4v10M4 9h10" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>}
              label={t('add_short')}
            />
            <ActionBtn
              onClick={() => { haptic('light'); navigate(`/debt/${id}/edit`) }}
              color="#2563eb" bg="#eff6ff" border="#bfdbfe"
              icon={<path d="M12 3l3 3-8 8-3.5.5L5 11l7-8z" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
              label={t('edit_btn')}
            />
            <ActionBtn
              onClick={() => { haptic('medium'); setConfirmDel(true) }}
              color="#ef4444" bg="#fef2f2" border="#fecaca"
              icon={<path d="M4 5h10M7.5 5V3.5h3V5M5.5 5l.5 9h6l.5-9" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
              label={t('delete_btn')}
            />
          </div>
        </div>

        {/* History */}
        <div style={{ margin: '0 16px', background: '#fff', borderRadius: 18, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '14px 16px 8px' }}>{t('history')}</div>
          <div style={{ padding: '0 0 8px', borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#111' }}>{t('debt_created')}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDateTime(debt.created_at)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmt(debt.amount, debt.currency)}</div>
            </div>
            {debt.payments?.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#111' }}>{t('payment')} {p.note || ''}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtDateTime(p.paid_at)}</div>
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

      {/* Delete confirm */}
      {confirmDel && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setConfirmDel(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet-anim" style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', padding: '20px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>🗑</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>{t('delete_debt_q')}</div>
            <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>{t('delete_debt_desc')}</div>
            <button onClick={() => setConfirmDel(false)} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: '#f3f4f6', color: '#111', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>{t('cancel_full')}</button>
            <button onClick={handleDelete} disabled={deleting} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              {deleting ? t('deleting') : t('yes_delete')}
            </button>
          </div>
        </div>
      )}

      {/* SMS: ruxsat yo'q → adminga murojaat */}
      {showContactAdmin && <ContactAdminModal onClose={() => setShowContactAdmin(false)} />}
      {/* SMS: telefon tasdiqlanmagan → to'g'ridan-to'g'ri tasdiqlash (X close bilan) */}
      {showVerify && (
        <PhoneVerify
          initialPhone={user?.phone || ''}
          onClose={() => setShowVerify(false)}
          onVerified={(u) => { useAuthStore.getState().setVerified(u); setShowVerify(false); doSendSms() }}
        />
      )}
    </div>
  )
}

function ActionBtn({ onClick, color, bg, border, icon, label }) {
  return (
    <button onClick={onClick} className="pill-btn" style={{
      padding: '11px 4px', borderRadius: 14, border: `1.5px solid ${border}`,
      background: bg, cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">{icon}</svg>
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
    </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 16, background: '#f8fafc' }}>
            <span style={{ fontSize: 15, color: '#111', fontWeight: 600 }}>{nowTashkent(getLang())}</span>
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginLeft: 'auto' }}>{t('auto_now')}</span>
          </div>
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
