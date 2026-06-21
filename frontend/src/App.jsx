import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { useT } from './i18n'
import Home from './pages/Home'
import Contacts from './pages/Contacts'
import Stats from './pages/Stats'
import AddDebt from './pages/AddDebt'
import Settings from './pages/Settings'
import DebtDetail from './pages/DebtDetail'
import PayDebt from './pages/PayDebt'
import ContactDetail from './pages/ContactDetail'
import Layout from './components/Layout'

export default function App() {
  const { init, loading, user, needDevLogin, devLogin } = useAuthStore()
  const t = useT()

  useEffect(() => { init() }, [])

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F5F6F8'
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📒</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{t('app_name')}</div>
      <div style={{ fontSize: 13, color: '#aaa', marginTop: 6 }}>{t('loading')}</div>
    </div>
  )

  if (needDevLogin) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', gap: 0,
      padding: '0 32px',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📒</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 10 }}>{t('app_name')}</div>
      <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        {t('dev_hint')}
      </div>
      <a
        href="https://t.me/Qarz_Yordamchi_Bot"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 28px', borderRadius: 16, textDecoration: 'none',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
          fontSize: 15, fontWeight: 700,
          boxShadow: '0 6px 20px rgba(22,163,74,0.35)',
        }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.94.44l-2.6-1.92-1.26 1.2c-.14.14-.26.26-.52.26l.18-2.6 4.74-4.28c.2-.18-.04-.28-.32-.1L7.74 14.6l-2.52-.78c-.55-.17-.56-.55.12-.82l9.84-3.8c.46-.16.86.1.46.6z"/>
        </svg>
        {t('open_bot')}
      </a>
      {import.meta.env.DEV && (
        <button onClick={devLogin} style={{
          marginTop: 16, padding: '10px 24px', borderRadius: 12, border: '1.5px solid #e5e7eb',
          background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {t('dev_login')}
        </button>
      )}
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/add" element={<AddDebt />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/debt/:id" element={<DebtDetail />} />
          <Route path="/debt/:id/pay" element={<PayDebt />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
