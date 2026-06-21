import React, { useState } from 'react'
import { useAuthStore, useDebtStore, useContactStore } from '../store'
import { initials, haptic } from '../utils'
import { statsAPI } from '../api'
import { CurrencyIcon, GlobeIcon, BellIcon, ExcelIcon, DeleteAllIcon } from '../components/Icons'
import { useT } from '../i18n'

export default function Settings() {
  const t = useT()
  const { user, updateUser } = useAuthStore()
  const [modal, setModal] = useState(null) // 'currency' | 'language' | 'delete'
  const [deleting, setDeleting] = useState(false)
  const [sending, setSending] = useState('')   // '' | 'excel' | 'image'
  const [toast, setToast] = useState('')

  const sendReport = async (format) => {
    if (sending) return
    haptic('light')
    setSending(format)
    try {
      await statsAPI.send(format)
      haptic('success')
      setToast(t('sent_to_tg'))
    } catch (e) {
      haptic('error')
      setToast(e.response?.data?.error || t('err_generic'))
    } finally {
      setSending('')
      setTimeout(() => setToast(''), 2500)
    }
  }

  const handleDeleteAll = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await statsAPI.deleteAll()
      useDebtStore.setState({ debts: [] })
      useContactStore.setState({ contacts: [] })
      haptic('success')
    } catch { haptic('error') }
    finally { setDeleting(false); setModal(null) }
  }

  const save = (key, val) => {
    haptic('light')
    setModal(null)
    // updateUser: lokal saqlash + optimistic UI + best-effort backend sync
    updateUser({ [key]: val }).catch(() => {})
  }

  const exportExcel = async () => {
    haptic('light')
    try {
      const res = await statsAPI.export()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'qarz_daftar.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { }
  }

  const currencies = [
    { val: 'UZS', label: t('cur_som'), code: 'UZS', bg: '#fef9c3', color: '#92400e' },
    { val: 'USD', label: t('cur_dollar'), code: '$', bg: '#dcfce7', color: '#166534' },
    { val: 'RUB', label: t('cur_ruble'), code: '₽', bg: '#dbeafe', color: '#1e40af' },
  ]
  const languages = [
    { val: 'uz', label: "O'zbek tili", icon: 'UZ', bg: '#fef9c3' },
    { val: 'ru', label: 'Русский язык', icon: 'RU', bg: '#fee2e2' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>
      <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>{t('settings_title')}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px' }}>

        {/* Profile card */}
        <div style={{ margin: '4px 16px 20px', background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 22, padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,.22)', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {initials(user?.display_name || 'U')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name || '—'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>
              {user?.telegram_username ? `@${user.telegram_username}` : t('tg_user')}
            </div>
          </div>
        </div>

        {/* App settings */}
        <SectionLabel>{t('app_settings')}</SectionLabel>
        <Card>
          <Row icon={<CurrencyIcon />} label={t('currency')} value={user?.currency} onClick={() => { haptic('light'); setModal('currency') }} />
          <Divider />
          <Row icon={<GlobeIcon />} label={t('language')} value={user?.language === 'ru' ? t('lang_ru_short') : t('lang_uz_short')} onClick={() => { haptic('light'); setModal('language') }} />
          <Divider />
          <ToggleRow
            icon={<BellIcon />} label={t('notifications')}
            checked={user?.notifications_enabled}
            onChange={() => {
              haptic('light')
              updateUser({ notifications_enabled: !user?.notifications_enabled }).catch(() => {})
            }}
          />
        </Card>

        {/* Data */}
        <SectionLabel>{t('data')}</SectionLabel>
        <Card>
          <Row icon={<ExcelIcon />} label={t('excel_to_tg')} value={sending === 'excel' ? '⏳' : '📤'} onClick={() => sendReport('excel')} />
          <Divider />
          <Row icon={<ExcelIcon />} label={t('image_to_tg')} value={sending === 'image' ? '⏳' : '🖼'} onClick={() => sendReport('image')} />
          <Divider />
          <Row icon={<ExcelIcon />} label={t('excel_download')} value="⬇" onClick={exportExcel} />
          <Divider />
          <Row icon={<DeleteAllIcon />} label={t('delete_all')} danger onClick={() => { haptic('medium'); setModal('delete') }} />
        </Card>

        {/* App version */}
        <div style={{ textAlign: 'center', color: '#c0c0c0', fontSize: 12, marginTop: 24 }}>
          {t('app_name')} v1.0
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', padding: '11px 20px', borderRadius: 14,
          fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: '0 6px 20px rgba(0,0,0,.3)',
          maxWidth: '85%', textAlign: 'center',
        }}>{toast}</div>
      )}

      {/* MODALS */}
      {modal && <BottomSheet onClose={() => setModal(null)}>
        {modal === 'currency' && (
          <>
            <SheetTitle>{t('choose_currency')}</SheetTitle>
            {currencies.map(c => (
              <SheetOption
                key={c.val}
                onSelect={() => save('currency', c.val)}
                active={user?.currency === c.val}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.code}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{c.val}</span>
              </SheetOption>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}

        {modal === 'language' && (
          <>
            <SheetTitle>{t('choose_lang')}</SheetTitle>
            {languages.map(l => (
              <SheetOption
                key={l.val}
                onSelect={() => save('language', l.val)}
                active={user?.language === l.val}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#374151' }}>{l.icon}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111', flex: 1 }}>{l.label}</span>
              </SheetOption>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}

        {modal === 'delete' && (
          <div style={{ padding: '0 18px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <DeleteAllIcon />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>{t('delete_confirm_title')}</div>
            <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              {t('delete_confirm_desc')}
            </div>
            <SheetBtn onClick={() => setModal(null)} style={{ background: '#f3f4f6', color: '#111', marginBottom: 10 }}>{t('cancel_full')}</SheetBtn>
            <SheetBtn onClick={handleDeleteAll} style={{ background: '#ef4444', color: '#fff' }}>
              {deleting ? t('deleting') : t('yes_delete')}
            </SheetBtn>
          </div>
        )}
      </BottomSheet>}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0b0', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 20px 8px' }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ margin: '0 16px 16px', background: '#fff', borderRadius: 20, overflow: 'hidden', border: '0.5px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.06)', marginLeft: 58 }} />
}

function Row({ icon, label, value, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: danger ? '#ef4444' : '#111' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#bbb' }}>{value} ›</span>
    </button>
  )
}

function ToggleRow({ icon, label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#111' }}>{label}</span>
      <button onClick={onChange} style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: checked ? '#22c55e' : '#e5e7eb', transition: 'background .2s'
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  )
}

// ── BOTTOM SHEET COMPONENTS ─────────────────────────────────────────
// Plain onClick everywhere — reliable in Telegram webview.
// Backdrop closes only when the tap target IS the backdrop itself.
function BottomSheet({ onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 20px)', maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 18px' }} />
        {children}
      </div>
    </div>
  )
}

function SheetTitle({ children }) {
  return <div style={{ fontSize: 16, fontWeight: 800, color: '#111', padding: '0 20px 12px' }}>{children}</div>
}

function SheetOption({ onSelect, active, children }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px', cursor: 'pointer', border: 'none',
        borderBottom: '0.5px solid #f3f4f6', fontFamily: 'inherit',
        background: active ? '#f0fdf4' : '#fff', textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
      {active && (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </button>
  )
}

function SheetBtn({ onClick, style, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 16, fontWeight: 700, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'inherit', display: 'block', WebkitTapHighlightColor: 'transparent', ...style }}
    >
      {children}
    </button>
  )
}
