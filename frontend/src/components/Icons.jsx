// Nav icons
export const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29 21.19 7.74 20.2 7.05L14.02 2.72C12.62 1.74 10.37 1.79 9.02 2.84Z"
      fill={active ? '#16a34a' : 'none'}
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17.99V14.99" stroke={active ? '#fff' : '#94a3b8'} strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
)

export const UsersIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      fill={active ? '#16a34a' : 'none'} stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7"/>
    <path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21"
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M16 3.13C17.6 3.54 18.75 5 18.75 6.75C18.75 8.5 17.6 9.96 16 10.37"
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M21 21V19C21 17.25 19.85 15.79 18.25 15.38"
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
)

export const ChartIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M7 17L7 13" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17L12 7" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 17L17 11" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round"/>
    <rect x="2" y="2" width="20" height="20" rx="5"
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7"/>
  </svg>
)

export const SettingIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7"/>
    <path d="M13.77 2.18L13.94 3.3C14.01 3.77 14.31 4.17 14.75 4.37L15.38 4.65C15.82 4.85 16.33 4.82 16.73 4.56L17.68 3.97L19.03 5.32L18.44 6.27C18.18 6.67 18.15 7.18 18.35 7.62L18.63 8.25C18.83 8.69 19.23 8.99 19.7 9.06L20.82 9.23V11.13L19.7 11.3C19.23 11.37 18.83 11.67 18.63 12.11L18.35 12.74C18.15 13.18 18.18 13.69 18.44 14.09L19.03 15.04L17.68 16.39L16.73 15.8C16.33 15.54 15.82 15.51 15.38 15.71L14.75 15.99C14.31 16.19 14.01 16.59 13.94 17.06L13.77 18.18H11.87L11.7 17.06C11.63 16.59 11.33 16.19 10.89 15.99L10.26 15.71C9.82 15.51 9.31 15.54 8.91 15.8L7.96 16.39L6.61 15.04L7.2 14.09C7.46 13.69 7.49 13.18 7.29 12.74L7.01 12.11C6.81 11.67 6.41 11.37 5.94 11.3L4.82 11.13V9.23L5.94 9.06C6.41 8.99 6.81 8.69 7.01 8.25L7.29 7.62C7.49 7.18 7.46 6.67 7.2 6.27L6.61 5.32L7.96 3.97L8.91 4.56C9.31 4.82 9.82 4.85 10.26 4.65L10.89 4.37C11.33 4.17 11.63 3.77 11.7 3.3L11.87 2.18H13.77Z"
      stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
)

export const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

export const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 12V4M4 8L8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 4V12M12 8L8 12L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 4L10 8L6 12" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="#94a3b8" strokeWidth="1.6"/>
    <path d="M12.5 12.5L15.5 15.5" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

export const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2.25 4.5H15.75" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14.25 4.5V15C14.25 15.83 13.58 16.5 12.75 16.5H5.25C4.42 16.5 3.75 15.83 3.75 15V4.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 4.5V3C6 2.17 6.67 1.5 7.5 1.5H10.5C11.33 1.5 12 2.17 12 3V4.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const PayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5V16.5M5.25 5.25H10.875C11.91 5.25 12.75 6.09 12.75 7.125C12.75 8.16 11.91 9 10.875 9H7.125C6.09 9 5.25 9.84 5.25 10.875C5.25 11.91 6.09 12.75 7.125 12.75H12.75" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

// Settings icons — colorfull filled SVG
export const CurrencyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#f59e0b"/>
    <path d="M12 6v1.5M12 16.5V18M8.5 9.5C8.5 8.12 9.62 7 11 7h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2c-1.1 0-2 .9-2 2s.9 2 2 2h2c1.38 0 2.5-1.12 2.5-2.5"
      stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

export const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#3b82f6"/>
    <path d="M2 12h20M12 2C9.33 5 8 8.33 8 12s1.33 7 4 10M12 2c2.67 3 4 6.33 4 10s-1.33 7-4 10"
      stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#8b5cf6"/>
    <path d="M12 7C9.79 7 8 8.79 8 11v3l-1 1.5h10L16 14v-3c0-2.21-1.79-4-4-4z" fill="#fff"/>
    <path d="M10.5 17.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14.5" cy="8.5" r="2.5" fill="#ef4444"/>
  </svg>
)

export const ExcelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#22c55e"/>
    <path d="M7 8l3 4-3 4h2l2-2.67L13 16h2l-3-4 3-4h-2l-2 2.67L9 8H7z" fill="#fff"/>
  </svg>
)

export const DeleteAllIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#ef4444"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke="#16a34a" strokeWidth="1.7"/>
    <path d="M16 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill="#16a34a"/>
    <path d="M2 10h20" stroke="#16a34a" strokeWidth="1.7"/>
    <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="#16a34a" strokeWidth="1.7"/>
  </svg>
)

export const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1.5" y="2.5" width="15" height="14" rx="2.5" stroke="#94a3b8" strokeWidth="1.4"/>
    <path d="M5.5 1v3M12.5 1v3M1.5 7h15" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="6" cy="11" r="1" fill="#94a3b8"/>
    <circle cx="9" cy="11" r="1" fill="#94a3b8"/>
    <circle cx="12" cy="11" r="1" fill="#94a3b8"/>
  </svg>
)

export const NoteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="1.5" width="14" height="15" rx="2.5" stroke="#94a3b8" strokeWidth="1.4"/>
    <path d="M5.5 6h7M5.5 9h7M5.5 12h4" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

export const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10L2.5 7.5L15.5 2.5Z"
      stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const PhotoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="#94a3b8" strokeWidth="1.6"/>
    <circle cx="8.5" cy="10.5" r="2" stroke="#94a3b8" strokeWidth="1.6"/>
    <path d="M2 17l5-5 4 4 3-3 6 6" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3.5 9.5l4 4 7-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

export const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 4.5h14M5 9h8M8 13.5h2" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

export const MoneyReceiveIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#dcfce7"/>
    <path d="M20 10v20M14 16l6-6 6 6" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 28h16" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

export const MoneySendIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#fee2e2"/>
    <path d="M20 10v20M14 24l6 6 6-6" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12h16" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

export const EmptyIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="40" r="36" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2"/>
    <rect x="22" y="26" width="36" height="28" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
    <path d="M28 36h24M28 42h16" stroke="#86efac" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="52" cy="52" r="10" fill="#16a34a"/>
    <path d="M48 52h8M52 48v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
