import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useDebtStore, useContactStore } from '../store'
import { initials, haptic } from '../utils'
import { statsAPI, authAPI, adminAPI } from '../api'
import { CurrencyIcon, GlobeIcon, BellIcon, ExcelIcon, DeleteAllIcon } from '../components/Icons'
import PinPad from '../components/PinPad'
import PhoneVerify from '../components/PhoneVerify'
import AskNameSheet from '../components/AskNameSheet'
import { useT } from '../i18n'
import { useTheme } from '../theme'

export default function Settings() {
  const t = useT()
  const c = useTheme()
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [modal, setModal] = useState(null) // 'currency' | 'language' | 'theme' | 'delete'
  const [sending, setSending] = useState('')   // '' | 'excel' | 'image' | 'summary'
  const [toast, setToast] = useState('')
  const [pinMode, setPinMode] = useState(null)  // null | 'set' | 'confirm' | 'disable'
  const [newPin, setNewPin] = useState('')
  const [pinErr, setPinErr] = useState('')
  const [pinBusy, setPinBusy] = useState(false)
  const [phoneVerify, setPhoneVerify] = useState(false)
  const [editName, setEditName] = useState(false)
  const [smsMode, setSmsMode] = useState(user?.sms_mode || 'all')
  const [supportUrl, setSupportUrl] = useState('')

  // Qo'llab-quvvatlash — botning support oqimiga (shaxsiy lichkaga emas)
  useEffect(() => {
    authAPI.appMeta().then(({ data }) => { if (data?.support_url) setSupportUrl(data.support_url) }).catch(() => {})
  }, [])

  // Admin: SMS rejimini o'zgartirish — 'all' | 'selected' | 'off'
  const changeSmsMode = async (mode) => {
    if (mode === smsMode) return
    haptic('light')
    const prev = smsMode
    setSmsMode(mode)   // optimistic
    try {
      const { data } = await adminAPI.setSmsMode(mode)
      if (data?.sms_mode) {
        setSmsMode(data.sms_mode)
        useAuthStore.setState({ user: { ...user, sms_mode: data.sms_mode } })
        haptic('success'); setToast(t('saved'))
      } else {
        setSmsMode(prev); haptic('error'); setToast(t('backend_update_needed'))
      }
    } catch {
      setSmsMode(prev); haptic('error'); setToast(t('save_failed'))
    }
    setTimeout(() => setToast(''), 2600)
  }

  const closePin = () => { setPinMode(null); setNewPin(''); setPinErr(''); setPinBusy(false) }

  const handlePinToggle = () => {
    haptic('light')
    setPinErr('')
    if (user?.has_pin) setPinMode('disable')
    else setPinMode('set')
  }

  const onPinEntered = async (pin) => {
    setPinErr('')
    if (pinMode === 'set') {
      setNewPin(pin)
      setPinMode('confirm')
      return
    }
    if (pinMode === 'confirm') {
      if (pin !== newPin) { setPinErr(t('pin_mismatch')); return }
      setPinBusy(true)
      try {
        await authAPI.setPin(pin)
        useAuthStore.setState({ user: { ...user, has_pin: true } })
        haptic('success'); setToast(t('pin_on')); closePin()
        setTimeout(() => setToast(''), 2500)
      } catch (e) { setPinErr(e.response?.data?.error || t('err_generic')); setPinBusy(false) }
      return
    }
    if (pinMode === 'disable') {
      setPinBusy(true)
      try {
        const { data } = await authAPI.disablePin(pin)
        if (data.ok) {
          useAuthStore.setState({ user: { ...user, has_pin: false } })
          sessionStorage.removeItem('pin_ok')
          haptic('success'); setToast(t('pin_off')); closePin()
          setTimeout(() => setToast(''), 2500)
        } else { setPinErr(t('pin_wrong')); setPinBusy(false) }
      } catch (e) { setPinErr(e.response?.data?.error || t('pin_wrong')); setPinBusy(false) }
    }
  }

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
      const d = e.response?.data
      setToast(d?.error || `[${e.response?.status || 'net'}] ${t('err_generic')}`)
    } finally {
      setSending('')
      setTimeout(() => setToast(''), 2500)
    }
  }

  const save = (key, val) => {
    haptic('light')
    setModal(null)
    // updateUser: lokal saqlash + optimistic UI + best-effort backend sync
    updateUser({ [key]: val }).catch(() => {})
  }

  const openSupport = () => {
    haptic('light')
    const url = supportUrl || 'https://t.me/Qarz_Yordamchi_Bot?start=support'
    const tg = window.Telegram?.WebApp
    if (tg?.openTelegramLink) tg.openTelegramLink(url)
    else window.open(url, '_blank')
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
  const themes = [
    { val: 'light', label: t('theme_light'), icon: '☀️' },
    { val: 'dark',  label: t('theme_dark'),  icon: '🌙' },
    { val: 'auto',  label: t('theme_auto'),  icon: '🔄', hint: t('theme_auto_hint') },
  ]
  const themeLabel = (user?.theme === 'dark' ? t('theme_dark') : user?.theme === 'auto' ? t('theme_auto') : t('theme_light'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: c.bg }}>
      <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: c.text, letterSpacing: -0.5 }}>{t('settings_title')}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px' }}>

        {/* Profile card */}
        <div style={{ margin: '4px 16px 20px', background: 'linear-gradient(135deg,#0a4d26,#16a34a 60%,#22c55e)', borderRadius: 22, padding: '20px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,.22)', border: '2px solid rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {initials(user?.display_name || 'U')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.display_name || '—'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.telegram_username ? `@${user.telegram_username}` : t('tg_user')}
              </div>
            </div>
          </div>
          {/* chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.16)', borderRadius: 10, padding: '6px 11px' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{t('currency')}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{user?.currency || 'UZS'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.16)', borderRadius: 10, padding: '6px 11px' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{t('language')}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{user?.language === 'ru' ? 'RU' : 'UZ'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.16)', borderRadius: 10, padding: '6px 11px' }}>
              <span style={{ fontSize: 12 }}>{user?.notifications_enabled ? '🔔' : '🔕'}</span>
            </div>
          </div>
        </div>

        {/* Admin panel — faqat admin uchun */}
        {user?.is_admin && (
          <div onClick={() => { haptic('light'); navigate('/admin') }} style={{
            margin: '4px 16px 8px', padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
            background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 4px 14px rgba(15,23,42,.25)',
          }}>
            <div style={{ fontSize: 22 }}>🛡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Admin panel</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)' }}>Statistika · foydalanuvchilar · xabar</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="rgba(255,255,255,.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}

        {/* Admin: SMS rejimi (Hammaga / Tanlangan / O'chiq) */}
        {user?.is_admin && (
          <>
            <SectionLabel c={c}>{t('admin_sms_section')}</SectionLabel>
            <Card c={c}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px 10px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><SmsIcon /></div>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: c.text }}>{t('admin_sms_toggle')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: '0 16px 10px' }}>
                {[
                  { v: 'all', label: t('sms_mode_all') },
                  { v: 'selected', label: t('sms_mode_selected') },
                  { v: 'off', label: t('sms_mode_off') },
                ].map((o) => {
                  const on = smsMode === o.v
                  const col = o.v === 'off' ? '#ef4444' : '#16a34a'
                  return (
                    <button key={o.v} onClick={() => changeSmsMode(o.v)} className="pill-btn" style={{
                      padding: '9px 4px', borderRadius: 11, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      border: on ? `1.5px solid ${col}` : `1.5px solid ${c.borderStrong}`,
                      background: on ? (o.v === 'off' ? c.redSoft : c.greenSoft) : c.card,
                      color: on ? col : c.text2,
                    }}>{o.label}</button>
                  )
                })}
              </div>
              <div style={{ padding: '0 16px 12px', fontSize: 11.5, color: c.muted, lineHeight: 1.5 }}>
                {smsMode === 'selected' ? t('admin_sms_hint_selected')
                  : smsMode === 'off' ? t('admin_sms_hint_off')
                  : t('admin_sms_hint_all')}
              </div>
            </Card>
          </>
        )}

        {/* App settings */}
        <SectionLabel c={c}>{t('app_settings')}</SectionLabel>
        <Card c={c}>
          <Row c={c} icon={<CurrencyIcon />} label={t('currency')} value={user?.currency} onClick={() => { haptic('light'); setModal('currency') }} />
          <Divider c={c} />
          <Row c={c} icon={<GlobeIcon />} label={t('language')} value={user?.language === 'ru' ? t('lang_ru_short') : t('lang_uz_short')} onClick={() => { haptic('light'); setModal('language') }} />
          <Divider c={c} />
          {/* Ko'rinish — kunduzgi / tungi / avtomatik */}
          <Row c={c} icon={<ThemeIcon dark={c.dark} />} label={t('theme')} value={themeLabel} onClick={() => { haptic('light'); setModal('theme') }} />
          <Divider c={c} />
          <ToggleRow c={c}
            icon={<BellIcon />} label={t('notifications')}
            checked={user?.notifications_enabled}
            onChange={() => {
              haptic('light')
              updateUser({ notifications_enabled: !user?.notifications_enabled }).catch(() => {})
            }}
          />
          <Divider c={c} />
          <ToggleRow c={c}
            icon={<LockIcon />} label={t('pin_lock')}
            checked={!!user?.has_pin}
            onChange={handlePinToggle}
          />
          <Divider c={c} />
          {/* Haqiqiy ism — SMS'da qarzdor shuni ko'radi (TG profil nomi emas) */}
          <Row c={c}
            icon={<NameIcon />} label={t('name_label')}
            value={user?.real_name || '—'}
            onClick={() => { haptic('light'); setEditName(true) }}
          />
          <Divider c={c} />
          {user?.phone_verified ? (
            /* Tasdiqlangan — faqat raqam + ✓ ko'rsatamiz, qayta so'ramaymiz */
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PhoneIcon /></div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: c.text }}>{t('phone_verify_row')}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: c.text, whiteSpace: 'nowrap' }}>{user?.phone || '—'}</span>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </span>
            </div>
          ) : (
            <Row c={c}
              icon={<PhoneIcon />} label={t('phone_verify_row')}
              value={user?.phone || '—'}
              onClick={() => { haptic('light'); setPhoneVerify(true) }}
            />
          )}
        </Card>

        {/* Data */}
        <SectionLabel c={c}>{t('data')}</SectionLabel>
        <Card c={c}>
          <Row c={c} icon={<ExcelIcon />} label={t('excel_to_tg')} value={sending === 'excel' ? '⏳' : '📤'} onClick={() => sendReport('excel')} />
          <Divider c={c} />
          <Row c={c} icon={<ExcelIcon />} label={t('image_to_tg')} value={sending === 'image' ? '⏳' : '🖼'} onClick={() => sendReport('image')} />
          <Divider c={c} />
          {/* Umumiy ma'lumot — barcha qarzdorlar ro'yxati tagma-tag */}
          <Row c={c} icon={<ListIcon />} label={t('summary_to_tg')} value={sending === 'summary' ? '⏳' : '📋'} onClick={() => sendReport('summary')} />
          <Divider c={c} />
          <Row c={c} icon={<DeleteAllIcon />} label={t('delete_all')} danger onClick={() => { haptic('medium'); setModal('delete') }} />
        </Card>

        {/* Support */}
        <SectionLabel c={c}>{t('support')}</SectionLabel>
        <Card c={c}>
          <Row c={c} icon={<SupportIcon />} label={t('support_label')} value="" onClick={openSupport} />
        </Card>

        {/* App version */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>📒</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.muted }}>{t('app_name')}</div>
          <div style={{ fontSize: 11, color: c.faint, marginTop: 2 }}>v1.0</div>
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

      {/* PIN MODAL — to'liq ekran */}
      {pinMode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: c.bg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
            <button onClick={closePin} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: c.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: c.shadowSm }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px 24px' }}>
            <PinPad
              title={pinMode === 'set' ? t('pin_new') : pinMode === 'confirm' ? t('pin_confirm') : t('pin_current')}
              sub={pinMode === 'disable' ? t('pin_disable_sub') : t('pin_set_sub')}
              error={pinErr}
              busy={pinBusy}
              onComplete={onPinEntered}
            />
          </div>
        </div>
      )}

      {/* ISMNI TAHRIRLASH */}
      {editName && (
        <AskNameSheet
          initialName={user?.real_name || ''}
          onClose={() => setEditName(false)}
          onSubmit={async (name) => {
            await updateUser({ real_name: name })
            setEditName(false)
            haptic('success'); setToast(t('saved'))
            setTimeout(() => setToast(''), 2000)
          }}
        />
      )}

      {/* TELEFON TASDIQLASH */}
      {phoneVerify && (
        <PhoneVerify
          initialPhone={user?.phone || ''}
          onClose={() => setPhoneVerify(false)}
          onVerified={(u) => {
            useAuthStore.getState().setVerified(u)
            setPhoneVerify(false)
            haptic('success'); setToast(t('phone_verified_toast'))
            setTimeout(() => setToast(''), 2500)
          }}
        />
      )}

      {/* MODALS */}
      {modal && modal !== 'delete' && <BottomSheet c={c} onClose={() => setModal(null)}>
        {modal === 'currency' && (
          <>
            <SheetTitle c={c}>{t('choose_currency')}</SheetTitle>
            {currencies.map(cu => (
              <SheetOption key={cu.val} c={c} onSelect={() => save('currency', cu.val)} active={user?.currency === cu.val}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: cu.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: cu.color }}>{cu.code}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: c.text, flex: 1 }}>{cu.label}</span>
                <span style={{ fontSize: 13, color: c.muted, fontWeight: 600 }}>{cu.val}</span>
              </SheetOption>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}

        {modal === 'language' && (
          <>
            <SheetTitle c={c}>{t('choose_lang')}</SheetTitle>
            {languages.map(l => (
              <SheetOption key={l.val} c={c} onSelect={() => save('language', l.val)} active={user?.language === l.val}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#374151' }}>{l.icon}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: c.text, flex: 1 }}>{l.label}</span>
              </SheetOption>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}

        {modal === 'theme' && (
          <>
            <SheetTitle c={c}>{t('choose_theme')}</SheetTitle>
            {themes.map(th => (
              <SheetOption key={th.val} c={c} onSelect={() => save('theme', th.val)} active={(user?.theme || 'light') === th.val}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: c.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                  {th.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{th.label}</div>
                  {th.hint && <div style={{ fontSize: 11.5, color: c.muted, marginTop: 1 }}>{th.hint}</div>}
                </div>
              </SheetOption>
            ))}
            <div style={{ height: 20 }} />
          </>
        )}
      </BottomSheet>}

      {/* TANLAB O'CHIRISH — alohida komponent (kategoriyalar bilan) */}
      {modal === 'delete' && (
        <DeleteSheet c={c} onClose={() => setModal(null)} onDone={() => {
          setModal(null); haptic('success'); setToast(t('del_done'))
          setTimeout(() => setToast(''), 2500)
        }} />
      )}
    </div>
  )
}

// ── Tanlab o'chirish oynasi ─────────────────────────────────────────
// Bilmasdan bosilsa hamma narsa ketmasin — avval nima o'chishini ko'rsatamiz,
// foydalanuvchi bo'limlarni belgilaydi, keyin tasdiqlaydi.
function DeleteSheet({ c, onClose, onDone }) {
  const t = useT()
  const [preview, setPreview] = useState(null)
  const [picked, setPicked] = useState({})
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    statsAPI.deletePreview().then(({ data }) => setPreview(data)).catch(() => setPreview({}))
  }, [])

  const OPTIONS = [
    { key: 'active_debts',   label: t('del_active_debts'),   count: preview?.active_debts,   danger: true },
    { key: 'paid_debts',     label: t('del_paid_debts'),     count: preview?.paid_debts },
    { key: 'empty_contacts', label: t('del_empty_contacts'), count: preview?.empty_contacts },
    { key: 'contacts',       label: t('del_contacts'),       count: preview?.contacts,       danger: true },
    { key: 'sms_logs',       label: t('del_sms_logs'),       count: preview?.sms_logs },
  ]

  const scopes = Object.keys(picked).filter((k) => picked[k])
  const toggle = (k) => { haptic('light'); setPicked((p) => ({ ...p, [k]: !p[k] })) }

  const doDelete = async () => {
    if (busy || scopes.length === 0) return
    setBusy(true)
    try {
      await statsAPI.deleteAll(scopes)
      // Lokal holatni yangilaymiz (qarz/kontakt o'chgan bo'lishi mumkin)
      useDebtStore.getState().fetchDebts()
      useContactStore.getState().fetchContacts()
      onDone()
    } catch { haptic('error') }
    finally { setBusy(false) }
  }

  return (
    <BottomSheet c={c} onClose={onClose}>
      {!confirm ? (
        <div style={{ padding: '0 18px 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: c.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <DeleteAllIcon />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, textAlign: 'center', marginBottom: 6 }}>{t('delete_pick_title')}</div>
          <div style={{ fontSize: 13, color: c.text2, textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>{t('delete_pick_desc')}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {OPTIONS.map((o) => {
              const on = !!picked[o.key]
              const disabled = preview && !o.count
              return (
                <button key={o.key} disabled={disabled} onClick={() => toggle(o.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 14,
                  border: `1.5px solid ${on ? (o.danger ? c.redBorder : c.greenBorder) : c.borderStrong}`,
                  background: on ? (o.danger ? c.redSoft : c.greenSoft) : c.card,
                  cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  opacity: disabled ? 0.45 : 1, width: '100%',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    border: `2px solid ${on ? (o.danger ? '#ef4444' : '#16a34a') : c.borderStrong}`,
                    background: on ? (o.danger ? '#ef4444' : '#16a34a') : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: o.danger ? '#ef4444' : c.text }}>{o.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.muted }}>
                    {preview ? t('records_n', { n: o.count || 0 }) : '…'}
                  </span>
                </button>
              )
            })}
          </div>

          <button onClick={onClose} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: c.chip, color: c.text, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>{t('cancel_full')}</button>
          <button onClick={() => scopes.length ? setConfirm(true) : haptic('error')} disabled={scopes.length === 0} style={{
            width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none',
            background: scopes.length ? '#ef4444' : c.chip, color: scopes.length ? '#fff' : c.muted,
            cursor: scopes.length ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>
            {scopes.length ? t('del_selected_n', { n: scopes.length }) : t('del_nothing_picked')}
          </button>
        </div>
      ) : (
        <div style={{ padding: '4px 18px 20px' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: c.redSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, textAlign: 'center', marginBottom: 8 }}>{t('delete_confirm_title')}</div>
          <div style={{ fontSize: 14, color: c.text2, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
            {OPTIONS.filter((o) => picked[o.key]).map((o) => o.label).join(' · ')}
          </div>
          <button onClick={() => setConfirm(false)} disabled={busy} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: c.chip, color: c.text, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>{t('cancel_full')}</button>
          <button onClick={doDelete} disabled={busy} style={{ width: '100%', padding: 15, borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            {busy ? t('deleting') : t('yes_delete')}
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="8" rx="2.5" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="13" r="1.2" fill="#16a34a"/>
    </svg>
  )
}

function ThemeIcon({ dark }) {
  return dark ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M16 11.5A6.5 6.5 0 018.5 4a6.5 6.5 0 108 7.5z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M7 5.5h9M7 10h9M7 14.5h9" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="4" cy="5.5" r="1" fill="#16a34a"/><circle cx="4" cy="10" r="1" fill="#16a34a"/><circle cx="4" cy="14.5" r="1" fill="#16a34a"/>
    </svg>
  )
}

function SmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 4.5h14v9H8l-3.5 3v-3H3z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6.5 9h7M6.5 6.5h7" stroke="#16a34a" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function NameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3.2" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M4 16.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="6" y="2.5" width="8" height="15" rx="2.5" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M9 15h2" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SupportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5c-4 0-7 2.8-7 6.4 0 1.9.9 3.6 2.3 4.8L4.8 17l3.1-1.4c.7.15 1.4.23 2.1.23 4 0 7-2.8 7-6.4S14 2.5 10 2.5z" stroke="#16a34a" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="7" cy="9" r="1" fill="#16a34a"/><circle cx="10" cy="9" r="1" fill="#16a34a"/><circle cx="13" cy="9" r="1" fill="#16a34a"/>
    </svg>
  )
}

function SectionLabel({ children, c }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: c.muted, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 20px 8px' }}>
      {children}
    </div>
  )
}

function Card({ children, c }) {
  return (
    <div style={{ margin: '0 16px 16px', background: c.card, borderRadius: 20, overflow: 'hidden', border: `0.5px solid ${c.border}`, boxShadow: c.shadowSm }}>
      {children}
    </div>
  )
}

function Divider({ c }) {
  return <div style={{ height: '0.5px', background: c.border, marginLeft: 58 }} />
}

function Row({ icon, label, value, onClick, danger, c }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: danger ? '#ef4444' : c.text }}>{label}</span>
      <span style={{ fontSize: 13, color: c.muted }}>{value} ›</span>
    </button>
  )
}

function ToggleRow({ icon, label, checked, onChange, c }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: c.text }}>{label}</span>
      <button onClick={onChange} style={{
        width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: checked ? '#22c55e' : c.borderStrong, transition: 'background .2s'
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
function BottomSheet({ onClose, children, c }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 998, background: c.overlay, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: c.sheetBg, borderRadius: '22px 22px 0 0', paddingBottom: 'env(safe-area-inset-bottom, 20px)', maxHeight: '82vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, background: c.borderStrong, borderRadius: 2, margin: '12px auto 18px' }} />
        {children}
      </div>
    </div>
  )
}

function SheetTitle({ children, c }) {
  return <div style={{ fontSize: 16, fontWeight: 800, color: c.text, padding: '0 20px 12px' }}>{children}</div>
}

function SheetOption({ onSelect, active, children, c }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px', cursor: 'pointer', border: 'none',
        borderBottom: `0.5px solid ${c.border}`, fontFamily: 'inherit',
        background: active ? c.greenSoft : 'transparent', textAlign: 'left',
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
