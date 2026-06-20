import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useAuthStore } from '../store'
import { fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, PayIcon, ChevronRight } from '../components/Icons'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(parseFloat(v || 0)))

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { debts, loading, fetchDebts, groupedByDate, deleteDebt } = useDebtStore()
  const [sheet, setSheet] = useState(null)

  useEffect(() => { fetchDebts() }, [])

  const active = debts.filter(d => d.status !== 'paid')
  const totalGave = active.filter(d => d.debt_type === 'gave').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const totalGot  = active.filter(d => d.debt_type === 'got').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const net = totalGave - totalGot
  const groups = groupedByDate()
  const firstName = (user?.display_name || user?.full_name || 'Foydalanuvchi').split(' ')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(145deg, #0a4d26 0%, #16a34a 60%, #22c55e 100%)',
        padding: '16px 18px 18px',
        flexShrink: 0,
      }}>
        {/* top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: '#fff' }}>
              Salom, {firstName} 👋
            </h2>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 13,
            background: 'rgba(255,255,255,.2)',
            border: '1.5px solid rgba(255,255,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, color: '#fff',
          }}>
            {initials(user?.display_name || 'U')}
          </div>
        </div>

        {/* balance + cards in one block */}
        <div style={{
          background: 'rgba(255,255,255,.12)',
          borderRadius: 20,
          padding: '14px 16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,.15)',
        }}>
          {/* net */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,.6)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              Sof balans
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1.5 }}>
              {net >= 0 ? '+' : '−'}{n(Math.abs(net))}
              <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 5, opacity: .7 }}>UZS</span>
            </p>
          </div>

          {/* two mini cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ArrowUpIcon />
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>Berganim</span>
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{n(totalGave)}</p>
              <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>UZS</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <ArrowDownIcon />
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>Olganim</span>
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{n(totalGot)}</p>
              <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>UZS</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSACTIONS ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Tranzaksiyalar</h3>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, background: '#fff', padding: '3px 10px', borderRadius: 20 }}>
            {active.length} ta
          </span>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#94a3b8' }}>Yuklanmoqda...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
            {/* Custom SVG illustration */}
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{ marginBottom: 18 }}>
              <circle cx="50" cy="50" r="48" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
              <rect x="28" y="32" width="44" height="36" rx="5" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
              <path d="M34 46h32M34 54h20" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="68" cy="66" r="13" fill="#16a34a"/>
              <path d="M63 66h10M68 61v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Qarzlar yo'q</p>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              Birinchi qarzni qo'shing va moliyaviy hisobingizni yurating
            </p>
            <button onClick={() => navigate('/add')} style={{
              padding: '13px 32px', borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(22,163,74,.35)',
            }}>+ Qarz qo'shish</button>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 18px 5px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{fmtDate(group.date)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: group.total >= 0 ? '#16a34a' : '#ef4444' }}>
                {group.total >= 0 ? '+' : ''}{n(group.total)}
              </span>
            </div>

            <div style={{ margin: '0 12px', background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              {group.debts.map((debt, idx) => {
                const isGave = debt.debt_type === 'gave'
                const av = avatarColor(debt.contact_name)
                return (
                  <div key={debt.id} onClick={() => { haptic('light'); setSheet(debt) }} style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', cursor: 'pointer',
                    borderBottom: idx < group.debts.length - 1 ? '1px solid #f8fafc' : 'none',
                  }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: av.bg, color: av.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>{initials(debt.contact_name)}</div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 17, height: 17, borderRadius: '50%',
                        background: isGave ? '#16a34a' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff', color: '#fff',
                      }}>
                        {isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {debt.contact_name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: isGave ? '#f0fdf4' : '#fff1f2',
                          color: isGave ? '#16a34a' : '#ef4444',
                        }}>{isGave ? 'Berdim' : 'Oldim'}</span>
                        {debt.status === 'paid' && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: '#f1f5f9', color: '#64748b' }}>✓ To'langan</span>
                        )}
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>{fmtTime(debt.created_at)}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: -.3, color: isGave ? '#16a34a' : '#ef4444' }}>
                        {isGave ? '+' : '−'}{n(debt.remaining_amount)}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: 10, color: '#cbd5e1' }}>{debt.currency}</p>
                    </div>
                    <ChevronRight />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM SHEET ── */}
      {sheet && (
        <>
          <div onClick={() => setSheet(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)',
            zIndex: 100, backdropFilter: 'blur(4px)',
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#fff', borderRadius: '24px 24px 0 0',
            zIndex: 101, paddingBottom: 32,
            boxShadow: '0 -6px 30px rgba(0,0,0,.15)',
          }}>
            <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '12px auto 0' }} />

            {/* hero card */}
            <div style={{
              margin: '14px 14px 12px', borderRadius: 20,
              background: sheet.debt_type === 'gave'
                ? 'linear-gradient(135deg,#22c55e,#15803d)'
                : 'linear-gradient(135deg,#f87171,#dc2626)',
              padding: '18px 18px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
              <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                {sheet.debt_type === 'gave' ? '📤 Men berdim' : '📥 Men oldim'}
              </p>
              <p style={{ margin: '0 0 3px', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>
                {n(sheet.amount)} <span style={{ fontSize: 15, fontWeight: 600, opacity: .8 }}>{sheet.currency}</span>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
                {sheet.contact_name} · {fmtDate(sheet.created_at)}
              </p>
            </div>

            {/* info */}
            <div style={{ margin: '0 14px 12px', background: '#f8fafc', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { label: 'Holat', value: { active: '🟡 Faol', partial: '🟠 Qisman', paid: '🟢 To\'langan' }[sheet.status] },
                parseFloat(sheet.paid_amount) > 0 && { label: "To'langan", value: `${n(sheet.paid_amount)} ${sheet.currency}` },
                parseFloat(sheet.remaining_amount) !== parseFloat(sheet.amount) && { label: 'Qoldi', value: `${n(sheet.remaining_amount)} ${sheet.currency}` },
                sheet.note && { label: 'Izoh', value: sheet.note },
                sheet.due_date && { label: 'Muddat', value: fmtDate(sheet.due_date) },
              ].filter(Boolean).map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 14px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 14px' }}>
              <button onClick={() => { setSheet(null); navigate(`/debt/${sheet.id}/pay`) }} style={{
                padding: 14, borderRadius: 15, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#22c55e,#15803d)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 4px 12px rgba(22,163,74,.3)',
              }}>
                <PayIcon /> To'lash
              </button>
              <button onClick={async () => { haptic('heavy'); await deleteDebt(sheet.id); setSheet(null) }} style={{
                padding: 14, borderRadius: 15, border: '1.5px solid #fee2e2', cursor: 'pointer',
                background: '#fff', color: '#ef4444', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <TrashIcon /> O'chirish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
