import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContactStore } from '../store'
import { initials, avatarColor, haptic } from '../utils'
import { contactsAPI } from '../api'

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

  const CATS = [
    { value: '', label: 'Hammasi' },
    { value: 'family', label: 'qarindoshlar' },
    { value: 'friends', label: "do'stlar" },
    { value: 'work', label: 'ish' },
  ]

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#111', letterSpacing: -0.5 }}>Mijozlar</div>
        <button onClick={() => setShowAdd(true)} style={{
          width: 34, height: 34, background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 20, color: '#16a34a'
        }}>+</button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 16px 8px', padding: '11px 14px', background: '#fff', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <span style={{ fontSize: 18, color: '#ccc' }}>🔍</span>
        <input
          placeholder="Ism yoki telefon..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', fontSize: 14, color: '#111', fontFamily: 'inherit', outline: 'none', flex: 1 }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 8px', overflowX: 'auto', flexShrink: 0 }}>
        {CATS.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)} style={{
            padding: '7px 16px', borderRadius: 99, fontSize: 13, fontWeight: 500,
            border: `1.5px solid ${category === c.value ? '#16a34a' : 'rgba(0,0,0,0.1)'}`,
            background: category === c.value ? '#16a34a' : '#fff',
            color: category === c.value ? '#fff' : '#555',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0
          }}>{c.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Yuklanmoqda...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 6 }}>Mijoz topilmadi</div>
            </div>
          )}
          {filtered.map((contact) => {
            const av = avatarColor(contact.name)
            const hasDebt = contact.balance_uzs !== 0 || contact.balance_usd !== 0
            return (
              <div key={contact.id} style={{
                background: '#fff', borderRadius: 18, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                border: '0.5px solid rgba(0,0,0,0.06)', cursor: 'pointer'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {initials(contact.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>{contact.name}</div>
                  <div style={{ fontSize: 12, color: '#bbb', display: 'flex', alignItems: 'center', gap: 3 }}>
                    📞 {contact.phone || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#ccc', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>BALANS</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: contact.balance_uzs !== 0 ? '#ef4444' : '#111' }}>
                    {new Intl.NumberFormat('uz-UZ').format(Math.abs(contact.balance_uzs))} UZS
                  </div>
                  {contact.balance_usd !== 0 && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>
                      {contact.balance_usd > 0 ? '' : '-'}{Math.abs(contact.balance_usd)}$
                    </div>
                  )}
                </div>
                <span style={{ color: '#ddd', fontSize: 20 }}>⋮</span>
              </div>
            )
          })}
        </div>

        {/* Add FAB */}
        <button onClick={() => setShowAdd(true)} style={{
          margin: '14px 16px 0', width: 'calc(100% - 32px)',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          border: 'none', borderRadius: 18, padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer'
        }}>
          + Mijoz qo'shish
        </button>
        <div style={{ height: 16 }} />
      </div>

      {/* Add Contact Sheet */}
      {showAdd && (
        <>
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, maxWidth: 480, margin: '0 auto' }} />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderRadius: '26px 26px 0 0', zIndex: 101, padding: '0 0 24px' }}>
            <div style={{ width: 38, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', padding: '0 18px 14px' }}>Yangi mijoz</div>
            {[
              { key: 'name', label: '👤 Ism *', placeholder: 'Ism familiya' },
              { key: 'phone', label: '📞 Telefon', placeholder: '+998901234567' },
            ].map((f) => (
              <div key={f.key} style={{ padding: '0 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 7, fontWeight: 500 }}>{f.label}</div>
                <input
                  type={f.key === 'phone' ? 'tel' : 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm((x) => ({ ...x, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, fontSize: 15, color: '#111', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '8px 16px 0' }}>
              <button onClick={() => setShowAdd(false)} style={{ padding: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 16, background: '#fff', fontSize: 14, fontWeight: 600, color: '#111', cursor: 'pointer', fontFamily: 'inherit' }}>
                Bekor
              </button>
              <button onClick={handleAdd} disabled={saving} style={{ padding: 14, border: 'none', borderRadius: 16, background: 'linear-gradient(135deg,#22c55e,#16a34a)', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
