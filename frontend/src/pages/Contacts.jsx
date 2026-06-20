import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '../store'
import { initials, avatarColor, haptic } from '../utils'
import { SearchIcon, ChevronRight, ArrowUpIcon, ArrowDownIcon } from '../components/Icons'

const n = (v) => new Intl.NumberFormat('uz-UZ').format(Math.round(Math.abs(parseFloat(v || 0))))

const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M12.5 9.8c-.2-.2-.9-.6-1.3-.8-.4-.2-.7-.1-.9.1l-.5.6c-.2.2-.4.2-.6.1C8.4 9.3 7 8 6.3 7.1c-.2-.2-.1-.4.1-.6l.6-.5c.3-.2.3-.5.1-.9-.2-.4-.6-1.1-.9-1.3C5.9 3.5 5.7 3.5 5.5 3.6L4.8 4C4 4.5 3.7 5.4 4 6.4c.4 1.2 1.4 2.5 2.5 3.5 1 1 2.3 2.1 3.5 2.5 1 .4 1.9 0 2.4-.8l.4-.7c.1-.2.1-.4-.3-.6z" fill="#94a3b8"/>
  </svg>
)

const TABS = [
  { key: 'all',  label: 'Barchasi' },
  { key: 'gave', label: 'Menga qarzdor' },
  { key: 'got',  label: 'Men qarzdor' },
]

