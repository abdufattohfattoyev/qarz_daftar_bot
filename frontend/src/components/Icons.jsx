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
