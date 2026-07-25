// Uzun izoh matni ro'yxat va kartochkalarni cho'zib yubormasin.
// Belgilangan qatordan uzun bo'lsa qirqiladi va «ko'proq» tugmasi chiqadi.
import React, { useState } from 'react'
import { useT } from '../i18n'

export default function NoteText({
  text,
  lines = 2,          // nechta qatorgacha ko'rsatiladi
  size = 12,
  color = '#64748b',
  linkColor = '#16a34a',
  style,
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const value = (text || '').trim()
  if (!value) return null

  // «ko'proq» kerakmi — qo'pol baho: uzunlik yoki qator soni
  const needsClamp = value.length > lines * 42 || value.split('\n').length > lines

  return (
    <div style={{ minWidth: 0, ...style }}>
      <div
        style={{
          fontSize: size,
          color,
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          ...(open ? {} : {
            display: '-webkit-box',
            WebkitLineClamp: lines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }),
        }}
      >
        {value}
      </div>
      {needsClamp && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
          style={{
            marginTop: 2, padding: 0, border: 'none', background: 'none',
            fontFamily: 'inherit', fontSize: size - 0.5, fontWeight: 700,
            color: linkColor, cursor: 'pointer',
          }}
        >
          {open ? t('note_less') : t('note_more')}
        </button>
      )}
    </div>
  )
}
