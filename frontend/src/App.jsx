import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import { authAPI } from './api'
import PinPad from './components/PinPad'
import PhoneVerify from './components/PhoneVerify'
import Onboarding from './components/Onboarding'
import { useT } from './i18n'
import Home from './pages/Home'
import Contacts from './pages/Contacts'
import Stats from './pages/Stats'
import AddDebt from './pages/AddDebt'
import Settings from './pages/Settings'
import DebtDetail from './pages/DebtDetail'
import PayDebt from './pages/PayDebt'
import ContactDetail from './pages/ContactDetail'
import EditDebt from './pages/EditDebt'
import AdminPanel from './pages/AdminPanel'
import CodeLogin from './components/CodeLogin'
import Layout from './components/Layout'

export default function App() {
  const { init, loading, user, needDevLogin, devLogin } = useAuthStore()
  const t = useT()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('pin_ok') === '1')
  const [pinErr, setPinErr] = useState('')
  const [pinBusy, setPinBusy] = useState(false)
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === '1')

  useEffect(() => { init() }, [])

  const tryUnlock = async (pin) => {
    setPinBusy(true); setPinErr('')
    try {
      const { data } = await authAPI.verifyPin(pin)
      if (data.ok) {
        sessionStorage.setItem('pin_ok', '1')
        setUnlocked(true)
      } else {
        setPinErr(t('pin_wrong'))
      }
    } catch {
      setPinErr(t('err_generic'))
    } finally { setPinBusy(false) }
  }

  const forgotPin = () => {
    const url = 'https://t.me/fattoyev_a'
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) tg.openTelegramLink(url)
    else window.open(url, '_blank')
  }

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

  // Telegram'siz (to'g'ridan-to'g'ri domen) — 6 xonali kod orqali kirish
  if (needDevLogin) return <CodeLogin />

  // ── Onboarding (faqat birinchi kirishda) ──
  if (user && !onboarded) return (
    <Onboarding onDone={() => { localStorage.setItem('onboarded', '1'); setOnboarded(true) }} />
  )

  // ── Telefonni tasdiqlash (MAJBURIY — REQUIRE_PHONE_VERIFICATION yoqilganda) ──
  // Yangi ham, oldin kirgan ham: phone_verified bo'lmaguncha ilovaga o'tolmaydi.
  if (user && user.require_phone_verify && !user.phone_verified) return (
    <PhoneVerify
      mandatory
      initialPhone={user.phone || ''}
      onVerified={(u) => useAuthStore.getState().setVerified(u)}
    />
  )

  // ── PIN qulf ──
  if (user?.has_pin && !unlocked) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5', padding: '0 24px' }}>
      <PinPad
        title={t('pin_enter')}
        sub={t('pin_enter_sub')}
        error={pinErr}
        busy={pinBusy}
        onComplete={tryUnlock}
        onForgot={forgotPin}
      />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin panel — to'liq ekran (faqat admin foydalanadi) */}
        <Route path="/admin" element={user?.is_admin ? <AdminPanel /> : <Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/add" element={<AddDebt />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/debt/:id" element={<DebtDetail />} />
          <Route path="/debt/:id/edit" element={<EditDebt />} />
          <Route path="/debt/:id/pay" element={<PayDebt />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
