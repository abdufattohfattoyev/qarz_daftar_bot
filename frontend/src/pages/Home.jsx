import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebtStore, useAuthStore } from '../store'
import { fmt, fmtDate, fmtTime, initials, avatarColor, haptic } from '../utils'
import dayjs from 'dayjs'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { debts, loading, fetchDebts, groupedByDate, deleteDebt } = useDebtStore()
  const [sheet, setSheet] = useState(null) // aktiv debt

  useEffect(() => { fetchDebts() }, [])

  const groups = groupedByDate()

  const openSheet = (debt) => {
    haptic('light')
    setSheet(debt)
  }
  const closeSheet = () => setSheet(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {initials(user?.display_name || 'U')}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111', letterSpacing: -0.3 }}>
              {user?.display_name || 'Foydalanuvchi'}
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              {user?.telegram_username ? `@${user.telegram_username}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div
            onClick={() => { haptic(); navigate('/add') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)',
              borderRadius: 10, padding: '7px 12px', cursor: 'pointer'
            }}>
            <span style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>+ Qarz</span>
          </div>
        </div>
      </div>

      {/* IMPORT BANNER */}
      <div style={{
        margin: '0 16px 12px', padding: '12px 16px',
        background: 'rgba(22,163,74,0.09)', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid rgba(22,163,74,0.18)', cursor: 'pointer', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, color: '#16a34a' }}>
          <span>⬇️</span> Bazani yuklab olish
        </div>
        <span style={{ color: '#16a34a' }}>›</span>
      </div>

      {/* DEBT LIST */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Yuklanmoqda...</div>
        )}
        {!loading && groups.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>Qarzlar yo'q</div>
            <div style={{ fontSize: 13, color: '#aaa' }}>Birinchi qarzni qo'shing</div>
          </div>
        )}
        {groups.map((group) => (
          <div key={group.date} style={{
            background: '#fff', borderRadius: 20,
            margin: '0 16px 10px', overflow: 'hidden',
            border: '0.5px solid rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px 10px', borderBottom: '0.5px solid rgba(0,0,0,0.06)'
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                {fmtDate(group.date)}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: group.total >= 0 ? '#16a34a' : '#ef4444'
              }}>
                {group.total >= 0 ? '+' : ''}{fmt(group.total)}
              </span>
            </div>
            {group.debts.map((debt, idx) => {
              const isGave = debt.debt_type === 'gave'
              const av = avatarColor(debt.contact_name)
              return (
                <div
                  key={debt.id}
                  onClick={() => openSheet(debt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px', cursor: 'pointer',
                    borderBottom: idx < group.debts.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none',
                    transition: 'background .1s'
                  }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: av.bg, color: av.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700
                    }}>
                      {initials(debt.contact_name)}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 17, height: 17, borderRadius: '50%',
                      background: isGave ? '#16a34a' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', fontSize: 8, color: '#fff'
                    }}>
                      {isGave ? '↑' : '↓'}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isGave ? '#16a34a' : '#ef4444', marginBottom: 2 }}>
                      {debt.contact_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#bbb' }}>{fmtTime(debt.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isGave ? '#16a34a' : '#ef4444' }}>
                      {fmt(debt.amount, debt.currency)}
                    </div>
                    <span style={{ color: '#ddd', fontSize: 18 }}>⋮</span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* BOTTOM SHEET */}
      {sheet && (
        <>
          <div
            onClick={closeSheet}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 100, maxWidth: 480, margin: '0 auto'
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480,
            background: '#fff', borderRadius: '26px 26px 0 0',
            zIndex: 101, paddingBottom: 24
          }}>
            <div style={{ width: 38, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto' }} />

            {/* Hero */}
            <div style={{
              margin: '0 16px 12px', borderRadius: 20, padding: '16px 20px',
              background: sheet.debt_type === 'gave'
                ? 'linear-gradient(135deg,#4ade80,#16a34a)'
                : 'linear-gradient(135deg,#ff6b6b,#ef4444)',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff'
              }}>
                {sheet.debt_type === 'gave' ? '↑' : '↓'}
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>QARZ</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.8 }}>
                  {fmt(sheet.amount, sheet.currency)}
                </div>
              </div>
            </div>

            {/* Person */}
            <div style={{
              margin: '0 16px 10px', background: '#F5F6F8', borderRadius: 16,
              padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#c7f3e0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#0f6e56'
                }}>
                  {initials(sheet.contact_name)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{sheet.contact_name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{sheet.contact_detail?.phone || ''}</div>
                </div>
              </div>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </div>

            {/* Info rows */}
            <div style={{ margin: '0 16px 12px', background: '#F5F6F8', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { icon: '↕', label: 'Tur', value: sheet.debt_type === 'gave' ? 'Men berdim' : 'Mendan oldi', valueColor: sheet.debt_type === 'gave' ? '#16a34a' : '#ef4444' },
                { icon: '🕐', label: 'Sana', value: fmtDate(sheet.created_at) + ', ' + fmtTime(sheet.created_at) },
                { icon: '$', label: 'Valyuta', value: sheet.currency },
                { icon: '📊', label: 'Holat', value: { active: 'Faol', partial: 'Qisman', paid: "To'langan" }[sheet.status] },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#999' }}>
                    <span style={{ fontSize: 15, color: '#ccc' }}>{row.icon}</span>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: row.valueColor || '#111' }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '0 16px' }}>
              <button
                onClick={() => { closeSheet(); navigate(`/debt/${sheet.id}/pay`) }}
                style={{
                  padding: 14, borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
                  fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                ✏️ Tahrirlash
              </button>
              <button
                onClick={async () => { haptic('heavy'); await deleteDebt(sheet.id); closeSheet() }}
                style={{
                  padding: 14, borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
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