export default function Contacts() {
  const navigate = useNavigate()
  const { contacts, loading, fetchContacts, addContact } = useContactStore()
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', category: 'other' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchContacts() }, [])

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await addContact(form)
      haptic('success')
      setShowAdd(false)
      setForm({ name: '', phone: '', category: 'other' })
    } finally { setSaving(false) }
  }

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    if (!matchSearch) return false
    if (tab === 'gave') return c.balance_uzs > 0  // men bergandim — ular menga qazdor
    if (tab === 'got')  return c.balance_uzs < 0  // men olganman — men ularga qarzdor
    return true
  })

  // Summalar
  const totalGave = contacts.filter(c => c.balance_uzs > 0).reduce((s, c) => s + c.balance_uzs, 0)
  const totalGot  = contacts.filter(c => c.balance_uzs < 0).reduce((s, c) => s + Math.abs(c.balance_uzs), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 8px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Qarzdorlar</div>
          <button className="pill-btn" onClick={() => { haptic('light'); setShowAdd(true) }} style={{
            width: 34, height: 34, background: '#16a34a', border: 'none',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 3px 10px rgba(22,163,74,.3)',
          }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 3.5v11M3.5 9h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 12px' }}>
          <div style={{ background: '#f0fdf4', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
              <ArrowUpIcon />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Menga qarzdor</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{n(totalGave)}</p>
            </div>
          </div>
          <div style={{ background: '#fff1f2', borderRadius: 14, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
              <ArrowDownIcon />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>Men qarzdor</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{n(totalGot)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '0 16px 10px', padding: '9px 12px', background: '#f8fafc', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.06)' }}>
          <SearchIcon />
          <input
            placeholder="Ism yoki telefon..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#111', fontFamily: 'inherit', outline: 'none', flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#e5e7eb"/>
                <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 16px 12px', gap: 6 }}>
          {TABS.map(t => (
            <button key={t.key} className="pill-btn" onClick={() => { haptic('light'); setTab(t.key) }} style={{
              flex: t.key === 'all' ? 0 : 1, padding: '7px 12px',
              borderRadius: 10, border: 'none', fontFamily: 'inherit',
              background: tab === t.key ? '#0f172a' : '#f1f5f9',
              color: tab === t.key ? '#fff' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── LIST ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 90px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px' }}>
            <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
              <circle cx="35" cy="35" r="34" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
              <circle cx="35" cy="27" r="10" fill="#bbf7d0"/>
              <path d="M14 55c0-11.6 9.4-18 21-18s21 6.4 21 18" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {tab === 'all' ? 'Qarzdor yo\'q' : tab === 'gave' ? 'Sizga qarzdor yo\'q' : 'Siz qarzdor emassiz'}
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              {search ? `"${search}" topilmadi` : 'Yangi qarz qo\'shing'}
            </p>
            {!search && (
              <button className="pill-btn" onClick={() => navigate('/add')} style={{
                padding: '11px 24px', borderRadius: 13, border: 'none',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 5px 16px rgba(22,163,74,.3)',
              }}>+ Qarz qo'shish</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((contact, i) => {
            const av = avatarColor(contact.name)
            const bal = contact.balance_uzs || 0
            const isPos = bal > 0
            const isZero = bal === 0
            return (
              <div
                key={contact.id}
                className="list-item"
                onClick={() => { haptic('light'); navigate(`/contacts/${contact.id}`) }}
                style={{
                  background: '#fff', borderRadius: 17, padding: '12px 13px',
                  display: 'flex', alignItems: 'center', gap: 11,
                  boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                  cursor: 'pointer',
                  animation: `fadeUp .2s ${i * 0.03}s both`,
                  borderLeft: isZero ? '3px solid #e5e7eb' : isPos ? '3px solid #22c55e' : '3px solid #ef4444',
                }}>
                {/* avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: av.bg, color: av.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                  }}>{initials(contact.name)}</div>
                  {!isZero && (
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: isPos ? '#16a34a' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', color: '#fff',
                    }}>
                      {isPos ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </div>
                  )}
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {contact.phone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
                        <PhoneIcon />
                        <span style={{ fontSize: 11 }}>{contact.phone}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Telefon yo'q</span>
                    )}
                  </div>
                </div>

                {/* balance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isZero ? (
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>Balanssiz</span>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: -.3, color: isPos ? '#16a34a' : '#ef4444' }}>
                        {isPos ? '+' : '−'}{n(bal)}
                      </p>
                      <p style={{ margin: '1px 0 0', fontSize: 9, color: '#cbd5e1', fontWeight: 600 }}>UZS</p>
                    </>
                  )}
                </div>
                <ChevronRight />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ADD SHEET ── */}
      {showAdd && (
        <>
          <div onClick={() => setShowAdd(false)} onTouchEnd={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 98, backdropFilter: 'blur(3px)' }} />
          <div className="sheet-anim" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '22px 22px 0 0', zIndex: 99, paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div style={{ width: 34, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 16px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', padding: '0 16px 14px' }}>Yangi kontakt</div>
            {[
              { key: 'name',  label: 'Ism *',    placeholder: 'Ism familiya',    type: 'text' },
              { key: 'phone', label: 'Telefon',  placeholder: '+998 90 123 45 67', type: 'tel' },
            ].map(f => (
              <div key={f.key} style={{ padding: '0 16px', marginBottom: 11 }}>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 5, display: 'block' }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder}
                  value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 13, fontSize: 14, color: '#111', background: '#fafafa', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ padding: '0 16px', marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 7, display: 'block' }}>Kategoriya</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {[{ v: 'other', l: 'Boshqa' }, { v: 'family', l: 'Oila' }, { v: 'friends', l: "Do'st" }, { v: 'work', l: 'Ish' }].map(c => (
                  <button key={c.v} className="pill-btn" onClick={() => setForm(x => ({ ...x, category: c.v }))} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                    background: form.category === c.v ? '#16a34a' : '#f1f5f9',
                    color: form.category === c.v ? '#fff' : '#64748b',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{c.l}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, margin: '0 16px' }}>
              <button className="pill-btn" onClick={() => setShowAdd(false)} style={{ padding: 13, border: '1.5px solid #e5e7eb', borderRadius: 14, background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>Bekor</button>
              <button className="pill-btn" onClick={handleAdd} disabled={saving || !form.name.trim()} style={{
                padding: 13, border: 'none', borderRadius: 14,
                background: form.name.trim() ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e5e7eb',
                color: form.name.trim() ? '#fff' : '#9ca3af',
                fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
                boxShadow: form.name.trim() ? '0 4px 14px rgba(22,163,74,.3)' : 'none',
              }}>
                {saving ? 'Saqlanmoqda...' : '+ Kontakt qo\'shish'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
