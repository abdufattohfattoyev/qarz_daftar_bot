import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contactsAPI } from '../api'
import { initials, avatarColor, fmtDate, fmtTime, haptic, daysUntil } from '../utils'
import { ArrowUpIcon, ArrowDownIcon } from '../components/Icons'
import { useT } from '../i18n'

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
  const [contact, setContact] = useState(null)
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([contactsAPI.get(id), contactsAPI.debts(id)])
      .then(([c, d]) => {
        if (!alive) return
        // Bitta qarz bo'lsa — to'g'ridan-to'g'ri qarz sahifasiga (oraliq ro'yxat keraksiz)
        if (d.data.length === 1) {
          navigate(`/debt/${d.data[0].id}`, { replace: true })
          return
        }
        setContact(c.data)
        setDebts(d.data)
        setLoading(false)
      })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 30, height: 30, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  )
  if (!contact) return null

  const bal = contact.balance_uzs || 0
  const isPos = bal > 0
  const isZero = bal === 0
  const av = avatarColor(contact.name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

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
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t('contact_debts')}</span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#fff', padding: '3px 9px', borderRadius: 20 }}>
            {debts.length} {t('count_suffix')}
          </span>
        </div>

        {debts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="#fff" stroke="#e2e8f0" strokeWidth="2"/>
              <rect x="24" y="30" width="32" height="24" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
              <path d="M31 42h18M31 48h11" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '12px 0 16px', fontSize: 13, color: '#94a3b8' }}>{t('no_debts')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {debts.map((debt, i) => {
              const isGave = debt.debt_type === 'gave'
              const isPaid = debt.status === 'paid'
              return (
                <div key={debt.id} onClick={() => { haptic('light'); navigate(`/debt/${debt.id}`) }}
                  className="list-item" style={{
                    background: '#fff', borderRadius: 16, padding: '12px 13px',
                    display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                    opacity: isPaid ? 0.7 : 1,
                    animation: `fadeUp .2s ${i * 0.03}s both`,
                    borderLeft: `3px solid ${isPaid ? '#cbd5e1' : isGave ? '#22c55e' : '#ef4444'}`,
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: isGave ? '#dcfce7' : '#fee2e2', color: isGave ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isGave ? '#f0fdf4' : '#fff1f2', color: isGave ? '#16a34a' : '#ef4444' }}>
                        {isGave ? t('gave_label') : t('got_label')}
                      </span>
                      {isPaid && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {t('status_paid')}
                        </span>
                      )}
                      {debt.status === 'partial' && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#fff7ed', color: '#f97316' }}>🟠 {t('status_partial')}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                      {fmtDate(debt.created_at)} · {fmtTime(debt.created_at)}{debt.note ? ` · ${debt.note}` : ''}
                    </div>
                    {/* Muddat — har qarzning o'z sanasi (faqat to'lanmaganlarda) */}
                    {debt.due_date && !isPaid && (() => {
                      const d = daysUntil(debt.due_date)
                      const overdue = d !== null && d < 0
                      const today = d === 0
                      const color = overdue ? '#ef4444' : today ? '#f97316' : '#16a34a'
                      const bg = overdue ? '#fef2f2' : today ? '#fff7ed' : '#f0fdf4'
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
                      color: isPaid ? '#94a3b8' : isGave ? '#16a34a' : '#ef4444',
                      textDecoration: isPaid ? 'line-through' : 'none' }}>
                      {isGave ? '+' : '−'}{n(isPaid ? debt.amount : debt.remaining_amount)}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>{debt.currency}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M6 4l4 4-4 4" stroke="#cbd5e1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── ADD DEBT FAB ── */}
      <button onClick={() => { haptic('light'); navigate(`/add?contact=${contact.id}&name=${encodeURIComponent(contact.name)}`) }} className="pill-btn" style={{
        position: 'absolute', right: 18, bottom: 80, zIndex: 10,
        padding: '13px 20px', borderRadius: 16, border: 'none',
        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(22,163,74,.4)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>{t('add_debt_for')}</button>
    </div>
  )
}

