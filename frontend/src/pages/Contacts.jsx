import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '../store'
import { initials, avatarColor, haptic } from '../utils'
import { SearchIcon, ChevronRight, ArrowUpIcon, ArrowDownIcon } from '../components/Icons'
import { useT } from '../i18n'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(Math.abs(parseFloat(v || 0))))

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M12.5 9.8c-.2-.2-.9-.6-1.3-.8-.4-.2-.7-.1-.9.1l-.5.6c-.2.2-.4.2-.6.1C8.4 9.3 7 8 6.3 7.1c-.2-.2-.1-.4.1-.6l.6-.5c.3-.2.3-.5.1-.9-.2-.4-.6-1.1-.9-1.3C5.9 3.5 5.7 3.5 5.5 3.6L4.8 4C4 4.5 3.7 5.4 4 6.4c.4 1.2 1.4 2.5 2.5 3.5 1 1 2.3 2.1 3.5 2.5 1 .4 1.9 0 2.4-.8l.4-.7c.1-.2.1-.4-.3-.6z" fill="#94a3b8"/>
  </svg>
)

const TABS = [
  { key: 'all',  labelKey: 'tab_all' },
  { key: 'gave', labelKey: 'owes_me' },
  { key: 'got',  labelKey: 'i_owe' },
]

