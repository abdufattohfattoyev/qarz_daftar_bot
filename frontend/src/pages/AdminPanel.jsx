import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../api'
import { initials, avatarColor, haptic } from '../utils'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(Math.abs(parseFloat(v || 0))))

const TABS = [
  { key: 'stats', label: '📊 Statistika' },
  { key: 'users', label: '👥 Userlar' },
  { key: 'sms',   label: '📩 SMS' },
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
        {tab === 'sms'   && <SmsTab />}
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

  // SMS ruxsatini yoqish/o'chirish ('selected' rejim uchun)
  const toggleSms = async (u, e) => {
    e.stopPropagation()
    haptic('light')
    try {
      const { data: r } = await adminAPI.userSmsAllow(u.id, !u.sms_allowed)
      setData((prev) => ({ ...prev, users: prev.users.map((x) => x.id === u.id ? { ...x, sms_allowed: r.sms_allowed } : x) }))
    } catch { haptic('error') }
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
                  {/* SMS ruxsati chipi — bosilганда yoqiladi/o'chadi */}
                  <button onClick={(e) => toggleSms(u, e)} title="SMS ruxsati" style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 800,
                    border: u.sms_allowed ? '1.5px solid #bbf7d0' : '1.5px solid #e5e7eb',
                    background: u.sms_allowed ? '#f0fdf4' : '#fff', color: u.sms_allowed ? '#16a34a' : '#94a3b8',
                  }}>
                    📩 {u.sms_allowed ? 'ON' : 'OFF'}
                  </button>
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

