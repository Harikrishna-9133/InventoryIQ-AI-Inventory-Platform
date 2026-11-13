import { useState } from 'react'
import { notificationsData } from '../data/mockData'

const typeConfig: Record<string, { color: string; bg: string; icon: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⛔' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠' },
  ai: { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', icon: '⌬' },
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: 'ℹ' },
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [items, setItems] = useState(notificationsData)

  const visible = items.filter(n => filter === 'all' || !n.read)
  const unreadCount = items.filter(n => !n.read).length

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Notification Center</h1>
            {unreadCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999, fontFamily: 'JetBrains Mono, monospace' }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{unreadCount} unread · {items.length} total notifications</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setItems(items.map(n => ({ ...n, read: true })))}>Mark all read</button>
          <button className="btn-ghost">Settings</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ id: 'all', label: 'All' }, { id: 'unread', label: `Unread (${unreadCount})` }].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: filter === t.id ? 'var(--foreground)' : 'var(--muted-foreground)',
              borderBottom: filter === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Notification groups */}
      {[
        { label: 'Today', items: visible.slice(0, 4) },
        { label: 'Yesterday', items: visible.slice(4) },
      ].filter(g => g.items.length > 0).map(group => (
        <div key={group.label}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{group.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.items.map(n => {
              const cfg = typeConfig[n.type]
              return (
                <div
                  key={n.id}
                  className="card animate-in"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    gap: 12,
                    borderLeft: `3px solid ${cfg.color}`,
                    background: n.read ? 'var(--card)' : `${cfg.bg}`,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onClick={() => setItems(items.map(i => i.id === n.id ? { ...i, read: true } : i))}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{n.time}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 3, lineHeight: 1.5 }}>{n.desc}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 5 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted-foreground)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>◉</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>All caught up</div>
          <div style={{ fontSize: 13, marginTop: 5 }}>No unread notifications</div>
        </div>
      )}
    </div>
  )
}
