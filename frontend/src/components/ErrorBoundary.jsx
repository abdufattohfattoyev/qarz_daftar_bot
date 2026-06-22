import React from 'react'

// Render xatosini ushlab, butun ilova oq ekranga aylanishining oldini oladi.
// Foydalanuvchiga tushunarli ekran + "Qayta yuklash" tugmasini ko'rsatadi.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: '0 32px', textAlign: 'center', background: '#F0F2F5',
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>😕</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Nimadir xato ketdi
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
          Sahifani yangilang yoki keyinroq urinib ko'ring.
        </div>
        <button
          onClick={() => { this.handleReset(); window.location.reload() }}
          style={{
            padding: '12px 28px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 5px 16px rgba(22,163,74,.3)',
          }}
        >
          Qayta yuklash
        </button>
      </div>
    )
  }
}
