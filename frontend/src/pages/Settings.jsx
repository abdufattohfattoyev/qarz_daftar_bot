import React, { useState } from 'react'
import { useAuthStore, useDebtStore, useContactStore } from '../store'
import { initials, haptic } from '../utils'
import { statsAPI } from '../api'
import { CurrencyIcon, GlobeIcon, BellIcon, ExcelIcon, DeleteAllIcon } from '../components/Icons'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [modal, setModal] = useState(null) // 'currency' | 'language' | 'delete'
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAll = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await statsAPI.deleteAll()
      useDebtStore.setState({ debts: [] })
      useContactStore.setState({ contacts: [] })
      haptic('success')
    } catch { haptic('error') }
    finally { setDeleting(false); setModal(null) }
  }

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
    { val: 'UZS', label: "So'm", code: 'UZS', bg: '#fef9c3', color: '#92400e' },
    { val: 'USD', label: 'Dollar', code: '$', bg: '#dcfce7', color: '#166534' },
    { val: 'RUB', label: 'Rubl', code: '₽', bg: '#dbeafe', color: '#1e40af' },
  ]
  const languages = [
    { val: 'uz', label: "O'zbek tili", icon: 'UZ', bg: '#fef9c3' },
    { val: 'ru', label: 'Русский язык', icon: 'RU', bg: '#fee2e2' },
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

      {/* MODALS — backdrop is PARENT of sheet so stopPropagation works */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onTouchStart={() => setModal(null)}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 20px)', maxHeight: '75vh', overflowY: 'auto' }}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 18px' }} />

            {modal === 'currency' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111', padding: '0 20px 12px' }}>Valyuta tanlang</div>
                {currencies.map(c => (
                  <button
                    key={c.val}
                    onTouchStart={(e) => { e.stopPropagation(); save('currency', c.val) }}
                    onClick={(e) => { e.stopPropagation(); save('currency', c.val) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px', cursor: 'pointer', border: 'none',
                      borderBottom: '0.5px solid #f3f4f6', fontFamily: 'inherit',
                      background: user?.currency === c.val ? '#f0fdf4' : '#fff',
                      textAlign: 'left',
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.code}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>{c.label}</span>
                    <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{c.val}</span>
                    {user?.currency === c.val && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                ))}
                <div style={{ height: 20 }} />
              </>
            )}

            {modal === 'language' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#111', padding: '0 20px 12px' }}>Til tanlang</div>
                {languages.map(l => (
                  <button
                    key={l.val}
                    onTouchStart={(e) => { e.stopPropagation(); save('language', l.val) }}
                    onClick={(e) => { e.stopPropagation(); save('language', l.val) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px', cursor: 'pointer', border: 'none',
                      borderBottom: '0.5px solid #f3f4f6', fontFamily: 'inherit',
                      background: user?.language === l.val ? '#f0fdf4' : '#fff',
                      textAlign: 'left',
                    }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#374151' }}>{l.icon}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>{l.label}</span>
                    {user?.language === l.val && (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                ))}
                <div style={{ height: 20 }} />
              </>
            )}

            {modal === 'delete' && (
              <div style={{ padding: '0 18px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <DeleteAllIcon />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>
                  Hammasini o'chirasizmi?
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
                  Barcha qarzlar va kontaktlar o'chiriladi. Bu amalni qaytarib bo'lmaydi.
                </div>
                <button
                  onTouchStart={(e) => { e.stopPropagation(); setModal(null) }}
                  onClick={(e) => { e.stopPropagation(); setModal(null) }}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, background: '#f3f4f6', color: '#111', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 10, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                  Bekor qilish
                </button>
                <button
                  onTouchStart={(e) => { e.stopPropagation(); handleDeleteAll() }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteAll() }}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, background: '#ef4444', color: '#fff', fontSize: 16, fontWeight: 700, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                  {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
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
