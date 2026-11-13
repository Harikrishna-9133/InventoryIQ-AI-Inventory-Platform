import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api'

const tabs = ['Profile', 'Organization', 'Notifications', 'Email Config', 'Users & Roles', 'AI Model', 'Security']

export default function Settings() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [emailAlerts, setEmailAlerts] = useState({ lowStock: true, stockout: true, reorder: true, weekly: true, supplier: false })
  const [modelSettings, setModelSettings] = useState({ lookback: 60, epochs: 100, lstmUnits: 128, confidence: 90 })
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const fetchUsers = async () => {
    if (currentUser?.role !== 'admin') return
    setLoadingUsers(true)
    try {
      const data = await apiFetch('/api/admin/users')
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Users & Roles') {
      fetchUsers()
    }
  }, [activeTab, currentUser])

  const updateUser = async (userId: number, role: string, status: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role, status })
      })
      fetchUsers()
    } catch (e) {
      console.error(e)
      alert("Failed to update user")
    }
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Sidebar tabs */}
        <div className="card" style={{ padding: '8px' }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 6,
                fontSize: 13.5, fontWeight: activeTab === t ? 600 : 400,
                background: activeTab === t ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: activeTab === t ? '#60a5fa' : 'var(--muted-foreground)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', display: 'block',
              }}
            >{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="card" style={{ padding: 24 }}>
          {activeTab === 'Profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Profile Settings</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: currentUser?.profileImage ? `url(${currentUser.profileImage}) center/cover` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>
                  {!currentUser?.profileImage && (currentUser?.name?.charAt(0) || 'U')}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{currentUser?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{currentUser?.email} · {currentUser?.role}</div>
                </div>
                <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }}>Change Photo</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[['Full Name', currentUser?.name || ''], ['Email', currentUser?.email || ''], ['Phone', ''], ['Role', currentUser?.role || '']].map(([label, val]) => (
                  <div key={label}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>{label.toUpperCase()}</label>
                    <input type="text" defaultValue={val} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary">Save Changes</button>
                <button className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Notification Preferences</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'lowStock', label: 'Low Stock Alerts', desc: 'When product stock drops below reorder level' },
                  { key: 'stockout', label: 'Stockout Warnings', desc: 'When product reaches 0 units' },
                  { key: 'reorder', label: 'Reorder Recommendations', desc: 'AI-generated reorder suggestions' },
                  { key: 'weekly', label: 'Weekly Summary', desc: 'Monday morning inventory digest' },
                  { key: 'supplier', label: 'Supplier Updates', desc: 'PO confirmations and delivery updates' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setEmailAlerts(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: (emailAlerts as any)[item.key] ? '#3b82f6' : 'var(--border)',
                        position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 2,
                        left: (emailAlerts as any)[item.key] ? 22 : 2,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white', transition: 'left 0.2s',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'AI Model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>AI Model Configuration</div>
                <span className="badge badge-blue">LSTM v2.4</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <div style={{ fontSize: 12, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: 6 }}>MODEL STATUS</div>
                <div style={{ display: 'flex', gap: 20 }}>
                  {[['Last Trained', 'Aug 13, 06:00 AM'], ['Accuracy', '94.2% MAPE'], ['Status', 'Active']].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2, color: k === 'Status' ? '#10b981' : 'var(--foreground)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['Lookback Window (days)', modelSettings.lookback, 'lookback'],
                  ['Training Epochs', modelSettings.epochs, 'epochs'],
                  ['LSTM Units', modelSettings.lstmUnits, 'lstmUnits'],
                  ['Confidence Threshold (%)', modelSettings.confidence, 'confidence'],
                ].map(([label, val, key]) => (
                  <div key={String(key)}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>{String(label).toUpperCase()}</label>
                    <input type="text" defaultValue={String(val)} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary">Save & Retrain</button>
                <button className="btn-ghost">Reset Defaults</button>
              </div>
            </div>
          )}

          {activeTab === 'Users & Roles' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Users & Roles</div>
                <button className="btn-primary" style={{ fontSize: 12 }}>Invite User</button>
              </div>
              {currentUser?.role !== 'admin' ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted-foreground)' }}>You do not have permission to view this section.</div>
              ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
                  ) : users.map((u: any, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{u.name}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{u.email}</td>
                      <td>
                        <select 
                          value={u.role} 
                          onChange={(e) => updateUser(u.id, e.target.value, u.status)}
                          style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4 }}
                          disabled={u.id === currentUser?.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="inventory_manager">Inventory Manager</option>
                          <option value="customer">Customer</option>
                          <option value="supplier">Supplier</option>
                        </select>
                      </td>
                      <td>
                        <select 
                          value={u.status} 
                          onChange={(e) => updateUser(u.id, u.role, e.target.value)}
                          style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: u.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.status === 'active' ? '#10b981' : '#ef4444' }}
                          disabled={u.id === currentUser?.id}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11.5, height: 26 }} onClick={() => alert(`View details for ${u.name}`)}>View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          )}

          {!['Profile', 'Notifications', 'AI Model', 'Users & Roles'].includes(activeTab) && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⊛</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }}>{activeTab}</div>
              <div style={{ fontSize: 13 }}>Configuration options for this section</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
