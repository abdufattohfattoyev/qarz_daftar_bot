// Settings page
import React from 'react'
import { useAuthStore } from '../store'
import { initials, haptic } from '../utils'

export default function Settings() {
  const { user, updateUser } = useAuthStore()

  const toggle = async (key) => {
    haptic('light')
    await updateUser({ [key]: !user[key] })
  }

  const ITEMS = [
    {
      section: 'Ilova sozlamalari',
      items: [
        { icon: '💱', bg: '#fef3c7', label: 'Valyuta', value: user?.currency, action: null },
        { icon: '🌐', bg: '#dcfce7', label: 'Til', value: user?.language === 'uz' ? "O'zbek" : 'Русский', action: null },
        {
          icon: '🔔', bg: '#dbeafe', label: 'Eslatmalar',
          toggle: true, checked: user?.notifications_enabled,
          onChange: () => toggle('notifications_enabled')
        },
      ]
    },
    {
      section: "Ma'lumotlar",
      items: [
        { icon: '📊', bg: '#dcfce7', label: 'Excel eksport', value: '⬇', action: null },
        { icon: '🗑', bg: '#fee2e2', label: "Hammasini o'chirish", danger: true, action: null },
      ]
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 18px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Sozlamalar</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Profile */}
        <div style={{ margin: '6px 16px 12px', background: '#fff', borderRadius: 20, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, border: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials(user?.display_name || 'U')}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{user?.display_name || '—'}</div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
              {user?.telegram_username ? `@${user.telegram_username}` : ''}
            </div>
          </div>
        </div>

        {ITEMS.map((section) => (
          <div key={section.section}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0c0c0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 18px 6px' }}>
              {section.section}
            </div>
            <div style={{ margin: '0 16px 12px', background: '#fff', borderRadius: 20, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)' }}>
              {section.items.map((item, idx, arr) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderBottom: idx < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                  cursor: item.action ? 'pointer' : 'default'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: item.danger ? '#ef4444' : '#111' }}>
                      {item.label}
                    </span>
                  </div>
                  {item.toggle ? (
                    <button onClick={item.onChange} style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: item.checked ? '#22c55e' : '#e5e7eb',
                      border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: item.checked ? 20 : 2,
                        transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }} />
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.value} {item.value !== '⬇' && '›'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
