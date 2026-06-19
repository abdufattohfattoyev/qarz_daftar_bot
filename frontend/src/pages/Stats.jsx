// Stats page
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatsStore } from '../store'
import { fmt, initials, avatarColor, haptic } from '../utils'

export default function Stats() {
  const navigate = useNavigate()
  const { stats, loading, period, currency, fetchStats, exportExcel } = useStatsStore()

  useEffect(() => { fetchStats(period, currency) }, [])

  const PERIODS = [
    { value: 'today', label: 'Bugun' },
    { value: '7days', label: '7 kun' },
    { value: 'month', label: 'Shu oy' },
    { value: 'last_month', label: "O'tgan oy" },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Statistika</div>
        <button onClick={exportExcel} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10,
          padding: '7px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#f97316'
        }}>⬇ Eksport</button>
      </div>

      {/* Period filter */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', flexShrink: 0 }}>
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => fetchStats(p.value, currency)} style={{
            padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 500,
            border: `1.5px solid ${period === p.value ? '#16a34a' : 'rgba(0,0,0,0.1)'}`,
            background: period === p.value ? '#16a34a' : '#fff',
            color: period === p.value ? '#fff' : '#666',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0
          }}>{p.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Yuklanmoqda...</div>}

        {stats && (<>
          {/* Hero card */}
          <div style={{
            margin: '0 16px 12px', borderRadius: 24, padding: 20,
            background: 'linear-gradient(145deg,#FF6B35,#FF4500 50%,#E8250A)', cursor: 'pointer'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              SIZGA HOZIR QARZDORLAR <span>›</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>So'm</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.8 }}>
                  {new Intl.NumberFormat('uz-UZ').format(parseFloat(stats.summary?.i_lent || 0))}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>UZS</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 14px' }} />
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 }}>Soni</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{stats.summary?.debtors_count || 0}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>nafar</div>
              </div>
            </div>
            <svg width="100%" height="36" viewBox="0 0 280 36" preserveAspectRatio="none" style={{ display: 'block', margin: '12px 0 8px' }}>
              <polyline points="0,30 50,22 100,26 150,10 200,8 240,18 280,14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 5 }}>
              👥 {stats.summary?.debtors_count || 0} nafar qarzdor
            </div>
          </div>

          {/* Duo cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px 16px' }}>
            {[
              { bg: 'linear-gradient(145deg,#9333ea,#7c3aed)', label: 'BERILGAN', value: stats.totals?.total_gave || 0 },
              { bg: 'linear-gradient(145deg,#10b981,#059669)', label: 'QABUL QILINGAN', value: stats.totals?.total_got || 0 },
            ].map((card) => (
              <div key={card.label} style={{ borderRadius: 20, padding: 16, background: card.bg }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
                  {new Intl.NumberFormat('uz-UZ').format(parseFloat(card.value))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>UZS</div>
              </div>
            ))}
          </div>

          {/* Top debtors */}
          {stats.top_debtors?.length > 0 && (<>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 10px' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Top qarzdorlar</span>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px', overflowX: 'auto' }}>
              {stats.top_debtors.map((debtor) => {
                const av = avatarColor(debtor.name)
                return (
                  <div key={debtor.id} onClick={() => navigate(`/contacts`)} style={{
                    background: '#fff', borderRadius: 20, padding: 14,
                    minWidth: 120, flexShrink: 0, border: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer'
                  }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                      {initials(debtor.name)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{debtor.name}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8 }}>{debtor.phone}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                      {new Intl.NumberFormat('uz-UZ').format(parseFloat(debtor.remaining))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>)}
        </>)}
      </div>
    </div>
  )
}
