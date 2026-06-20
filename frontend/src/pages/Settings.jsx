import React, { useState } from 'react'
import { useAuthStore } from '../store'
import { initials, haptic } from '../utils'
import { statsAPI } from '../api'
import { CurrencyIcon, GlobeIcon, BellIcon, ExcelIcon, DeleteAllIcon } from '../components/Icons'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [modal, setModal] = useState(null) // 'currency' | 'language' | 'delete'
  const [deleting, setDeleting] = useState(false)

  const save = async (key, val) => {
    haptic('light')
    await updateUser({ [key]: val })
    setModal(null)
  }

  const exportExcel = async () => {
    haptic('light')
    try {
      const res = await statsAPI.export()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'qarz_daftar.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { }
  }

  const currencies = [
    { val: 'UZS', label: "So'm", flag: '🇺🇿' },
    { val: 'USD', label: 'Dollar', flag: '🇺🇸' },
    { val: 'RUB', label: 'Rubl', flag: '🇷🇺' },
  ]
  const languages = [
    { val: 'uz', label: "O'zbek tili", flag: '🇺🇿' },
    { val: 'ru', label: 'Русский язык', flag: '🇷🇺' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>
      <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Sozlamalar</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px' }}>

        {/* Profile card */}
        <div style={{ margin: '4px 16px 20px', background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 22, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,.22)', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {initials(user?.display_name || 'U')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name || '—'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
              {user?.telegram_username ? `@${user.telegram_username}` : 'Telegram foydalanuvchi'}
            </div>
          </div>
        </div>

        {/* App settings */}
        <SectionLabel>Ilova sozlamalari</SectionLabel>
        <Card>
          <Row icon={<CurrencyIcon />} label="Valyuta" value={user?.currency} onClick={() => { haptic('light'); setModal('currency') }} />
          <Divider />
          <Row icon={<GlobeIcon />} label="Til" value={user?.language === 'uz' ? "O'zbek" : 'Русский'} onClick={() => { haptic('light'); setModal('language') }} />
          <Divider />
          <ToggleRow
            icon={<BellIcon />} label="Eslatmalar"
            checked={user?.notifications_enabled}
            onChange={async () => { haptic('light'); await updateUser({ notifications_enabled: !user?.notifications_enabled }) }}
          />
        </Card>

        {/* Data */}
        <SectionLabel>Ma'lumotlar</SectionLabel>
        <Card>
          <Row icon={<ExcelIcon />} label="Excel eksport" value="⬇" onClick={exportExcel} />
          <Divider />
          <Row icon={<DeleteAllIcon />} label="Hammasini o'chirish" danger onClick={() => { haptic('medium'); setModal('delete') }} />
        </Card>

        {/* App version */}
        <div style={{ textAlign: 'center', color: '#c0c0c0', fontSize: 12, marginTop: 24 }}>
          Qarz daftar v1.0
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div onClick={() => setModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'flex-end', zIndex: 999, backdropFilter: 'blur(4px)'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '8px 0 40px', maxHeight: '80vh', overflowY: 'auto'
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '10px auto 20px' }} />

            {modal === 'currency' && (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#111', padding: '0 20px 16px' }}>Valyuta tanlang</div>
                {currencies.map(c => (
                  <button key={c.val} onClick={() => save('currency', c.val)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: '0.5px solid #f3f4f6'
                  }}>
                    <span style={{ fontSize: 26 }}>{c.flag}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111', flex: 1, textAlign: 'left' }}>{c.label}</span>
                    <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{c.val}</span>
                    {user?.currency === c.val && <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </>
            )}

            {modal === 'language' && (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#111', padding: '0 20px 16px' }}>Til tanlang</div>
                {languages.map(l => (
                  <button key={l.val} onClick={() => save('language', l.val)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '15px 20px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: '0.5px solid #f3f4f6'
                  }}>
                    <span style={{ fontSize: 26 }}>{l.flag}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111', flex: 1, textAlign: 'left' }}>{l.label}</span>
                    {user?.language === l.val && <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </>
            )}

            {modal === 'delete' && (
              <div style={{ padding: '0 20px' }}>
                <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>
                  Hammasini o'chirasizmi?
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
                  Barcha qarzlar va kontaktlar o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                </div>
                <button onClick={() => setModal(null)} style={{
                  width: '100%', padding: '15px', borderRadius: 16, border: 'none',
                  background: '#f3f4f6', color: '#111', fontSize: 16, fontWeight: 700, marginBottom: 10, cursor: 'pointer'
                }}>
                  Bekor qilish
                </button>
                <button onClick={() => { haptic('heavy'); setModal(null) }} style={{
                  width: '100%', padding: '15px', borderRadius: 16, border: 'none',
                  background: '#ef4444', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer'
                }}>
                  Ha, o'chirish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 20px 8px' }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 20, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.06)', marginLeft: 58 }} />
}

function Row({ icon, label, value, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: danger ? '#ef4444' : '#111' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#bbb' }}>{value} ›</span>
    </button>
  )
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#111' }}>{label}</span>
      <button onClick={onChange} style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: checked ? '#22c55e' : '#e5e7eb', transition: 'background .2s'
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  )
}
