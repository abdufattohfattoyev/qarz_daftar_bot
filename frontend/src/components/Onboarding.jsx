import React, { useState, useRef } from 'react'
import { haptic } from '../utils'
import { useT } from '../i18n'

const PencilPlus = () => (
  <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
    <path d="M16 5l7 7-11 11-6 1 1-6L16 5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M21 21h6M24 18v6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)
const Bell = () => (
  <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
    <path d="M14 4a7 7 0 00-7 7c0 5-2 7-2 7h18s-2-2-2-7a7 7 0 00-7-7z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M11.5 22a2.5 2.5 0 005 0" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)
const Shield = () => (
  <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
    <path d="M14 4l9 3v6c0 6-4 9-9 11-5-2-9-5-9-11V7l9-3z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M10 14l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Onboarding({ onDone }) {
  const t = useT()
  const [i, setI] = useState(0)
  const startX = useRef(0)

  const slides = [
    { Icon: PencilPlus, title: t('ob1_title'), sub: t('ob1_sub') },
    { Icon: Bell,       title: t('ob2_title'), sub: t('ob2_sub') },
    { Icon: Shield,     title: t('ob3_title'), sub: t('ob3_sub') },
  ]
  const last = i === slides.length - 1

  const next = () => {
    haptic('light')
    if (last) onDone()
    else setI((v) => v + 1)
  }
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current
    if (dx < -40 && !last) setI((v) => v + 1)
    if (dx > 40 && i > 0) setI((v) => v - 1)
  }

  const s = slides[i]
  const Icon = s.Icon

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>

      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 18px' }}>
        <button onClick={onDone} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {t('ob_skip')}
        </button>
      </div>

      {/* Illustration */}
      <div style={{
        margin: '0 22px', borderRadius: 26, flex: '0 0 auto', height: 260,
        background: 'linear-gradient(160deg,#0a4d26,#16a34a 60%,#22c55e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
        <div style={{ position: 'absolute', left: -20, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div key={i} style={{ width: 92, height: 92, borderRadius: 28, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeUp .35s ease' }}>
          <Icon />
        </div>
      </div>

      {/* Text */}
      <div key={`t${i}`} style={{ padding: '28px 28px 0', textAlign: 'center', animation: 'fadeUp .3s ease' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>{i + 1}-qadam</div>
        <div style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5, marginBottom: 10 }}>{s.title}</div>
        <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{s.sub}</div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Dots */}
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 22 }}>
        {slides.map((_, k) => (
          <div key={k} style={{
            width: k === i ? 22 : 7, height: 7, borderRadius: 4,
            background: k === i ? '#16a34a' : '#e2e8f0', transition: 'all .25s',
          }} />
        ))}
      </div>

      {/* Button */}
      <div style={{ padding: '0 24px', paddingBottom: 'max(env(safe-area-inset-bottom), 28px)' }}>
        <button onClick={next} className="pill-btn" style={{
          width: '100%', padding: 16, border: 'none', borderRadius: 18,
          background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 20px rgba(22,163,74,.35)',
        }}>
          {last ? t('ob_start') : t('ob_next')}
        </button>
      </div>
    </div>
  )
}
