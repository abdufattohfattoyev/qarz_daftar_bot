import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import Home from './pages/Home'
import Contacts from './pages/Contacts'
import Stats from './pages/Stats'
import AddDebt from './pages/AddDebt'
import Settings from './pages/Settings'
import DebtDetail from './pages/DebtDetail'
import PayDebt from './pages/PayDebt'
import Layout from './components/Layout'

export default function App() {
  const { init, loading, user, needDevLogin, devLogin } = useAuthStore()

  useEffect(() => { init() }, [])

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F5F6F8'
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📒</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Qarz daftar</div>
      <div style={{ fontSize: 13, color: '#aaa', marginTop: 6 }}>Yuklanmoqda...</div>
    </div>
  )

  if (needDevLogin) return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', gap: 16
    }}>
      <div style={{ fontSize: 48 }}>📒</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Qarz daftar</div>
      <div style={{ fontSize: 13, color: '#aaa', textAlign: 'center', maxWidth: 260 }}>
        Ilovani Telegram orqali oching yoki test sifatida kiring
      </div>
      <button
        onClick={devLogin}
        style={{
          marginTop: 8, padding: '14px 32px', borderRadius: 16, border: 'none',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer'
        }}>
        Test sifatida kirish
      </button>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contacts" element={<Contacts />} />
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
