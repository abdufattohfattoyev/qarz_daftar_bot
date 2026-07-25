import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contactsAPI } from '../api'
import { initials, avatarColor, fmtDate, fmtTime, haptic, daysUntil, fmt } from '../utils'
import { ArrowUpIcon, ArrowDownIcon } from '../components/Icons'
import NoteText from '../components/NoteText'
import { useT } from '../i18n'
import { useTheme } from '../theme'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(Math.abs(parseFloat(v || 0))))

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M12.5 9.8c-.2-.2-.9-.6-1.3-.8-.4-.2-.7-.1-.9.1l-.5.6c-.2.2-.4.2-.6.1C8.4 9.3 7 8 6.3 7.1c-.2-.2-.1-.4.1-.6l.6-.5c.3-.2.3-.5.1-.9-.2-.4-.6-1.1-.9-1.3C5.9 3.5 5.7 3.5 5.5 3.6L4.8 4C4 4.5 3.7 5.4 4 6.4c.4 1.2 1.4 2.5 2.5 3.5 1 1 2.3 2.1 3.5 2.5 1 .4 1.9 0 2.4-.8l.4-.7c.1-.2.1-.4-.3-.6z" fill="rgba(255,255,255,.8)"/>
  </svg>
)

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const c = useTheme()
  const [contact, setContact] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [payPick, setPayPick] = useState(false)   // ko'p qarz bo'lsa — qaysinisini to'lash

  useEffect(() => {
    let alive = true
    Promise.all([contactsAPI.get(id), contactsAPI.debts(id)])
      .then(([cc, d]) => {
        if (!alive) return
        // Bitta qarz bo'lsa — to'g'ridan-to'g'ri qarz sahifasiga (oraliq ro'yxat keraksiz)
        if (d.data.length === 1) {
          navigate(`/debt/${d.data[0].id}`, { replace: true })
          return
        }
        setContact(cc.data)
        setDebts(d.data)
        setLoading(false)
      })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', background: c.bg, height: '100%' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )
  if (!contact) return null

  const bal = contact.balance_uzs || 0
  const isPos = bal > 0
  const isZero = bal === 0
  // To'lanmagan qarzlar — «To'lash» tugmasi shular ustida ishlaydi
  const unpaid = debts.filter((d) => d.status !== 'paid')

  const handlePay = () => {
    haptic('light')
    if (unpaid.length === 0) return
    if (unpaid.length === 1) { navigate(`/debt/${unpaid[0].id}/pay`); return }
    setPayPick(true)     // bir nechta — qaysinisini to'lashni so'raymiz
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: c.bg }}>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: isZero
          ? 'linear-gradient(145deg,#475569,#64748b)'
          : isPos
            ? 'linear-gradient(145deg,#0a4d26,#16a34a 60%,#22c55e)'
            : 'linear-gradient(145deg,#7f1d1d,#dc2626 60%,#f87171)',
        padding: '12px 16px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={() => navigate('/contacts')} className="nav-btn" style={{
            width: 32, height: 32, borderRadius: 9, border: 'none',
            background: 'rgba(255,255,255,.18)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', flex: 1 }}>{contact.name}</div>
        </div>

        {/* avatar + name + phone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'rgba(255,255,255,.22)', border: '1.5px solid rgba(255,255,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>{initials(contact.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              {contact.phone
                ? (<><PhoneIcon /><span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{contact.phone}</span></>)
                : (<span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{t('no_phone')}</span>)}
            </div>
          </div>
        </div>

        {/* balance pill */}
        <div style={{
          marginTop: 14, background: 'rgba(0,0,0,.16)', borderRadius: 16,
          padding: '12px 14px', border: '1px solid rgba(255,255,255,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
            {isZero ? t('no_balance') : isPos ? t('owes_me') : t('i_owe')}
          </span>
          {!isZero && (
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -.5 }}>
              {isPos ? '+' : '−'}{n(bal)}
              <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4, opacity: .7 }}>UZS</span>
            </span>
          )}
        </div>

        {/* USD balance, agar bo'lsa */}
        {contact.balance_usd ? (
          <div style={{ marginTop: 8, background: 'rgba(0,0,0,.16)', borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>
              {contact.balance_usd > 0 ? t('owes_me') : t('i_owe')}
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>
              {contact.balance_usd > 0 ? '+' : '−'}{n(contact.balance_usd)}
              <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4, opacity: .7 }}>USD</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* ── DEBTS LIST ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 10px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{t('contact_debts')}</span>
          <span style={{ fontSize: 11, color: c.muted, fontWeight: 600, background: c.card, padding: '3px 9px', borderRadius: 20 }}>
            {debts.length} {t('count_suffix')}
          </span>
        </div>

        {debts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill={c.card} stroke={c.borderStrong} strokeWidth="2"/>
              <rect x="24" y="30" width="32" height="24" rx="5" fill={c.card2} stroke={c.borderStrong} strokeWidth="1.5"/>
              <path d="M31 42h18M31 48h11" stroke={c.faint} strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '12px 0 16px', fontSize: 13, color: c.muted }}>{t('no_debts')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {debts.map((debt, i) => {
              const isGave = debt.debt_type === 'gave'
              const isPaid = debt.status === 'paid'
              return (
                <div key={debt.id} onClick={() => { haptic('light'); navigate(`/debt/${debt.id}`) }}
                  className="list-item" style={{
                    background: c.card, borderRadius: 16, padding: '12px 13px',
                    display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
                    boxShadow: c.shadow,
                    opacity: isPaid ? 0.7 : 1,
                    animation: `fadeUp .2s ${i * 0.03}s both`,
                    borderLeft: `3px solid ${isPaid ? c.faint : isGave ? '#22c55e' : '#ef4444'}`,
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: isGave ? c.greenSoft : c.redSoft, color: isGave ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isGave ? c.greenSoft : c.redSoft, color: isGave ? '#16a34a' : '#ef4444' }}>
                        {isGave ? t('gave_label') : t('got_label')}
                      </span>
                      {isPaid && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {t('status_paid')}
                        </span>
                      )}
                      {debt.status === 'partial' && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: c.amberSoft, color: '#f97316' }}>🟠 {t('status_partial')}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>
                      {fmtDate(debt.created_at)} · {fmtTime(debt.created_at)}
                    </div>
                    {debt.note && <NoteText text={debt.note} lines={1} size={11} color={c.text2} style={{ marginTop: 3 }} />}
                    {/* Muddat — har qarzning o'z sanasi (faqat to'lanmaganlarda) */}
                    {debt.due_date && !isPaid && (() => {
                      const d = daysUntil(debt.due_date)
                      const overdue = d !== null && d < 0
                      const today = d === 0
                      const color = overdue ? '#ef4444' : today ? '#f97316' : '#16a34a'
                      const bg = overdue ? c.redSoft : today ? c.amberSoft : c.greenSoft
                      const label = overdue ? t('days_overdue', { n: Math.abs(d) })
                        : today ? t('due_today_label')
                        : t('days_left', { n: d })
                      return (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 6 }}>
                          📅 {fmtDate(debt.due_date)} · {label}
                        </div>
                      )
                    })()}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -.3,
                      color: isPaid ? c.muted : isGave ? '#16a34a' : '#ef4444',
                      textDecoration: isPaid ? 'line-through' : 'none' }}>
                      {isGave ? '+' : '−'}{n(isPaid ? debt.amount : debt.remaining_amount)}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 9, color: c.faint, fontWeight: 600 }}>{debt.currency}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M6 4l4 4-4 4" stroke={c.faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── ACTION BAR: To'lash (chap) + Qarz (o'ng) ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10,
        display: 'flex', gap: 10, padding: '10px 16px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        background: `linear-gradient(to top, ${c.bg} 55%, transparent)`,
      }}>
        {/* To'lash — faqat to'lanmagan qarz bo'lsa */}
        {unpaid.length > 0 && (
          <button onClick={handlePay} className="pill-btn" style={{
            flex: 1, padding: '14px 10px', borderRadius: 16, border: 'none',
            background: c.card, color: '#16a34a', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: c.shadow, borderTop: `1px solid ${c.border}`,
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M3 9l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {t('pay_for')}
          </button>
        )}
        {/* Qarz — yangi qarz qo'shish */}
        <button onClick={() => { haptic('light'); navigate(`/add?contact=${contact.id}&name=${encodeURIComponent(contact.name)}`) }} className="pill-btn" style={{
          flex: 1, padding: '14px 10px', borderRadius: 16, border: 'none',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 6px 20px rgba(22,163,74,.4)',
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          {t('add_debt_for')}
        </button>
      </div>

      {/* ── To'lov uchun qarz tanlash (ko'p qarz bo'lsa) ── */}
      {payPick && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setPayPick(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: c.overlay, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="sheet-anim" style={{ background: c.sheetBg, borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, maxHeight: '75vh', overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}>
            <div style={{ width: 40, height: 4.5, borderRadius: 3, background: c.borderStrong, margin: '12px auto 14px' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: c.text, padding: '0 20px 12px' }}>{t('choose_debt_to_pay')}</div>
            {unpaid.map((d) => {
              const isGave = d.debt_type === 'gave'
              return (
                <button key={d.id} onClick={() => { haptic('light'); setPayPick(false); navigate(`/debt/${d.id}/pay`) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                    border: 'none', borderTop: `0.5px solid ${c.border}`, background: 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: isGave ? c.greenSoft : c.redSoft, color: isGave ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{fmt(d.remaining_amount, d.currency)}</div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 1 }}>{fmtDate(d.created_at)}{d.note ? ` · ${d.note.slice(0, 30)}` : ''}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={c.faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )
            })}
            <div style={{ height: 12 }} />
          </div>
        </div>
      )}
    </div>
  )
}
