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
  const { stats, loading, period: storePeriod, currency, fetchStats, exportExcel } = useStatsStore()
  const [activePeriod, setActivePeriod] = useState(storePeriod || 'month')
  const periodLabel = (v) => t(PERIODS.find(p => p.value === v)?.labelKey || 'period_month')

  useEffect(() => { fetchStats(activePeriod, currency) }, [])

  const handlePeriod = (p) => {
    haptic('light')
    setActivePeriod(p)
    fetchStats(p, currency)
  }

  const cur     = stats?.currency || 'UZS'
  const gave    = parseFloat(stats?.totals?.total_gave || 0)
  const got     = parseFloat(stats?.totals?.total_got  || 0)
  const net     = gave - got
  const iLent   = parseFloat(stats?.summary?.i_lent || 0)
  const iBorrow = parseFloat(stats?.summary?.i_borrowed || 0)
  const debtors = stats?.summary?.debtors_count || 0
  const totalCount = stats?.summary?.total_count || 0
  const received = parseFloat(stats?.payments?.received || 0)
  const paidOut  = parseFloat(stats?.payments?.paid || 0)
  const payCount = stats?.payments?.count || 0
  const chart    = stats?.chart || []
  const chartMax = Math.max(1, ...chart.map(c => (c.gave || 0) + (c.got || 0)))
  const hasData  = gave || got || iLent || iBorrow || received || paidOut

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

        {/* Period filter */}
        <div style={{ display: 'flex', gap: 7, padding: '0 14px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {PERIODS.map((p) => {
            const active = activePeriod === p.value
            return (
              <button key={p.value} className="pill-btn" onClick={() => handlePeriod(p.value)} style={{
                padding: '8px 16px', borderRadius: 99, fontSize: 13,
                fontWeight: active ? 700 : 500, flexShrink: 0, border: 'none',
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

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <div style={{ width: 30, height: 30, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ marginTop: 12, fontSize: 13, color: '#94a3b8' }}>{t('loading')}</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* HERO — period berdim/oldim */}
            <div style={{
              margin: '12px 14px 12px', borderRadius: 22,
              background: net >= 0
                ? 'linear-gradient(145deg,#0a4d26,#16a34a 60%,#22c55e)'
                : 'linear-gradient(145deg,#7f1d1d,#dc2626 60%,#f87171)',
              padding: '18px 18px 16px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
              <div style={{ position: 'absolute', right: 24, bottom: -40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
              <p style={{ margin: '0 0 6px', fontSize: 9, color: 'rgba(255,255,255,.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                {periodLabel(activePeriod)} — {t('net_balance')}
              </p>
              <p style={{ margin: '0 0 14px', fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                {net >= 0 ? '+' : '−'}{n(Math.abs(net))}
                <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6, opacity: .6 }}>{cur}</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
                <HeroCol icon={<ArrowUpIcon />} label={t('gave_upper')} value={n(gave)} cur={cur} />
                <div style={{ background: 'rgba(255,255,255,.15)' }} />
                <HeroCol icon={<ArrowDownIcon />} label={t('got_upper')} value={n(got)} cur={cur} left />
              </div>
            </div>

            {/* PAYMENTS — qabul qildim / to'ladim */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 14px 12px' }}>
              <PayCard color="#16a34a" bg="#f0fdf4" icon="↓" label={t('received_label')} value={n(received)} cur={cur} />
              <PayCard color="#ef4444" bg="#fef2f2" icon="↑" label={t('paid_out_label')} value={n(paidOut)} cur={cur} />
            </div>

            {/* OWED — menga qarzdor / men qarzdor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 14px 12px' }}>
              <InfoCard label={t('owes_me_short')} value={n(iLent)} sub={`${debtors} ${t('people_count')}`} color="#16a34a" />
              <InfoCard label={t('i_owe_short')} value={n(iBorrow)} sub={`${totalCount} ${t('count_suffix')}`} color="#ef4444" />
            </div>

            {/* CHART — kunlik harakat */}
            <div style={{ margin: '0 14px 12px', background: '#fff', borderRadius: 18, padding: '14px 14px 10px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t('chart_title')}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Legend color="#22c55e" text={t('gave_label')} />
                  <Legend color="#ef4444" text={t('got_label')} />
                </div>
              </div>

              {chart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#94a3b8' }}>{t('no_chart')}</div>
              ) : (
                <BarChart chart={chart} />
              )}
            </div>

            {/* TRANSACTIONS row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 14px 12px' }}>
              <MiniStat label={t('total_ops')} value={totalCount} sub={t('transactions')} />
              <MiniStat label={t('payment')} value={payCount} sub={t('payments_cnt')} />
            </div>

            {/* TOP DEBTORS */}
            {stats.top_debtors?.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 10px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t('top_debtors')}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{stats.top_debtors.length} {t('count_suffix')}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 14px' }}>
                  {stats.top_debtors.map((dbt, i) => {
                    const av = avatarColor(dbt.name)
                    const maxRem = Math.max(...stats.top_debtors.map(x => x.remaining))
                    const w = maxRem ? (dbt.remaining / maxRem) * 100 : 0
                    return (
                      <div key={dbt.id} onClick={() => { haptic('light'); navigate('/contacts') }} className="list-item" style={{
                        background: '#fff', borderRadius: 16, padding: '11px 13px',
                        display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                        animation: `fadeUp .2s ${i * 0.04}s both`,
                      }}>
                        <div style={{ width: 22, fontSize: 13, fontWeight: 800, color: '#cbd5e1', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {initials(dbt.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dbt.name}</div>
                          <div style={{ height: 5, borderRadius: 3, background: '#f1f5f9', marginTop: 5, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${w}%`, borderRadius: 3, background: 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width .5s' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', letterSpacing: -.3 }}>{n(dbt.remaining)}</div>
                          <div style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>{cur}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* EMPTY */}
            {!hasData && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 40px' }}>
                <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                  <circle cx="35" cy="35" r="34" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
                  <rect x="20" y="34" width="7" height="14" rx="2" fill="#86efac"/>
                  <rect x="31" y="26" width="7" height="22" rx="2" fill="#4ade80"/>
                  <rect x="42" y="30" width="7" height="18" rx="2" fill="#86efac"/>
                </svg>
                <p style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                  {t('no_data_period', { period: periodLabel(activePeriod) })}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{t('no_data_desc')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── sub-components ──
function HeroCol({ icon, label, value, cur, left }) {
  return (
    <div style={{ padding: left ? '0 0 0 14px' : '0 14px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -.3 }}>{value}</p>
      <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.45)' }}>{cur}</p>
    </div>
  )
}

function PayCard({ color, bg, icon, label, value, cur }) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: '12px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: -.4 }}>{value}</p>
      <p style={{ margin: '1px 0 0', fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{cur}</p>
    </div>
  )
}

function InfoCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '13px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 900, color, letterSpacing: -.5 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{sub}</p>
    </div>
  )
}

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '13px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
      <p style={{ margin: '0 0 8px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
      <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: -.5 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>{sub}</p>
    </div>
  )
}

function Legend({ color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{text}</span>
    </div>
  )
}

function fmtDay(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

function fmtShort(v) {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000) return Math.round(v / 1_000) + 'K'
  return Math.round(v)
}

function BarChart({ chart }) {
  const CHART_H = 150
  const Y_W = 34
  const GAP = chart.length > 20 ? 1 : chart.length > 12 ? 2 : 4

  const peak = Math.max(1, ...chart.map(c => Math.max(c.gave || 0, c.got || 0)))
  // nice round ceiling for y-axis
  const mag = Math.pow(10, Math.floor(Math.log10(peak)))
  const yMax = Math.ceil(peak / mag) * mag

  const ticks = [0.25, 0.5, 0.75, 1]

  // x-axis labels: first, ~25%, ~50%, ~75%, last — deduplicated
  const xIdxs = [...new Set([
    0,
    Math.round(chart.length * 0.25),
    Math.round(chart.length * 0.5),
    Math.round(chart.length * 0.75),
    chart.length - 1,
  ])].filter(i => i >= 0 && i < chart.length)

  return (
    <div>
      {/* Chart area */}
      <div style={{ position: 'relative', height: CHART_H }}>

        {/* Horizontal grid lines + Y labels */}
        {ticks.map(t => (
          <div key={t} style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${t * 100}%`,
            display: 'flex', alignItems: 'flex-end', gap: 6,
            pointerEvents: 'none',
          }}>
            <span style={{ width: Y_W, fontSize: 8, color: '#cbd5e1', fontWeight: 700, textAlign: 'right', flexShrink: 0, lineHeight: 1, marginBottom: 2 }}>
              {fmtShort(yMax * t)}
            </span>
            <div style={{ flex: 1, height: 1, background: t === 0 ? 'rgba(0,0,0,.1)' : 'rgba(0,0,0,.05)' }} />
          </div>
        ))}

        {/* Bars */}
        <div style={{
          position: 'absolute', bottom: 0, left: Y_W + 6, right: 0, top: 0,
          display: 'flex', alignItems: 'flex-end', gap: GAP,
        }}>
          {chart.map((pt) => {
            const gH = yMax ? ((pt.gave || 0) / yMax) * 100 : 0
            const rH = yMax ? ((pt.got  || 0) / yMax) * 100 : 0
            const barGap = chart.length > 20 ? 0 : 1
            return (
              <div key={pt.date} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', gap: barGap }}>
                {/* Gave */}
                <div style={{
                  flex: 1,
                  height: gH > 0 ? `${Math.max(gH, 3)}%` : 0,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(180deg,#4ade80 0%,#16a34a 100%)',
                  transition: 'height .5s cubic-bezier(.25,.8,.25,1)',
                }} />
                {/* Got */}
                <div style={{
                  flex: 1,
                  height: rH > 0 ? `${Math.max(rH, 3)}%` : 0,
                  borderRadius: '3px 3px 0 0',
                  background: 'linear-gradient(180deg,#f87171 0%,#dc2626 100%)',
                  transition: 'height .5s cubic-bezier(.25,.8,.25,1)',
                }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis */}
      <div style={{ position: 'relative', height: 18, marginLeft: Y_W + 6 }}>
        {xIdxs.map((idx) => {
          const pct = chart.length > 1 ? (idx / (chart.length - 1)) * 100 : 0
          return (
            <span key={idx} style={{
              position: 'absolute',
              left: `${pct}%`,
              transform: idx === 0 ? 'none' : idx === chart.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              fontSize: 9, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {fmtDay(chart[idx]?.date)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
