import React, { useState } from 'react'
import { haptic } from '../utils'

// 4 xonali PIN kiritish — nuqtalar + raqamli klaviatura.
// onComplete(pin) 4 raqam kiritilganda chaqiriladi; keyin avtomatik tozalanadi.
export default function PinPad({ title, sub, error, onComplete, onForgot, busy }) {
  const [pin, setPin] = useState('')

  const press = (d) => {
    if (busy) return
    haptic('light')
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) {
      onComplete(next)
      setTimeout(() => setPin(''), 200)
    }
  }
  const back = () => { if (!busy) { haptic('light'); setPin((p) => p.slice(0, -1)) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18, textAlign: 'center' }}>{sub}</div>}

      {/* Dots */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, height: 18, alignItems: 'center' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: i < pin.length ? (error ? '#ef4444' : '#16a34a') : 'transparent',
            border: `2px solid ${i < pin.length ? (error ? '#ef4444' : '#16a34a') : '#cbd5e1'}`,
            transition: 'all .15s',
          }} />
        ))}
      </div>
      <div style={{ height: 18, marginBottom: 8, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{error || ''}</div>

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button key={d} onClick={() => press(String(d))} className="pill-btn" style={keyStyle}>{d}</button>
        ))}
        <div />
        <button onClick={() => press('0')} className="pill-btn" style={keyStyle}>0</button>
        <button onClick={back} className="pill-btn" style={{ ...keyStyle, fontSize: 22 }}>⌫</button>
      </div>

      {onForgot && (
        <button onClick={onForgot} style={{ marginTop: 22, background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Kodni unutdingizmi?
        </button>
      )}
    </div>
  )
}

const keyStyle = {
  height: 62, borderRadius: 18, border: '1.5px solid rgba(0,0,0,0.08)',
  background: '#fff', fontSize: 24, fontWeight: 700, color: '#0f172a',
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
