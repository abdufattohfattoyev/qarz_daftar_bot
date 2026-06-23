import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useAuthStore } from '../store'
import { fmtDate, fmtTime, initials, avatarColor, haptic, daysUntil } from '../utils'
import { ArrowUpIcon, ArrowDownIcon, ChevronRight } from '../components/Icons'
import { useT, localeCode } from '../i18n'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(parseFloat(v || 0)))

export default function Home() {
  const navigate = useNavigate()
  const t = useT()
  const { user } = useAuthStore()
  const { debts, loading, fetchDebts, groupedByDate } = useDebtStore()
  const [search, setSearch] = useState('')
  const [homeCurrency, setHomeCurrency] = useState(() => user?.currency || 'UZS')

  useEffect(() => { fetchDebts() }, [])
  // user.currency o'zgarganda toggle ham yangilansin
  useEffect(() => { if (user?.currency) setHomeCurrency(user.currency) }, [user?.currency])

  const active = debts.filter(d => d.status !== 'paid')
  const paidCount = debts.length - active.length

  // Har valyuta uchun alohida balans
  const bal = (cur) => {
    const ca = active.filter(d => (d.currency || 'UZS') === cur)
    const gave = ca.filter(d => d.debt_type === 'gave').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
    const got  = ca.filter(d => d.debt_type === 'got').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
    return { gave, got, net: gave - got, hasAny: gave > 0 || got > 0 }
  }
  const uzsB = bal('UZS')
  const usdB = bal('USD')
  const isMultiCur = uzsB.hasAny && usdB.hasAny

  // Single-currency fallback (homeCurrency toggle faqat multi bo'lmaganda)
  const curActive = active.filter(d => (d.currency || 'UZS') === homeCurrency)
  const totalGave = curActive.filter(d => d.debt_type === 'gave').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const totalGot  = curActive.filter(d => d.debt_type === 'got').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const net = totalGave - totalGot
  // Muddat ogohlantirishlari — o'tib ketgan yoki 3 kun ichida qaytariladigan qarzlar
  const dueAlerts = active
    .filter((d) => d.due_date)
    .map((d) => ({ ...d, _days: daysUntil(d.due_date) }))
    .filter((d) => d._days !== null && d._days <= 3)
    .sort((a, b) => a._days - b._days)
  const q = search.trim().toLowerCase()
  const groups = groupedByDate()
    .map((g) => ({ ...g, debts: g.debts.filter((d) => !q || (d.contact_name || '').toLowerCase().includes(q)) }))
    .filter((g) => g.debts.length > 0)
  const firstName = (user?.display_name || user?.full_name || 'User').split(' ')[0]
  // Katta raqamlar chiqib ketmasligi uchun shrift o'lchamini moslaymiz (responsive)
  const netStr = n(Math.abs(net))
  const netFont = netStr.length > 12 ? 20 : netStr.length > 9 ? 24 : 28
  const fs = (v) => { const s = n(Math.abs(v)); return s.length > 9 ? 18 : s.length > 6 ? 21 : 24 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── STICKY HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(145deg, #0a4d26 0%, #16a34a 55%, #22c55e 100%)',
        padding: '12px 16px 14px',
      }}>
        {/* greeting row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 500, letterSpacing: '.03em' }}>
              {new Date().toLocaleDateString(localeCode(), { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 style={{ margin: '1px 0 0', fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {t('greeting', { name: firstName })} 👋
            </h2>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'rgba(255,255,255,.18)',
            border: '1.5px solid rgba(255,255,255,.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>
            {initials(user?.display_name || 'U')}
          </div>
        </div>

        {/* balance glass card */}
        <div style={{ background: 'rgba(0,0,0,.15)', borderRadius: 18, padding: '12px 14px', border: '1px solid rgba(255,255,255,.12)' }}>

          {isMultiCur ? (
            /* ── DUAL CURRENCY: ikki valyuta bir vaqtda ── */
            <>
              {/* Net balanslar yonma-yon */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 10 }}>
                {[
                  { cur: 'UZS', b: uzsB, label: 'UZS' },
                  { cur: 'USD', b: usdB, label: '$' },
                ].map(({ cur, b, label }, i) => {
                  const ns = n(Math.abs(b.net))
                  const nf = ns.length > 9 ? 18 : ns.length > 6 ? 22 : 26
                  return (
                    <React.Fragment key={cur}>
                      {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,.15)', margin: '0 12px' }} />}
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 8, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                          {t('net_balance')} · {label}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: nf, fontWeight: 900, color: b.net >= 0 ? '#86efac' : '#fca5a5', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
                          {b.net >= 0 ? '+' : '−'}{ns}
                          <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 3, opacity: .7 }}>{label}</span>
                        </p>
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Berganim / Olganim: 2 ustun, har birida UZS + USD satri */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: t('given'), Icon: ArrowUpIcon,   uzs: uzsB.gave, usd: usdB.gave },
                  { label: t('taken'), Icon: ArrowDownIcon, uzs: uzsB.got,  usd: usdB.got  },
                ].map(({ label, Icon, uzs, usd }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '8px 10px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <Icon />
                      </div>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', fontWeight: 700 }}>{label}</span>
                    </div>
                    {/* UZS qatori */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <p style={{ margin: 0, fontSize: fs(uzs), fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n(uzs)}</p>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>UZS</span>
                    </div>
                    {/* USD qatori */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3, paddingTop: 3, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                      <p style={{ margin: 0, fontSize: fs(usd), fontWeight: 800, color: 'rgba(255,255,255,.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n(usd)}</p>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>$</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* ── SINGLE CURRENCY: oddiy holat ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                  {t('net_balance')}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: netFont, fontWeight: 900, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {net >= 0 ? '+' : '−'}{netStr}
                  <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 4, opacity: .65 }}>{homeCurrency === 'USD' ? '$' : 'UZS'}</span>
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: t('given'), val: totalGave, Icon: ArrowUpIcon },
                  { label: t('taken'), val: totalGot,  Icon: ArrowDownIcon },
                ].map(({ label, val, Icon }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '8px 10px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <Icon />
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: n(val).length > 9 ? 13 : 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n(val)}</p>
                    <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.45)' }}>{homeCurrency === 'USD' ? '$' : 'UZS'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* ⏰ MUDDAT OGOHLANTIRISHLARI */}
        {dueAlerts.length > 0 && !q && (
          <div style={{ padding: '12px 0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>⏰ {t('due_title')}</span>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, background: '#ef4444', padding: '1px 7px', borderRadius: 20 }}>{dueAlerts.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
              {dueAlerts.map((d) => {
                const overdue = d._days < 0
                const today = d._days === 0
                const isGave = d.debt_type === 'gave'
                const av = avatarColor(d.contact_name)
                const color = overdue ? '#ef4444' : today ? '#f97316' : '#16a34a'
                const bg = overdue ? '#fef2f2' : today ? '#fff7ed' : '#f0fdf4'
                const badge = overdue ? t('days_overdue', { n: Math.abs(d._days) })
                  : today ? t('due_today_label')
                  : t('days_left', { n: d._days })
                return (
                  <div key={d.id} onClick={() => { haptic('light'); navigate(`/debt/${d.id}`) }} className="list-item" style={{
                    minWidth: 156, flexShrink: 0, background: '#fff', borderRadius: 16, padding: 12,
                    border: `1.5px solid ${color}33`, boxShadow: '0 2px 8px rgba(0,0,0,.05)', cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials(d.contact_name)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.contact_name}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: isGave ? '#16a34a' : '#ef4444', letterSpacing: -.3 }}>
                      {isGave ? '+' : '−'}{n(d.remaining_amount)} <span style={{ fontSize: 9, fontWeight: 600, color: '#cbd5e1' }}>{d.currency}</span>
                    </div>
                    <div style={{ display: 'inline-block', marginTop: 7, fontSize: 10, fontWeight: 700, color, background: bg, padding: '3px 8px', borderRadius: 6 }}>{badge}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 6px' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t('recent_ops')}</h3>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#fff', padding: '3px 9px', borderRadius: 20 }}>
            {active.length} {t('count_suffix')}{paidCount > 0 ? ` · ${paidCount} ✓` : ''}
          </span>
        </div>

        {/* Qidiruv — faqat qarzlar bo'lsa */}
        {debts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '4px 16px 8px', padding: '9px 12px', background: '#fff', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.06)' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#94a3b8" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              placeholder={t('search_placeholder')}
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#111', fontFamily: 'inherit', outline: 'none', flex: 1, minWidth: 0 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="#e5e7eb"/>
                  <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: 30, height: 30, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {!loading && groups.length === 0 && q && (
          <div style={{ textAlign: 'center', padding: '40px 24px', fontSize: 13, color: '#94a3b8' }}>
            {t('not_found', { q: search })}
          </div>
        )}

        {!loading && groups.length === 0 && !q && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
              <rect x="22" y="28" width="36" height="28" rx="5" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
              <path d="M30 42h20M30 49h12" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="58" cy="58" r="12" fill="#16a34a"/>
              <path d="M54 58h8M58 54v8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{t('no_debts')}</p>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{t('add_first_debt')}</p>
            <button onClick={() => navigate('/add')} className="pill-btn" style={{
              padding: '11px 26px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 5px 16px rgba(22,163,74,.35)',
            }}>{t('add_debt_btn')}</button>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 16px 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{fmtDate(group.date)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, display: 'flex', gap: 6 }}>
                {Object.entries(group.totals || {}).map(([cur, tot]) => (
                  <span key={cur} style={{ color: tot >= 0 ? '#16a34a' : '#ef4444' }}>
                    {tot >= 0 ? '+' : ''}{n(tot)} {cur === 'USD' ? '$' : 'UZS'}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ margin: '0 12px', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
              {group.debts.map((debt, idx) => {
                const isGave = debt.debt_type === 'gave'
                const isPaid = debt.status === 'paid'
                const av = avatarColor(debt.contact_name)
                return (
                  <div key={debt.id} onClick={() => { haptic('light'); navigate(`/debt/${debt.id}`) }} className="list-item" style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                    borderBottom: idx < group.debts.length - 1 ? '1px solid #f8fafc' : 'none',
                    background: isPaid ? '#fafafa' : 'transparent',
                  }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 13, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                        {initials(debt.contact_name)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%',
                        background: isPaid ? '#94a3b8' : isGave ? '#16a34a' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff', color: '#fff',
                      }}>
                        {isPaid
                          ? <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {debt.contact_name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        {isPaid ? (
                          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: '#16a34a', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            {t('status_paid')}
                          </span>
                        ) : (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: isGave ? '#f0fdf4' : '#fff1f2', color: isGave ? '#16a34a' : '#ef4444' }}>
                            {isGave ? t('gave_label') : t('got_label')}
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>{fmtTime(debt.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -.3,
                        color: isPaid ? '#94a3b8' : isGave ? '#16a34a' : '#ef4444',
                        textDecoration: isPaid ? 'line-through' : 'none' }}>
                        {isGave ? '+' : '−'}{n(isPaid ? debt.amount : debt.remaining_amount)}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: 9, color: '#cbd5e1' }}>{debt.currency}</p>
                    </div>
                    <ChevronRight />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
