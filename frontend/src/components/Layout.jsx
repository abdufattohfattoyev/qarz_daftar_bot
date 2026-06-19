import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
      fill={active ? '#16a34a' : 'none'}
      stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8" strokeLinejoin="round"/>
  </svg>
)

const ContactsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3" stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8"/>
    <path d="M3 20C3 17 5.5 14 9 14C12.5 14 15 17 15 20" stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M17 11C18.1 11 19 10.1 19 9C19 7.9 18.1 7 17 7" stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M21 20C21 17.8 19.8 16 18 15.2" stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const StatsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="14" width="4" height="7" rx="1.5" fill={active ? '#16a34a' : '#d1d5db'}/>
    <rect x="10" y="9" width="4" height="12" rx="1.5" fill={active ? '#16a34a' : '#d1d5db'}/>
    <rect x="17" y="4" width="4" height="17" rx="1.5" fill={active ? '#16a34a' : '#d1d5db'}/>
  </svg>
)

const AddIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="14" fill="url(#addGrad)"/>
    <path d="M14 8V20M8 14H20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="addGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ade80"/>
        <stop offset="1" stopColor="#16a34a"/>
      </linearGradient>
    </defs>
  </svg>
)

const SettingsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8"/>
    <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
      stroke={active ? '#16a34a' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const NAV = [
  { to: '/', icon: HomeIcon, label: 'Asosiy' },
  { to: '/contacts', icon: ContactsIcon, label: 'Mijozlar' },
  { to: '/add', icon: null, label: '' },
  { to: '/stats', icon: StatsIcon, label: 'Statistika' },
  { to: '/settings', icon: SettingsIcon, label: 'Sozlamalar' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: 480, margin: '0 auto', background: '#F2F3F7'
    }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      <nav style={{
        display: 'flex', background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
      }}>
        {NAV.map((item) => {
          const active = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to)

          if (!item.icon) {
            return (
              <NavLink key={item.to} to={item.to} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px 0 12px', textDecoration: 'none',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#4ade80,#16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22, boxShadow: '0 6px 20px rgba(22,163,74,0.4)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M13 5V21M5 13H21" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </NavLink>
            )
          }

          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, padding: '10px 0 12px',
              textDecoration: 'none',
            }}>
              <Icon active={active} />
              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#16a34a' : '#9ca3af',
                letterSpacing: '0.01em',
              }}>{item.label}</span>
              {active && (
                <div style={{
                  position: 'absolute', bottom: 0,
                  width: 32, height: 3, borderRadius: '3px 3px 0 0',
                  background: '#16a34a'
                }} />
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
