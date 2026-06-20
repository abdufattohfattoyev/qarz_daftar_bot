import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatsStore } from '../store'
import { initials, avatarColor, haptic } from '../utils'
import { ArrowUpIcon, ArrowDownIcon } from '../components/Icons'
import { useT } from '../i18n'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(parseFloat(v || 0)))

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M8 10V3M5 7l3 3 3-3" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 13h12" stroke="#f97316" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

const PERIODS = [
  { value: 'today',      labelKey: 'period_today' },
  { value: '7days',      labelKey: 'period_7days' },
  { value: 'month',      labelKey: 'period_month' },
  { value: 'last_month', labelKey: 'period_last_month' },
]

export default function Stats() {
  const navigate = useNavigate()
  const t = useT()
  const periodLabel = (v) => t(PERIODS.find(p => p.value === v)?.labelKey || 'period_month')
  const { stats, loading, period: storePeriod, currency, fetchStats, exportExcel } = useStatsStore()
  const [activePeriod, setActivePeriod] = useState(storePeriod || 'month')

  useEffect(() => { fetchStats(activePeriod, currency) }, [])

  const handlePeriod = (p) => {
    haptic('light')
    setActivePeriod(p)          // immediately highlight
    fetchStats(p, currency)     // then fetch
  }

  const gave   = parseFloat(stats?.totals?.total_gave || 0)
  const got    = parseFloat(stats?.totals?.total_got  || 0)
  const net    = gave - got
  const debtors = stats?.summary?.debtors_count || 0
  const ilent   = parseFloat(stats?.summary?.i_lent || 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{t('stats_title')}</div>
          <button onClick={() => { haptic('light'); exportExcel() }} className="pill-btn" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10,
            padding: '7px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#f97316',
          }}>
            <ExportIcon /> {t('export')}
          </button>
        </div>

        {/* Period tabs */}
        <div style={{ display: 'flex', gap: 7, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {PERIODS.map((p) => {
            const active = activePeriod === p.value
            return (
              <button key={p.value} className="pill-btn" onClick={() => handlePeriod(p.value)} style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 13,
                fontWeight: active ? 700 : 500, flexShrink: 0,
                border: 'none',
                background: active ? '#0f172a' : '#f1f5f9',
                color: active ? '#fff' : '#64748b',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? '0 3px 10px rgba(15,23,42,.25)' : 'none',
                transition: 'all .18s',
              }}>{t(p.labelKey)}</button>
            )
          })}
        </div>
      </div>

      {/* ── SCROLL BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <div style={{ width: 30, height: 30, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>{t('loading')}</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* Net balance hero */}
            <div style={{
              margin: '12px 14px 10px', borderRadius: 22,
              background: net >= 0
                ? 'linear-gradient(145deg,#0a4d26,#16a34a 60%,#22c55e)'
                : 'linear-gradient(145deg,#7f1d1d,#dc2626 60%,#f87171)',
              padding: '18px 18px 16px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
              <div style={{ position: 'absolute', right: 20, bottom: -40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

              <p style={{ margin: '0 0 6px', fontSize: 9, color: 'rgba(255,255,255,.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {periodLabel(activePeriod)} — {t('net_balance')}
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                {net >= 0 ? '+' : '−'}{n(Math.abs(net))}
                <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6, opacity: .6 }}>UZS</span>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0 }}>
                <div style={{ paddingRight: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowUpIcon />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t('gave_upper')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{n(gave)}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.4)' }}>UZS</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,.15)' }} />
                <div style={{ paddingLeft: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowDownIcon />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{t('got_upper')}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{n(got)}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.4)' }}>UZS</p>
                </div>
              </div>
            </div>

            {/* Info cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 14px 10px' }}>
              <div style={{ background: '#fff', borderRadius: 18, padding: '14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('owes_me')}</p>
                <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 900, color: '#16a34a', letterSpacing: -.5 }}>{n(ilent)}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{debtors} {t('people_count')}</p>
              </div>
              <div style={{ background: '#fff', borderRadius: 18, padding: '14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('total_ops')}</p>
                <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -.5 }}>
                  {(stats.summary?.total_count || 0)}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{t('transactions')}</p>
              </div>
            </div>

            {/* Progress bar gave vs got */}
            {(gave + got) > 0 && (
              <div style={{ margin: '0 14px 10px', background: '#fff', borderRadius: 18, padding: '14px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{t('gave_label')}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{t('got_label')}</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: '#fee2e2', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: 'linear-gradient(90deg,#22c55e,#16a34a)',
                    width: `${Math.min(100, (gave / (gave + got)) * 100)}%`,
                    transition: 'width .5s cubic-bezier(.25,.8,.25,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>{Math.round((gave / (gave + got)) * 100)}%</span>
                  <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>{Math.round((got / (gave + got)) * 100)}%</span>
                </div>
              </div>
            )}

            {/* Top debtors */}
            {stats.top_debtors?.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t('top_debtors')}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{stats.top_debtors.length} {t('count_suffix')}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '0 14px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {stats.top_debtors.map((debtor, i) => {
                    const av = avatarColor(debtor.name)
                    return (
                      <div key={debtor.id} onClick={() => { haptic('light'); navigate('/contacts') }} className="list-item" style={{
                        background: '#fff', borderRadius: 18, padding: '14px 12px',
                        minWidth: 110, flexShrink: 0, cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                        animation: `fadeUp .2s ${i * 0.05}s both`,
                        border: '1.5px solid rgba(0,0,0,.04)',
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 13, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                          {initials(debtor.name)}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {debtor.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>{debtor.phone || '—'}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#ef4444', letterSpacing: -.3 }}>
                          {n(debtor.remaining)}
                        </div>
                        <div style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>{t('uzs_owes')}</div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Empty state */}
            {!gave && !got && !debtors && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 24px' }}>
                <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                  <circle cx="35" cy="35" r="34" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
                  <rect x="18" y="22" width="34" height="28" rx="5" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
                  <path d="M26 36h18M26 42h12" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M26 30h18" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <p style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {t('no_data_period', { period: periodLabel(activePeriod) })}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  {t('no_data_desc')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