// ── SMS STATISTIKA ──
function SmsTab() {
  const [d, setD] = useState(null)
  const [detail, setDetail] = useState(null)   // ochilgan log yozuvi

  useEffect(() => { adminAPI.smsLogs().then((r) => setD(r.data)).catch(() => setD(false)) }, [])
  if (d === null) return <Spinner />
  if (d === false) return <Empty text="SMS statistikasi yuklanmadi" />

  const kindBadge = (k) => k === 'otp'
    ? { t: 'Kod', bg: '#eff6ff', c: '#2563eb' }
    : { t: 'Eslatma', bg: '#f0fdf4', c: '#16a34a' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Umumiy raqamlar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Metric label="Jami SMS" value={d.summary.total} sub={`${d.summary.week} (7 kun)`} color="#16a34a" />
        <Metric label="Qarz eslatma" value={d.summary.reminders} sub="qarzdorlarga" color="#3b82f6" />
        <Metric label="Tasdiqlash kodi" value={d.summary.otp} sub="ro'yxatdan o'tish" color="#8b5cf6" />
        <Metric label="So'nggi 7 kun" value={d.summary.week} sub="SMS" color="#f59e0b" />
      </div>

      {/* Kim nechta yuborgan */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>Kim nechta yuborgan</div>
        {d.senders.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Hali SMS yuborilmagan</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {d.senders.map((s, i) => {
              const av = avatarColor(s.name)
              return (
                <div key={s.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(s.name)}</div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{s.count} <span style={{ fontSize: 9, color: '#cbd5e1' }}>SMS</span></div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* So'nggi yuborilgan SMS'lar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>So'nggi yuborilgan SMS'lar</div>
        {d.logs.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Yozuvlar yo'q</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.logs.map((l) => {
              const b = kindBadge(l.kind)
              return (
                <div key={l.id} onClick={() => { haptic('light'); setDetail(l) }} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: '#f8fafc', cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.sender} <span style={{ color: '#cbd5e1' }}>→</span> {l.recipient || l.phone}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{l.phone} · {l.created}</div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: b.bg, color: b.c, flexShrink: 0 }}>{b.t}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Batafsil modal */}
      {detail && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setDetail(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,23,42,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="sheet-anim" style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 520, padding: '18px 18px', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#e5e7eb', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>SMS tafsiloti</div>
            <DetailRow k="Yuboruvchi" v={detail.sender} />
            <DetailRow k="Qabul qiluvchi" v={detail.recipient || '—'} />
            <DetailRow k="Telefon" v={detail.phone} />
            <DetailRow k="Turi" v={detail.kind === 'otp' ? 'Tasdiqlash kodi' : 'Qarz eslatma'} />
            <DetailRow k="Vaqt" v={detail.created} />
            <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 12, fontSize: 13, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{detail.message}</div>
            <button onClick={() => setDetail(null)} style={{ width: '100%', marginTop: 14, padding: 14, borderRadius: 14, border: 'none', background: '#f3f4f6', color: '#111', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  )
}

const DetailRow = ({ k, v }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '5px 0', borderBottom: '0.5px solid #f1f5f9' }}>
    <span style={{ fontSize: 12.5, color: '#94a3b8' }}>{k}</span>
    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
  </div>
)

// ── XABAR YUBORISH (reklama / e'lon) ──
const AD_TEMPLATES = [
  { label: '🆕 Yangilik', text: "🆕 <b>Yangilik!</b>\n\nIlovamizga yangi imkoniyat qo'shildi:\n\n✨ ...\n\nHoziroq sinab ko'ring 👇" },
  { label: '💡 Maslahat', text: "💡 <b>Foydali maslahat</b>\n\nQarzlaringizni unutmaslik uchun har bir qarzga <b>muddat</b> qo'ying — muddati kelganda o'zimiz eslatamiz 🔔" },
  { label: '🙏 Rahmat', text: "🙏 <b>Rahmat!</b>\n\nBizni tanlaganingiz uchun tashakkur. Taklif va fikrlaringiz bo'lsa, shu yerga yozib qoldiring 👇" },
]

// Telegram HTML (<b>, <i>) preview uchun xavfsiz renderga aylantiradi
const tgPreviewHtml = (t) => t
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gs, '<b>$1</b>')
  .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gs, '<i>$1</i>')
  .replace(/\n/g, '<br/>')

function SendTab() {
  const [text, setText] = useState('')
  const [btnMode, setBtnMode] = useState('app')   // 'none' | 'app' | 'url'
  const [btnText, setBtnText] = useState('')
  const [btnUrl, setBtnUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [progress, setProgress] = useState(null)   // {total, sent, failed, done}
  const areaRef = React.useRef(null)
  const pollRef = React.useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  const button = btnMode === 'app' ? 'app'
    : btnMode === 'url' && btnText.trim() && btnUrl.trim().startsWith('http')
      ? { text: btnText.trim(), url: btnUrl.trim() }
      : null

  // Belgilangan matnni <b>/<i> bilan o'raydi
  const wrap = (tag) => {
    const el = areaRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    if (s === e) return
    setText(text.slice(0, s) + `<${tag}>` + text.slice(s, e) + `</${tag}>` + text.slice(e))
    haptic('light')
  }

  const startPoll = (id) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await adminAPI.broadcastStatus(id)
        setProgress(data)
        if (data.done) {
          clearInterval(pollRef.current)
          setBusy(false)
          setDone(`✅ Tugadi! Yetkazildi: ${data.sent} · Bloklagan: ${data.failed}`)
          haptic('success')
        }
      } catch { /* keyingi urinishda oladi */ }
    }, 1200)
  }

  const send = async (test) => {
    if (!text.trim()) return
    if (!test && !window.confirm('Barcha foydalanuvchilarga yuborilsinmi?\n\nAvval "🧪 O\'zimga sinab" bilan tekshirib ko\'rganingiz ma\'qul.')) return
    setBusy(true); setDone(''); setProgress(null)
    try {
      const { data } = await adminAPI.broadcast({ text: text.trim(), button, test })
      if (test) {
        setDone(data.ok ? '🧪 O\'zingizga yuborildi — Telegramda ko\'ring' : '⚠️ Yuborilmadi, botga /start bosganmisiz?')
        setBusy(false)
        haptic('success')
      } else {
        setProgress({ total: data.total, sent: 0, failed: 0, done: false })
        startPoll(data.broadcast_id)
        setText('')
      }
    } catch (e) {
      setDone(`⚠️ ${e?.response?.data?.error || 'Xatolik yuz berdi'}`)
      setBusy(false)
      haptic('error')
    }
  }

  const pct = progress ? Math.round(((progress.sent + progress.failed) / Math.max(1, progress.total)) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tayyor shablonlar */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} className="no-scrollbar">
        {AD_TEMPLATES.map((t) => (
          <button key={t.label} onClick={() => { setText(t.text); haptic('light') }} className="pill-btn" style={{ flexShrink: 0, padding: '6px 11px', borderRadius: 10, border: 'none', background: '#fff', fontSize: 11, fontWeight: 700, color: '#334155', cursor: 'pointer', boxShadow: '0 1px 5px rgba(0,0,0,.05)' }}>{t.label}</button>
        ))}
      </div>

      {/* Matn + formatlash */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
          <button onClick={() => wrap('b')} style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>B</button>
          <button onClick={() => wrap('i')} style={{ padding: '4px 13px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontStyle: 'italic', fontSize: 13, cursor: 'pointer', fontFamily: 'serif' }}>I</button>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>matnni belgilab bosing</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: text.length > 4000 ? '#ef4444' : '#94a3b8' }}>{text.length}/4000</span>
        </div>
        <textarea ref={areaRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="E'lon matnini yozing..." rows={6}
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.08)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical', background: '#f8fafc' }} />
      </div>

      {/* Tugma tanlash */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Xabar ostidagi tugma</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['app', '📒 Ilovani ochish'], ['url', '🔗 Havola'], ['none', 'Tugmasiz']].map(([k, lbl]) => (
            <button key={k} onClick={() => { setBtnMode(k); haptic('light') }} style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: btnMode === k ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0',
              background: btnMode === k ? '#f0fdf4' : '#fff', color: btnMode === k ? '#16a34a' : '#64748b',
            }}>{lbl}</button>
          ))}
        </div>
        {btnMode === 'url' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            <input value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="Tugma matni (masalan: Batafsil)"
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            <input value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="https://..."
              style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${btnUrl && !btnUrl.startsWith('http') ? '#fca5a5' : '#e2e8f0'}`, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          </div>
        )}
      </div>

      {/* Jonli preview — Telegramda qanday ko'rinadi */}
      {text.trim() && (
        <div style={{ background: '#e7ebf0', borderRadius: 14, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>👁 TELEGRAMDA KO'RINISHI</div>
          <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', padding: '9px 12px', maxWidth: '92%', boxShadow: '0 1px 2px rgba(0,0,0,.08)' }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: '#0f172a', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: '📢 <b>E\'lon</b><br/><br/>' + tgPreviewHtml(text) }} />
            <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right', marginTop: 3 }}>{new Date().toTimeString().slice(0, 5)}</div>
          </div>
          {button && (
            <div style={{ maxWidth: '92%', marginTop: 4, background: 'rgba(255,255,255,.75)', borderRadius: 10, padding: '8px 0', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#3b82f6' }}>
              {button === 'app' ? '📒 Ilovani ochish' : button.text}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
            <span>{progress.done ? '✅ Yuborildi' : '📤 Yuborilmoqda...'}</span>
            <span>{progress.sent + progress.failed}/{progress.total}</span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 6, transition: 'width .6s' }} />
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: '#64748b' }}>
            <span>✅ Yetkazildi: <b style={{ color: '#16a34a' }}>{progress.sent}</b></span>
            <span>🚫 Bloklagan: <b style={{ color: '#ef4444' }}>{progress.failed}</b></span>
          </div>
        </div>
      )}

      {done && <div style={{ padding: '10px 12px', background: done.startsWith('⚠') ? '#fef2f2' : '#f0fdf4', borderRadius: 10, fontSize: 13, color: done.startsWith('⚠') ? '#ef4444' : '#16a34a' }}>{done}</div>}

      {/* Amallar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => send(true)} disabled={busy || !text.trim()} style={{
          flex: 1, padding: '13px 8px', borderRadius: 14, border: '1.5px solid #e2e8f0',
          background: '#fff', color: text.trim() ? '#334155' : '#cbd5e1', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', opacity: busy ? 0.6 : 1,
        }}>🧪 O'zimga sinab</button>
        <button onClick={() => send(false)} disabled={busy || !text.trim() || text.length > 4000} style={{
          flex: 2, padding: '13px 8px', borderRadius: 14, border: 'none', fontFamily: 'inherit',
          background: text.trim() ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#cbd5e1', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', opacity: busy ? 0.6 : 1,
        }}>{busy ? 'Yuborilmoqda...' : '📢 Hammaga yuborish'}</button>
      </div>
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
