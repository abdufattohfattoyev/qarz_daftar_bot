import React, { useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, UsersIcon, ChartIcon, SettingIcon, PlusIcon } from './Icons'
import { useT } from '../i18n'
import ErrorBoundary from './ErrorBoundary'

const NAV = [
  { to: '/', Icon: HomeIcon, labelKey: 'nav_home' },
  { to: '/contacts', Icon: UsersIcon, labelKey: 'nav_contacts' },
  { to: '/add', Icon: null, labelKey: '' },
  { to: '/stats', Icon: ChartIcon, labelKey: 'nav_stats' },
  { to: '/settings', Icon: SettingIcon, labelKey: 'nav_settings' },
]

const CSS = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes navPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.88); }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .page-enter { animation: scaleIn .22s cubic-bezier(.25,.8,.25,1) both; }
  .fadeup     { animation: fadeUp .28s cubic-bezier(.25,.8,.25,1) both; }
  .sheet-anim { animation: slideUp .3s cubic-bezier(.25,.8,.25,1) both; }

  .nav-btn { transition: transform .15s, opacity .15s; -webkit-tap-highlight-color: transparent; }
  .nav-btn:active { transform: scale(0.88) !important; opacity: .7; }

  .plus-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s; -webkit-tap-highlight-color: transparent; }
  .plus-btn:active { transform: scale(0.88) translateY(2px) !important; }

  .list-item { transition: background .12s; -webkit-tap-highlight-color: transparent; }
  .list-item:active { background: #f8fafc !important; }

  .pill-btn { transition: all .15s; -webkit-tap-highlight-color: transparent; }
  .pill-btn:active { transform: scale(.94); }

  input { -webkit-appearance: none; }
  button { -webkit-tap-highlight-color: transparent; }
`

export default function Layout() {
  const t = useT()
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  const key = location.pathname

  useEffect(() => { prevPath.current = location.pathname }, [location.pathname])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      maxWidth: 430, margin: '0 auto', background: '#F0F2F5',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{CSS}</style>

      <div key={key} className="page-enter" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ErrorBoundary key={key}>
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={{
        display: 'flex', alignItems: 'flex-end',
        background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 4px)',
        paddingTop: 6,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        position: 'relative', zIndex: 50,
      }}>
        {NAV.map((item) => {
          if (!item.Icon) {
            return (
              <NavLink key={item.to} to={item.to} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', paddingBottom: 6,
              }}>
                <div className="plus-btn" style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(145deg, #22d05a, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -22,
                  boxShadow: '0 6px 20px rgba(21,128,61,0.5), 0 2px 8px rgba(21,128,61,0.3)',
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
            <NavLink key={item.to} to={item.to} className="nav-btn" style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, paddingBottom: 4,
              textDecoration: 'none', paddingTop: 4, position: 'relative',
            }}>
              {/* active indicator bar */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: active ? 24 : 0, height: 3, borderRadius: '0 0 6px 6px',
                background: 'linear-gradient(90deg, #22d05a, #15803d)',
                transition: 'width .25s cubic-bezier(.34,1.56,.64,1)',
              }} />

              {/* icon wrapper */}
              <div style={{
                width: 42, height: 32, borderRadius: 12,
                background: active ? '#f0fdf4' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .2s',
              }}>
                <Icon active={active} />
              </div>

              <span style={{
                fontSize: 10, fontWeight: active ? 700 : 500,
                color: active ? '#15803d' : '#94a3b8',
                transition: 'color .2s',
                letterSpacing: active ? '-.01em' : 0,
              }}>{t(item.labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
