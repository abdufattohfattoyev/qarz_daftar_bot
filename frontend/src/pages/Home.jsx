import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useAuthStore } from '../store'
import { fmt, fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, PayIcon, ChevronRight, EmptyIcon } from '../components/Icons'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(parseFloat(v || 0)))

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { debts, loading, fetchDebts, groupedByDate, deleteDebt } = useDebtStore()
  const [sheet, setSheet] = useState(null)

  useEffect(() => { fetchDebts() }, [])

  const active = debts.filter(d => d.status !== 'paid')
  const totalGave = active.filter(d => d.debt_type === 'gave').reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const totalGot  = active.filter(d => d.debt_type === 'got').reduce((s,  d) => s + parseFloat(d.remaining_amount || 0), 0)
  const net = totalGave - totalGot
  const groups = groupedByDate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(150deg,#0f5c2e 0%,#16a34a 55%,#22c55e 100%)',
        padding: '20px 20px 70px', flexShrink: 0,
      }}>
        {/* top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.65)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: '#fff' }}>
              Salom, {(user?.display_name || 'Foydalanuvchi').split(' ')[0]} 👋
            </h2>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'rgba(255,255,255,.18)',
            border: '1.5px solid rgba(255,255,255,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
          }}>
            {initials(user?.display_name || 'U')}
          </div>
        </div>

        {/* net balance */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.6)', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Sof balans
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1.5 }}>
            {net >= 0 ? '+' : '−'}{n(Math.abs(net))}
            <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 6, opacity: .75 }}>UZS</span>
          </p>
        </div>
      </div>

      {/* ── BALANCE CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '-44px 16px 0', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        {/* Gave */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '16px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <ArrowUpIcon />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Berganim</span>
          </div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#16a34a', letterSpacing: -.5 }}>{n(totalGave)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>UZS</p>
        </div>
        {/* Got */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '16px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <ArrowDownIcon />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Olganim</span>
          </div>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#ef4444', letterSpacing: -.5 }}>{n(totalGot)}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>UZS</p>
        </div>
      </div>

      {/* ── TRANSACTIONS ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 10px' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tranzaksiyalar</h3>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{debts.length} ta</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
            Yuklanmoqda...
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ margin: '0 auto 16px', width: 80, height: 80 }}><EmptyIcon /></div>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Qarzlar yo'q</p>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#94a3b8' }}>Birinchi qarzni qo'shing</p>
            <button onClick={() => navigate('/add')} style={{
              padding: '12px 28px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,163,74,.35)',
            }}>+ Qarz qo'shish</button>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date} style={{ marginBottom: 6 }}>
            {/* date row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 6px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{fmtDate(group.date)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: group.total >= 0 ? '#16a34a' : '#ef4444' }}>
                {group.total >= 0 ? '+' : ''}{n(group.total)}
              </span>
            </div>

            {/* cards */}
            <div style={{ margin: '0 14px', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,.05)' }}>
              {group.debts.map((debt, idx) => {
                const isGave = debt.debt_type === 'gave'
                const av = avatarColor(debt.contact_name)
                return (
                  <div key={debt.id} onClick={() => { haptic('light'); setSheet(debt) }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer',
                    borderBottom: idx < group.debts.length - 1 ? '1px solid #f8fafc' : 'none',
                    transition: 'background .15s',
                  }}>
                    {/* avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 15,
                        background: av.bg, color: av.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700,
                      }}>{initials(debt.contact_name)}</div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 18, height: 18, borderRadius: '50%',
                        background: isGave ? '#16a34a' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                        color: '#fff',
                      }}>
                        {isGave ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      </div>
                    </div>

                    {/* text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{debt.contact_name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: isGave ? '#f0fdf4' : '#fff1f2',
                          color: isGave ? '#16a34a' : '#ef4444',
                        }}>{isGave ? 'Berdim' : 'Oldim'}</span>
                        {debt.status === 'paid' && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>To'langan</span>
                        )}
                        <span style={{ fontSize: 11, color: '#cbd5e1' }}>{fmtTime(debt.created_at)}</span>
                      </div>
                    </div>

                    {/* amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: -.3, color: isGave ? '#16a34a' : '#ef4444' }}>
                        {isGave ? '+' : '−'}{n(debt.remaining_amount)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#cbd5e1' }}>{debt.currency}</p>
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
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)',
            zIndex: 100, maxWidth: 430, margin: '0 auto', backdropFilter: 'blur(6px)',
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430, background: '#fff',
            borderRadius: '28px 28px 0 0', zIndex: 101, paddingBottom: 36,
            boxShadow: '0 -8px 40px rgba(0,0,0,.18)',
          }}>
            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '14px auto 0' }} />

            {/* hero */}
            <div style={{
              margin: '16px 16px 14px', borderRadius: 22,
              background: sheet.debt_type === 'gave'
                ? 'linear-gradient(135deg,#22c55e 0%,#15803d 100%)'
                : 'linear-gradient(135deg,#f87171 0%,#dc2626 100%)',
              padding: '22px 20px', overflow: 'hidden', position: 'relative',
            }}>
              {/* decorative circle */}
              <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
              <div style={{ position: 'absolute', right: 20, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />

              <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {sheet.debt_type === 'gave' ? '📤 Men berdim' : '📥 Men oldim'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
                {n(sheet.amount)} <span style={{ fontSize: 18, fontWeight: 600, opacity: .8 }}>{sheet.currency}</span>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>
                {sheet.contact_name} • {fmtDate(sheet.created_at)}
              </p>
            </div>

            {/* info rows */}
            <div style={{ margin: '0 16px 14px', background: '#f8fafc', borderRadius: 18, overflow: 'hidden' }}>
              {[
                { label: 'Holat', value: { active: '🟡 Faol', partial: '🟠 Qisman', paid: '🟢 To\'langan' }[sheet.status] },
                parseFloat(sheet.paid_amount) > 0 && { label: 'To\'langan', value: `${n(sheet.paid_amount)} ${sheet.currency}` },
                parseFloat(sheet.remaining_amount) !== parseFloat(sheet.amount) && { label: 'Qoldi', value: `${n(sheet.remaining_amount)} ${sheet.currency}` },
                sheet.note && { label: 'Izoh', value: sheet.note },
                sheet.due_date && { label: 'Muddat', value: fmtDate(sheet.due_date) },
              ].filter(Boolean).map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px' }}>
              <button onClick={() => { setSheet(null); navigate(`/debt/${sheet.id}/pay`) }} style={{
                padding: 15, borderRadius: 16, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#22c55e,#15803d)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 4px 12px rgba(22,163,74,.3)',
              }}>
                <PayIcon /> To'lash
              </button>
              <button onClick={async () => { haptic('heavy'); await deleteDebt(sheet.id); setSheet(null) }} style={{
                padding: 15, borderRadius: 16, border: '1.5px solid #fee2e2', cursor: 'pointer',
                background: '#fff', color: '#ef4444',
                fontSize: 14, fontWeight: 700,
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
