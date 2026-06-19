import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useAuthStore } from '../store'
import { fmt, fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { debts, loading, fetchDebts, groupedByDate, deleteDebt } = useDebtStore()
  const [sheet, setSheet] = useState(null)

  useEffect(() => { fetchDebts() }, [])

  const groups = groupedByDate()

  const totalGave = debts.filter(d => d.debt_type === 'gave' && d.status !== 'paid')
    .reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)
  const totalGot = debts.filter(d => d.debt_type === 'got' && d.status !== 'paid')
    .reduce((s, d) => s + parseFloat(d.remaining_amount || 0), 0)

  const openSheet = (debt) => { haptic('light'); setSheet(debt) }
  const closeSheet = () => setSheet(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(160deg, #1a8c44 0%, #16a34a 60%, #22c55e 100%)',
        padding: '18px 20px 32px', flexShrink: 0,
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
              border: '2px solid rgba(255,255,255,0.4)',
            }}>
              {initials(user?.display_name || 'U')}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Xush kelibsiz</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                {user?.display_name || 'Foydalanuvchi'}
              </div>
            </div>
          </div>
          <button onClick={() => { haptic(); navigate('/add') }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Qarz
          </button>
        </div>

        {/* BALANCE CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.18)', borderRadius: 18, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 12V2M2 7L7 2L12 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>BERILGAN</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              {new Intl.NumberFormat('uz-UZ').format(totalGave)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>UZS</div>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.15)', borderRadius: 18, padding: '14px 16px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V12M12 7L7 12L2 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>OLINGAN</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
              {new Intl.NumberFormat('uz-UZ').format(totalGot)}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>UZS</div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16, marginTop: -4 }}>

        {/* Section title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Tranzaksiyalar</span>
          <span style={{ fontSize: 12, color: '#aaa' }}>{debts.length} ta</span>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Yuklanmoqda...
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 40px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 36
            }}>📭</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 6 }}>Qarzlar yo'q</div>
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>Birinchi qarzni qo'shing</div>
            <button onClick={() => navigate('/add')} style={{
              padding: '12px 28px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>+ Qarz qo'shish</button>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.date} style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 6px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>{fmtDate(group.date)}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: group.total >= 0 ? '#16a34a' : '#ef4444' }}>
                {group.total >= 0 ? '+' : ''}{new Intl.NumberFormat('uz-UZ').format(group.total)}
              </span>
            </div>

            <div style={{ margin: '0 14px', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              {group.debts.map((debt, idx) => {
                const isGave = debt.debt_type === 'gave'
                const av = avatarColor(debt.contact_name)
                return (
                  <div key={debt.id} onClick={() => openSheet(debt)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px', cursor: 'pointer',
                    borderBottom: idx < group.debts.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 15,
                        background: av.bg, color: av.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700,
                      }}>
                        {initials(debt.contact_name)}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 18, height: 18, borderRadius: '50%',
                        background: isGave ? '#16a34a' : '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #fff',
                      }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          {isGave
                            ? <path d="M4 6V2M2 4L4 2L6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            : <path d="M4 2V6M6 4L4 6L2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3 }}>
                        {debt.contact_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                          background: isGave ? '#dcfce7' : '#fee2e2',
                          color: isGave ? '#16a34a' : '#ef4444',
                        }}>
                          {isGave ? 'Berdim' : 'Oldim'}
                        </span>
                        <span style={{ fontSize: 11, color: '#bbb' }}>{fmtTime(debt.created_at)}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: isGave ? '#16a34a' : '#ef4444', letterSpacing: -0.3 }}>
                        {isGave ? '+' : '-'}{new Intl.NumberFormat('uz-UZ').format(debt.remaining_amount)}
                      </div>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{debt.currency}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div style={{ height: 80 }} />
      </div>

      {/* BOTTOM SHEET */}
      {sheet && (
        <>
          <div onClick={closeSheet} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 100, maxWidth: 480, margin: '0 auto', backdropFilter: 'blur(4px)'
          }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480,
            background: '#fff', borderRadius: '28px 28px 0 0',
            zIndex: 101, paddingBottom: 34,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          }}>
            <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />

            {/* Hero */}
            <div style={{
              margin: '16px 16px 12px', borderRadius: 22, padding: '20px',
              background: sheet.debt_type === 'gave'
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#f87171,#ef4444)',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, color: '#fff', fontWeight: 800
              }}>
                {initials(sheet.contact_name)}
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
                  {sheet.debt_type === 'gave' ? '📤 Men berdim' : '📥 Men oldim'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
                  {new Intl.NumberFormat('uz-UZ').format(sheet.amount)} {sheet.currency}
                </div>
                {parseFloat(sheet.paid_amount) > 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    Qoldi: {new Intl.NumberFormat('uz-UZ').format(sheet.remaining_amount)} {sheet.currency}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div style={{ margin: '0 16px 12px', background: '#f9fafb', borderRadius: 18, overflow: 'hidden' }}>
              {[
                { label: 'Kim bilan', value: sheet.contact_name },
                { label: 'Sana', value: `${fmtDate(sheet.created_at)}, ${fmtTime(sheet.created_at)}` },
                { label: 'Holat', value: { active: '🟡 Faol', partial: '🟠 Qisman', paid: '🟢 To\'langan' }[sheet.status] },
                sheet.note && { label: 'Izoh', value: sheet.note },
                sheet.due_date && { label: 'Muddat', value: fmtDate(sheet.due_date) },
              ].filter(Boolean).map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px' }}>
              <button onClick={() => { closeSheet(); navigate(`/debt/${sheet.id}/pay`) }} style={{
                padding: '14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                fontSize: 14, fontWeight: 700,
              }}>
                ✅ To'lash
              </button>
              <button onClick={async () => { haptic('heavy'); await deleteDebt(sheet.id); closeSheet() }} style={{
                padding: '14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: '#fef2f2', color: '#ef4444',
                fontSize: 14, fontWeight: 700,
              }}>
                🗑 O'chirish
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
