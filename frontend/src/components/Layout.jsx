import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, UsersIcon, ChartIcon, SettingIcon, PlusIcon } from './Icons'

const NAV = [
  { to: '/', Icon: HomeIcon, label: 'Asosiy' },
  { to: '/contacts', Icon: UsersIcon, label: 'Mijozlar' },
  { to: '/add', Icon: null, label: '' },
  { to: '/stats', Icon: ChartIcon, label: 'Statistika' },
  { to: '/settings', Icon: SettingIcon, label: 'Sozlamalar' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: 430, margin: '0 auto', background: '#F0F2F5',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center',
        background: '#fff',
        borderTop: '1px solid #f1f5f9',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 4,
        boxShadow: '0 -1px 20px rgba(0,0,0,0.07)',
        position: 'relative', zIndex: 50,
      }}>
        {NAV.map((item) => {
          if (!item.Icon) {
            return (
              <NavLink key={item.to} to={item.to} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', paddingBottom: 8,
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: '50%',
                  background: 'linear-gradient(145deg, #22d05a, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -26,
                  boxShadow: '0 8px 24px rgba(21,128,61,0.45), 0 2px 8px rgba(21,128,61,0.3)',
                  border: '3px solid #fff',
                }}>
                  <PlusIcon />
                </div>
              </NavLink>
            )
          }

          const active = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)

          const { Icon } = item
          return (
            <NavLink key={item.to} to={item.to} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, paddingBottom: 8,
              textDecoration: 'none', paddingTop: 8, position: 'relative',
            }}>
              {active && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 3, borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg, #22d05a, #15803d)',
                }} />
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: active ? '#f0fdf4' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s',
              }}>
                <Icon active={active} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#15803d' : '#94a3b8',
              }}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
