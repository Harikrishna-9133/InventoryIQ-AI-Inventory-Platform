import type { FC } from 'react'
import { useAuth } from '../context/AuthContext'

type Page =
  | 'dashboard' | 'inventory' | 'forecasting' | 'customers'
  | 'suppliers' | 'recommendations' | 'purchase-orders' | 'progress' | 'notifications' | 'analytics'
  | 'reports' | 'settings' | 'email' | 'admin'

interface Props {
  active: Page
  onNavigate: (p: Page) => void
  collapsed: boolean
}

const navItems: { id: Page; label: string; icon: string; badge?: string; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▣' },
  { id: 'inventory', label: 'Inventory', icon: '⊟' },
  { id: 'forecasting', label: 'AI Forecast', icon: '⌬', badge: 'AI' },
  { id: 'recommendations', label: 'AI Reorder', icon: '⊕', badge: 'AI' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: '◈' },
  { id: 'progress', label: 'Progress', icon: '◑' },
  { id: 'customers', label: 'Customers', icon: '◎' },
  { id: 'suppliers', label: 'Suppliers', icon: '⊠' },
  { id: 'email', label: 'Email Alerts', icon: '◷' },
  { id: 'analytics', label: 'Analytics', icon: '≋' },
  { id: 'reports', label: 'Reports', icon: '⊞' },
  { id: 'notifications', label: 'Notifications', icon: '◉', badge: '3' },
  { id: 'settings', label: 'Settings', icon: '⊛' },
  { id: 'admin', label: 'Admin Panel', icon: '⊖', badge: 'ADMIN', adminOnly: true },
]

const Sidebar: FC<Props> = ({ active, onNavigate, collapsed }) => {
  const { user, logout } = useAuth()

  return (
    <aside
      style={{
        width: collapsed ? 56 : 220,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '18px 14px' : '18px 16px',
          borderBottom: '1px solid var(--sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 60,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: 'white',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          IQ
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.2 }}>InventoryIQ</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace' }}>PREDICT · OPTIMIZE</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-nav-item${active === item.id ? ' active' : ''}`}
            style={{ width: '100%', background: 'none', border: 'none', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px' : '8px 12px' }}
            title={collapsed ? item.label : undefined}
          >
            <span style={{ fontSize: 14, flexShrink: 0, opacity: active === item.id ? 1 : 0.7 }}>{item.icon}</span>
            {!collapsed && (
              <>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 999,
                    background: item.badge === 'AI' ? 'rgba(6,182,212,0.2)' : item.badge === 'ADMIN' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.2)',
                    color: item.badge === 'AI' ? '#06b6d4' : '#ef4444',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}>{item.badge}</span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* User profile + Logout */}
      <div style={{
        padding: '10px 10px 12px',
        borderTop: '1px solid var(--sidebar-border)',
      }}>
        {!collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ') || 'Member'}</div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%', padding: '7px 10px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 7, cursor: 'pointer',
                color: 'rgba(239,68,68,0.8)', fontSize: 12.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
                fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)' }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.15)' }}
            >
              <span>⎋</span> Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 7, cursor: 'pointer', color: 'rgba(239,68,68,0.7)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >⎋</button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
export type { Page }
