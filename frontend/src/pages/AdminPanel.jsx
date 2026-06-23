import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../api'
import { initials, avatarColor, haptic } from '../utils'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(Math.abs(parseFloat(v || 0))))

const TABS = [
  { key: 'stats', label: '📊 Statistika' },
  { key: 'users', label: '👥 Foydalanuvchilar' },
  { key: 'send',  label: '📢 Xabar' },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto', background: '#F0F2F5', scrollbarWidth: 'none' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(150deg,#0f172a,#1e293b)', padding: '14px 16px 12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} className="nav-btn" style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M10 13L5 8l5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>🛡 Admin panel</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)' }}>Boshqaruv markazi</div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {TABS.map((tb) => (
            <button key={tb.key} onClick={() => { haptic('light'); setTab(tb.key) }} className="pill-btn" style={{
              flex: 1, padding: '7px 6px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
              background: tab === tb.key ? '#fff' : 'rgba(255,255,255,.12)',
              color: tab === tb.key ? '#0f172a' : 'rgba(255,255,255,.7)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{tb.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 14px 90px' }}>
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab navigate={navigate} />}
        {tab === 'send'  && <SendTab />}
      </div>
    </div>
  )
}

// ── STATISTIKA ──
function StatsTab() {
  const [d, setD] = useState(null)
  useEffect(() => { adminAPI.overview().then((r) => setD(r.data)).catch(() => setD(false)) }, [])
  if (d === null) return <Spinner />
  if (d === false) return <Empty text="Statistika yuklanmadi" />

  const maxC = Math.max(1, ...d.daily.map((x) => x.count))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Metric label="Foydalanuvchilar" value={d.users.total} sub={`+${d.users.new_week} (7 kun)`} color="#16a34a" />
        <Metric label="Jami qarzlar" value={d.debts.total} sub={`${d.debts.active} faol`} color="#3b82f6" />
        <Metric label="Faol qarzdorlar" value={d.users.with_debts} sub="kishi" color="#8b5cf6" />
        <Metric label="To'langan" value={d.debts.paid} sub={`+${d.debts.new_week} yangi`} color="#f59e0b" />
      </div>

      {/* Platforma balansi */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>Umumiy aylanma</div>
        <Row label="↗ Berilgan (UZS)" value={n(d.balances.gave_uzs)} cur="UZS" color="#16a34a" />
        <Row label="↙ Olingan (UZS)"  value={n(d.balances.got_uzs)}  cur="UZS" color="#ef4444" />
        {(d.balances.gave_usd > 0 || d.balances.got_usd > 0) && <>
          <Row label="↗ Berilgan (USD)" value={n(d.balances.gave_usd)} cur="$" color="#16a34a" />
          <Row label="↙ Olingan (USD)"  value={n(d.balances.got_usd)}  cur="$" color="#ef4444" />
        </>}
      </div>

      {/* 7 kunlik faollik */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>So'nggi 7 kun faollik</div>
        {d.daily.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Ma'lumot yo'q</div> : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
            {d.daily.map((x) => (
              <div key={x.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#16a34a' }}>{x.count}</div>
                <div style={{ width: '100%', height: `${(x.count / maxC) * 64}px`, minHeight: 3, background: 'linear-gradient(180deg,#22c55e,#16a34a)', borderRadius: 4 }} />
                <div style={{ fontSize: 8, color: '#94a3b8' }}>{x.date.slice(8, 10)}.{x.date.slice(5, 7)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── FOYDALANUVCHILAR ──
function UsersTab({ navigate }) {
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)   // {user, debts}

  const load = (query) => { setData(null); adminAPI.users(query).then((r) => setData(r.data)).catch(() => setData(false)) }
  useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t) }, [q])

  const openUser = async (u) => {
    haptic('light')
    try { const { data } = await adminAPI.userDebts(u.id); setSel({ u, debts: data.debts }) }
    catch { setSel({ u, debts: [] }) }
  }

  if (sel) return <UserDebts sel={sel} onBack={() => setSel(null)} />

  return (
    <div>
      <input placeholder="🔍 Ism, username yoki telefon..." value={q} onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.08)', fontSize: 13, marginBottom: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
      {data === null ? <Spinner /> : data === false ? <Empty text="Yuklanmadi" /> : (
        <>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600 }}>Jami: {data.count} foydalanuvchi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.users.map((u) => {
              const av = avatarColor(u.name)
              return (
                <div key={u.id} onClick={() => openUser(u)} className="list-item" style={{ background: '#fff', borderRadius: 14, padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials(u.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.username ? `@${u.username}` : u.phone || `ID ${u.telegram_id}`} · {u.debts} qarz</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {u.net_uzs !== 0 && <div style={{ fontSize: 13, fontWeight: 800, color: u.net_uzs > 0 ? '#16a34a' : '#ef4444' }}>{u.net_uzs > 0 ? '+' : '−'}{n(u.net_uzs)} <span style={{ fontSize: 8, color: '#cbd5e1' }}>UZS</span></div>}
                    {u.net_usd !== 0 && <div style={{ fontSize: 12, fontWeight: 800, color: u.net_usd > 0 ? '#16a34a' : '#ef4444' }}>{u.net_usd > 0 ? '+' : '−'}{n(u.net_usd)} <span style={{ fontSize: 8, color: '#cbd5e1' }}>$</span></div>}
                    {u.net_uzs === 0 && u.net_usd === 0 && <div style={{ fontSize: 10, color: '#cbd5e1' }}>—</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function UserDebts({ sel, onBack }) {
  return (
    <div>
      <button onClick={onBack} className="pill-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: 'none', background: '#fff', fontSize: 12, fontWeight: 700, color: '#0f172a', cursor: 'pointer', marginBottom: 12, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
        ← Orqaga
      </button>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>{sel.u.name}</div>
      {sel.debts.length === 0 ? <Empty text="Qarzlar yo'q" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sel.debts.map((d) => {
            const isGave = d.type === 'gave'
            const isPaid = d.status === 'paid'
            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${isPaid ? '#cbd5e1' : isGave ? '#22c55e' : '#ef4444'}`, opacity: isPaid ? 0.65 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.contact}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{isGave ? 'Berdi' : 'Oldi'} · {d.created}{d.note ? ` · ${d.note}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPaid ? '#94a3b8' : isGave ? '#16a34a' : '#ef4444', textDecoration: isPaid ? 'line-through' : 'none' }}>
                    {isGave ? '+' : '−'}{n(isPaid ? d.amount : d.remaining)}
                  </div>
                  <div style={{ fontSize: 8, color: '#cbd5e1' }}>{d.currency === 'USD' ? '$' : 'UZS'}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── XABAR YUBORISH ──
function SendTab() {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')

  const send = async () => {
    if (!text.trim()) return
    if (!window.confirm(`Barcha foydalanuvchilarga yuborilsinmi?\n\n"${text.slice(0, 100)}"`)) return
    setBusy(true); setDone('')
    try {
      const { data } = await adminAPI.broadcast(text.trim())
      setDone(`✅ ${data.sent_to} foydalanuvchiga yuborilmoqda`)
      setText('')
      haptic('success')
    } catch {
      setDone('⚠️ Xatolik yuz berdi')
      haptic('error')
    } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.5 }}>
        Barcha foydalanuvchilarga Telegram orqali e'lon yuboriladi.
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="E'lon matnini yozing..." rows={6}
        style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.1)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', background: '#fff' }} />
      {done && <div style={{ margin: '10px 0', padding: '10px 12px', background: done.startsWith('✅') ? '#f0fdf4' : '#fef2f2', borderRadius: 10, fontSize: 13, color: done.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{done}</div>}
      <button onClick={send} disabled={busy || !text.trim()} style={{
        width: '100%', marginTop: 12, padding: '14px', borderRadius: 14, border: 'none',
        background: text.trim() ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#cbd5e1', color: '#fff',
        fontSize: 15, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', opacity: busy ? 0.6 : 1,
      }}>{busy ? 'Yuborilmoqda...' : '📢 Hammaga yuborish'}</button>
    </div>
  )
}

// ── Yordamchi komponentlar ──
const Metric = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', borderRadius: 14, padding: '12px 13px', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: -.5, marginTop: 2 }}>{value}</div>
    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
  </div>
)
const Row = ({ label, value, cur, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
    <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 800, color }}>{value} <span style={{ fontSize: 9, color: '#cbd5e1' }}>{cur}</span></span>
  </div>
)
const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
  </div>
)
const Empty = ({ text }) => <div style={{ textAlign: 'center', padding: '40px 20px', fontSize: 13, color: '#94a3b8' }}>{text}</div>
