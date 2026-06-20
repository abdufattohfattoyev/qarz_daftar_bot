import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '../store'
import { initials, avatarColor, haptic } from '../utils'
import { SearchIcon, ChevronRight } from '../components/Icons'

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M12.5 9.8c-.2-.2-.9-.6-1.3-.8-.4-.2-.7-.1-.9.1l-.5.6c-.2.2-.4.2-.6.1C8.4 9.3 7 8 6.3 7.1c-.2-.2-.1-.4.1-.6l.6-.5c.3-.2.3-.5.1-.9-.2-.4-.6-1.1-.9-1.3C5.9 3.5 5.7 3.5 5.5 3.6L4.8 4C4 4.5 3.7 5.4 4 6.4c.4 1.2 1.4 2.5 2.5 3.5 1 1 2.3 2.1 3.5 2.5 1 .4 1.9 0 2.4-.8l.4-.7c.1-.2.1-.4-.3-.6z" fill="#94a3b8"/>
  </svg>
)

const UserEmptyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="32" fill="#f0fdf4"/>
    <circle cx="32" cy="24" r="10" fill="#bbf7d0"/>
    <path d="M12 52c0-11 9-18 20-18s20 7 20 18" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const CATS = [
  { value: '', label: 'Hammasi' },
  { value: 'family', label: 'Qarindosh' },
  { value: 'friends', label: "Do'st" },
  { value: 'work', label: 'Ish' },
]

export default function Contacts() {
  const navigate = useNavigate()
  const { contacts, loading, fetchContacts, addContact, deleteContact } = useContactStore()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', category: 'other' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContacts({ search, category: category || undefined })
  }, [search, category])

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await addContact(form)
      haptic('success')
      setShowAdd(false)
      setForm({ name: '', phone: '', category: 'other' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Mijozlar</div>
        <button
          className="nav-btn"
          onClick={() => { haptic('light'); setShowAdd(true) }}
          style={{
            width: 36, height: 36, background: '#16a34a', border: 'none',
            borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 3px 10px rgba(22,163,74,.3)',
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3.5v11M3.5 9h11" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div style={{ margin: '0 14px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#fff', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
          <SearchIcon />
          <input
            placeholder="Ism yoki telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontSize: 14, color: '#111', fontFamily: 'inherit', outline: 'none', flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" fill="#e5e7eb"/>
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 14px 10px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
        {CATS.map((c) => {
          const active = category === c.value
          return (
            <button key={c.value} className="pill-btn" onClick={() => { haptic('light'); setCategory(c.value) }} style={{
              padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: active ? 700 : 500,
              border: 'none',
              background: active ? '#16a34a' : '#fff',
              color: active ? '#fff' : '#64748b',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
              boxShadow: active ? '0 3px 10px rgba(22,163,74,.25)' : '0 1px 4px rgba(0,0,0,.06)',
            }}>{c.label}</button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 100px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #dcfce7', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px' }}>
            <UserEmptyIcon />
            <p style={{ margin: '14px 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Mijoz topilmadi</p>
            <p style={{ margin: '0 0 22px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
              {search ? `"${search}" bo'yicha natija yo'q` : 'Birinchi mijozni qo\'shing'}
            </p>
            {!search && (
              <button className="pill-btn" onClick={() => setShowAdd(true)} style={{
                padding: '12px 28px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(22,163,74,.35)',
              }}>+ Mijoz qo'shish</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((contact, i) => {
            const av = avatarColor(contact.name)
            const bal = contact.balance_uzs || 0
            const isPos = bal > 0
            return (
              <div
                key={contact.id}
                className="list-item"
                onClick={() => { haptic('light'); navigate(`/contacts/${contact.id}`) }}
                style={{
                  background: '#fff', borderRadius: 18, padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 2px 10px rgba(0,0,0,.05)',
                  cursor: 'pointer',
                  animation: `fadeUp .25s ${i * 0.04}s both`,
                }}>
                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: 15,
                  background: av.bg, color: av.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 800, flexShrink: 0,
                }}>
                  {initials(contact.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contact.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                    <PhoneIcon />
                    <span style={{ fontSize: 12 }}>{contact.phone || '—'}</span>
                  </div>
                </div>

                {/* Balance */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {bal !== 0 ? (
                    <>
                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: isPos ? '#16a34a' : '#ef4444',
                        letterSpacing: -.3,
                      }}>
                        {isPos ? '+' : ''}{new Intl.NumberFormat('uz-UZ').format(bal)}
                      </div>
                      <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 500 }}>UZS</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>Qarz yo'q</div>
                  )}
                </div>
                <ChevronRight />
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Contact Sheet */}
      {showAdd && (
        <>
          <div
            onClick={() => setShowAdd(false)}
            onTouchEnd={() => setShowAdd(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 98, backdropFilter: 'blur(3px)' }}
          />
          <div className="sheet-anim" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#fff', borderRadius: '24px 24px 0 0',
            zIndex: 99, paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
          }}>
            <div style={{ width: 36, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 18px' }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111', padding: '0 18px 16px' }}>Yangi mijoz</div>

            {[
              { key: 'name', label: 'Ism *', placeholder: 'Ism familiya', type: 'text', icon: '👤' },
              { key: 'phone', label: 'Telefon', placeholder: '+998 90 123 45 67', type: 'tel', icon: '📱' },
            ].map((f) => (
              <div key={f.key} style={{ padding: '0 16px', marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6, display: 'block' }}>{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '13px 15px',
                    border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 14,
                    fontSize: 15, color: '#111', background: '#fafafa',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {/* Category */}
            <div style={{ padding: '0 16px', marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8, display: 'block' }}>Kategoriya</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: 'other', l: 'Boshqa' }, { v: 'family', l: 'Oila' }, { v: 'friends', l: "Do'st" }, { v: 'work', l: 'Ish' }].map(c => (
                  <button key={c.v} className="pill-btn" onClick={() => setForm(x => ({ ...x, category: c.v }))} style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none',
                    background: form.category === c.v ? '#16a34a' : '#f1f5f9',
                    color: form.category === c.v ? '#fff' : '#64748b',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{c.l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, margin: '0 16px' }}>
              <button className="pill-btn" onClick={() => setShowAdd(false)} style={{
                padding: 14, border: '1.5px solid #e5e7eb', borderRadius: 16,
                background: '#fff', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
              }}>Bekor</button>
              <button className="pill-btn" onClick={handleAdd} disabled={saving || !form.name.trim()} style={{
                padding: 14, border: 'none', borderRadius: 16,
                background: form.name.trim() ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#e5e7eb',
                fontSize: 14, fontWeight: 700,
                color: form.name.trim() ? '#fff' : '#9ca3af',
                cursor: form.name.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
                boxShadow: form.name.trim() ? '0 4px 14px rgba(22,163,74,.3)' : 'none',
              }}>
                {saving ? 'Saqlanmoqda...' : '+ Saqlash'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
