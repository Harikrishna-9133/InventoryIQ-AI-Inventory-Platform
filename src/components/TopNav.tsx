import { type FC, useState } from 'react'
import type { Page } from './Sidebar'
import { useAuth } from '../context/AuthContext'
import ProfilePanel from './ProfilePanel'

interface Props {
  page: Page
  onToggleSidebar: () => void
  onToggleTheme: () => void
  isDark: boolean
  onNavigate: (p: Page) => void
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  inventory: 'Inventory Management',
  forecasting: 'AI Demand Forecasting',
  customers: 'Customer Management',
  suppliers: 'Supplier Management',
  recommendations: 'AI Reorder Recommendations',
  'purchase-orders': 'Purchase Orders',
  progress: 'Project Progress',
  notifications: 'Notification Center',
  analytics: 'Analytics',
  reports: 'Reports',
  settings: 'Settings',
  email: 'Email Automation',
  admin: 'Admin Panel',
}

const TopNav: FC<Props> = ({ page, onToggleSidebar, onToggleTheme, isDark, onNavigate }) => {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [warehouse, setWarehouse] = useState('All Warehouses')
  const [showNotifDot] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <>
      <header style={{
        height: 56,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <button onClick={onToggleSidebar} className="btn-ghost" style={{ padding: '6px 8px', color: 'var(--muted-foreground)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Page title */}
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', marginRight: 8 }}>
          {pageTitles[page]}
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            placeholder="Search products, orders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 30, fontSize: 12.5, height: 32 }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Warehouse */}
          <select value={warehouse} onChange={e => setWarehouse(e.target.value)} style={{ height: 32, fontSize: 12, width: 'auto', paddingRight: 24 }}>
            <option>All Warehouses</option>
            <option>WH-Mumbai</option>
            <option>WH-Delhi</option>
            <option>WH-Bangalore</option>
            <option>WH-Pune</option>
            <option>WH-Hyderabad</option>
          </select>

          {/* Theme */}
          <button onClick={onToggleTheme} className="btn-ghost" style={{ padding: '6px 8px' }}>
            {isDark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button className="btn-ghost" style={{ padding: '6px 8px', position: 'relative' }} onClick={() => onNavigate('notifications')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {showNotifDot && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--card)' }} />
            )}
          </button>

          {/* Help */}
          <button className="btn-ghost" style={{ padding: '6px 8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
            </svg>
          </button>

          {/* Avatar — click to open profile panel */}
          <button
            onClick={() => setProfileOpen(true)}
            title="View Profile"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              padding: 0, border: '2px solid transparent',
              background: 'none', cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              flexShrink: 0,
              outline: 'none',
              boxShadow: profileOpen ? '0 0 0 3px rgba(99,102,241,0.35)' : 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.6)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent' }}
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>
                {getInitials(user?.name || 'User')}
              </div>
            )}
          </button>
        </div>
      </header>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

export default TopNav
