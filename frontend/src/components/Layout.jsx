import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'

const NAV = [
  { to: '/', icon: '▤', label: 'Asosiy' },
  { to: '/contacts', icon: '👥', label: 'Mijozlar' },
  { to: '/stats', icon: '📊', label: 'Statistika' },
  { to: '/add', icon: '💳', label: 'Qarzlar' },
  { to: '/settings', icon: '⚙️', label: 'Sozlamalar' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto', background: '#F5F6F8' }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <nav style={{
        display: 'flex', background: '#fff',
        borderTop: '0.5px solid rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map((item) => {
          const active = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)
          return (
            <NavLink key={item.to} to={item.to} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, padding: '10px 0 12px',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: active ? '#16a34a' : '#bbb',
                letterSpacing: '0.01em',
              }}>{item.label}</span>
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#16a34a', marginTop: -2 }} />
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
