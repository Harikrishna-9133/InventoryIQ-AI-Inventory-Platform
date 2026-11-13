import { useState, useEffect } from 'react'
import { getAdminUsers, updateUserStatus, updateUserRole, deleteAdminUser } from '../api'
import { useAuth } from '../context/AuthContext'

type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  status: string
  auth_provider: string
  created_at: string
  last_login: string | null
}

const statusBadge: Record<string, string> = {
  active: 'badge-green', pending: 'badge-yellow', inactive: 'badge-gray', disabled: 'badge-red',
}

const roleBadge: Record<string, string> = {
  admin: 'badge-red', inventory_manager: 'badge-blue', accountant: 'badge-green', supplier: 'badge-orange',
}

function formatDate(d: string | null) {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ROLES = ['admin', 'inventory_manager', 'accountant', 'supplier', 'customer']

export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminUsers()
      setUsers(Array.isArray(data) ? data : data?.users || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleStatus = async (id: number, status: string) => {
    try { await updateUserStatus(id, status); load() }
    catch (e: any) { alert(e.message || 'Failed to update status') }
  }

  const handleRole = async (id: number, role: string) => {
    try { await updateUserRole(id, role); load() }
    catch (e: any) { alert(e.message || 'Failed to update role') }
  }

  const handleDelete = async (id: number) => {
    try { await deleteAdminUser(id); setDeleteId(null); load() }
    catch (e: any) { alert(e.message || 'Failed to delete user') }
  }

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Admin Access Only</div>
        <div style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>You don't have permission to view this page.</div>
      </div>
    )
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Panel</h1>
            {pendingCount > 0 && <span className="badge badge-red">{pendingCount} pending</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{loading ? 'Loading...' : users.length + ' registered users'}</div>
        </div>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Users', value: users.length, color: '#3b82f6', key: 'all' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: '#10b981', key: 'active' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b', key: 'pending' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#ef4444', key: '' },
          { label: 'Disabled', value: users.filter(u => u.status === 'disabled' || u.status === 'inactive').length, color: '#64748b', key: 'disabled' },
        ].map(s => (
          <button key={s.label} onClick={() => s.key && setStatusFilter(prev => prev === s.key ? 'all' : s.key)}
            className={statusFilter === s.key ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '10px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 10.5, opacity: 0.7, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: statusFilter === s.key ? 'inherit' : s.color }}>{s.value}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="search" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12.5, maxWidth: 320 }} />
      </div>

      {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading users...</div>}

      {!loading && error && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 16 }}>{error}</div>
          <button className="btn-primary" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No users found</div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Auth</th>
                <th>Registered</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ opacity: u.status === 'disabled' ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.role === 'admin' ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {u.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.id === user?.id ? (
                      <span className={'badge ' + (roleBadge[u.role] || 'badge-gray')}>{u.role}</span>
                    ) : (
                      <select value={u.role} onChange={e => handleRole(u.id, e.target.value)} style={{ fontSize: 12, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 6px', color: 'var(--foreground)', cursor: 'pointer' }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    )}
                  </td>
                  <td><span className={'badge ' + (statusBadge[u.status] || 'badge-gray')}>{u.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{u.auth_provider === 'google' ? '🔵 Google' : '🔑 Local'}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{formatDate(u.created_at)}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{formatDate(u.last_login)}</td>
                  <td>
                    {u.id !== user?.id && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.status === 'pending' && <button className="btn-primary" style={{ fontSize: 11, padding: '3px 8px', height: 26 }} onClick={() => handleStatus(u.id, 'active')}>Approve</button>}
                        {u.status === 'active' && <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', height: 26 }} onClick={() => handleStatus(u.id, 'disabled')}>Disable</button>}
                        {(u.status === 'disabled' || u.status === 'inactive') && <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px', height: 26 }} onClick={() => handleStatus(u.id, 'active')}>Enable</button>}
                        <button onClick={() => setDeleteId(u.id)} style={{ padding: '3px 8px', fontSize: 11, height: 26, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                      </div>
                    )}
                    {u.id === user?.id && <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card animate-in" style={{ width: 360, padding: 24, margin: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete User Account?</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>This permanently deletes the account and all associated data. Cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '7px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