export default function Contacts() {
  const navigate = useNavigate()
  const t = useT()
  const { contacts, loading, fetchContacts } = useContactStore()
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState('all')

  useEffect(() => { fetchContacts() }, [])

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    if (!matchSearch) return false
    const uzs = c.balance_uzs || 0
    const usd = c.balance_usd || 0
    if (tab === 'gave') return uzs > 0 || usd > 0
    if (tab === 'got')  return uzs < 0 || usd < 0
    return true
  })

  // Summalar — har valyuta alohida
  const totalGaveUZS = contacts.filter(c => (c.balance_uzs || 0) > 0).reduce((s, c) => s + c.balance_uzs, 0)
  const totalGotUZS  = contacts.filter(c => (c.balance_uzs || 0) < 0).reduce((s, c) => s + Math.abs(c.balance_uzs), 0)
  const totalGaveUSD = contacts.filter(c => (c.balance_usd || 0) > 0).reduce((s, c) => s + (c.balance_usd || 0), 0)
  const totalGotUSD  = contacts.filter(c => (c.balance_usd || 0) < 0).reduce((s, c) => s + Math.abs(c.balance_usd || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{t('contacts_title')}</div>
        </div>

        {/* Summary strip — chiroyli dual valyuta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 12px' }}>
          {[
            { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '#bbf7d0', iconBg: '#16a34a', color: '#15803d', Icon: ArrowUpIcon, label: t('owes_me'), uzs: totalGaveUZS, usd: totalGaveUSD },
            { bg: 'linear-gradient(135deg,#fff1f2,#fee2e2)', border: '#fecaca', iconBg: '#ef4444', color: '#dc2626', Icon: ArrowDownIcon, label: t('i_owe'),  uzs: totalGotUZS,  usd: totalGotUSD  },
          ].map(({ bg, border, iconBg, color, Icon, label, uzs, usd }) => {
            const hasUsd = usd > 0
            const uzsFont = n(uzs).length > 8 ? 15 : 18
            return (
              <div key={label} style={{ background: bg, borderRadius: 16, padding: '11px 12px', border: `1px solid ${border}` }}>
                {/* sarlavha + ikonka */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <Icon />
                  </div>
                  <span style={{ fontSize: 9.5, color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
                </div>
                {/* UZS — asosiy */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: uzsFont, fontWeight: 900, color, letterSpacing: -.4, whiteSpace: 'nowrap' }}>{n(uzs)}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color, opacity: .55 }}>UZS</span>
                </div>
                {/* USD — alohida chiziq bilan (faqat bo'lsa) */}
                {hasUsd && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${border}` }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color, letterSpacing: -.4, whiteSpace: 'nowrap' }}>{n(usd)}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color, opacity: .7 }}>$</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 16px 10px', padding: '9px 12px', background: '#f8fafc', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.06)' }}>
          <SearchIcon />
          <input
            placeholder={t('search_placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#111', fontFamily: 'inherit', outline: 'none', flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#e5e7eb"/>
                <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 16px 12px', gap: 6 }}>
          {TABS.map(tabItem => (
            <button key={tabItem.key} className="pill-btn" onClick={() => { haptic('light'); setTab(tabItem.key) }} style={{
              flex: tabItem.key === 'all' ? 0 : 1, padding: '7px 12px',
              borderRadius: 10, border: 'none', fontFamily: 'inherit',
              background: tab === tabItem.key ? '#0f172a' : '#f1f5f9',
              color: tab === tabItem.key ? '#fff' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{t(tabItem.labelKey)}</button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 90px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px' }}>
            <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
              <circle cx="35" cy="35" r="34" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
              <circle cx="35" cy="27" r="10" fill="#bbf7d0"/>
              <path d="M14 55c0-11.6 9.4-18 21-18s21 6.4 21 18" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {tab === 'all' ? t('no_debtors') : tab === 'gave' ? t('no_owes_me') : t('no_i_owe')}
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              {search ? t('not_found', { q: search }) : t('add_new_debt')}
            </p>
            {!search && (
              <button className="pill-btn" onClick={() => navigate('/add')} style={{
                padding: '11px 24px', borderRadius: 13, border: 'none',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 5px 16px rgba(22,163,74,.3)',
              }}>{t('add_debt_btn')}</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((contact, i) => {
            const av = avatarColor(contact.name)
            const balUZS = contact.balance_uzs || 0
            const balUSD = contact.balance_usd || 0
            const isZero = balUZS === 0 && balUSD === 0
            // Asosiy rang uchun: UZS bo'lsa u, bo'lmasa USD
            const primary = balUZS !== 0 ? balUZS : balUSD
            const isPos = primary > 0
            const borderColor = isZero ? '#e5e7eb' : isPos ? '#22c55e' : '#ef4444'
            return (
              <div
                key={contact.id}
                className="list-item"
                onClick={() => { haptic('light'); navigate(`/contacts/${contact.id}`) }}
                style={{
                  background: '#fff', borderRadius: 17, padding: '12px 13px',
                  display: 'flex', alignItems: 'center', gap: 11,
                  boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                  cursor: 'pointer',
                  animation: `fadeUp .2s ${i * 0.03}s both`,
                  borderLeft: `3px solid ${borderColor}`,
                }}>
                {/* avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: av.bg, color: av.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                  }}>{initials(contact.name)}</div>
                  {!isZero && (
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: isPos ? '#16a34a' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', color: '#fff',
                    }}>
                      {isPos ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </div>
                  )}
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {contact.phone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
                        <PhoneIcon />
                        <span style={{ fontSize: 11 }}>{contact.phone}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('no_phone')}</span>
                    )}
                  </div>
                </div>

                {/* balance — UZS va USD alohida qatorlarda */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isZero ? (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>{t('no_balance')}</span>
                  ) : (
                    <div>
                      {balUZS !== 0 && (
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -.3, color: balUZS > 0 ? '#16a34a' : '#ef4444' }}>
                            {balUZS > 0 ? '+' : '−'}{n(balUZS)}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>UZS</p>
                        </div>
                      )}
                      {balUSD !== 0 && (
                        <div style={{ marginTop: balUZS !== 0 ? 4 : 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -.3, color: balUSD > 0 ? '#16a34a' : '#ef4444' }}>
                            {balUSD > 0 ? '+' : '−'}{n(balUSD)}
                          </p>
                          <p style={{ margin: '1px 0 0', fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>$</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight />
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
