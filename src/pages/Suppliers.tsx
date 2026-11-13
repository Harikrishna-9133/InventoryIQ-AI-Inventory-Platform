import { useState, useEffect } from 'react'
import { getSuppliers, createSupplier, deleteSupplier } from '../api'

type Supplier = {
  id: number
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  lead_time_days: number
}

const initForm = { name: '', contact_person: '', email: '', phone: '', address: '', lead_time_days: 7 }

const ScoreBar = ({ score }: { score: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--secondary)', overflow: 'hidden' }}>
      <div style={{ width: score + '%', height: '100%', background: score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444', borderRadius: 2, transition: 'width 0.4s' }} />
    </div>
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: score >= 90 ? '#10b981' : score >= 75 ? '#f59e0b' : '#ef4444', minWidth: 28 }}>{score}</span>
  </div>
)

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await getSuppliers()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch {
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = suppliers.filter(s =>
    !search || (s.name||'').toLowerCase().includes(search.toLowerCase()) || (s.email||'').toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try { await createSupplier(form); setShowAdd(false); setForm(initForm); load() }
    catch (e: any) { alert(e.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await deleteSupplier(id); setDeleteId(null); load() }
    catch (e: any) { alert(e.message || 'Failed') }
  }

  const avgLeadTime = suppliers.length ? (suppliers.reduce((s, x) => s + (x.lead_time_days || 7), 0) / suppliers.length).toFixed(1) : '0'

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Supplier Management</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{loading ? 'Loading...' : suppliers.length + ' suppliers registered'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Supplier</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Suppliers', value: suppliers.length, color: '#3b82f6' },
          { label: 'Active', value: suppliers.length, color: '#10b981' },
          { label: 'Avg Lead Time', value: avgLeadTime + 'd', color: '#06b6d4' },
          { label: 'Registered', value: suppliers.length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 14px' }}>
        <input type="search" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12.5, maxWidth: 320 }} />
      </div>

      {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading suppliers...</div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No suppliers yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>Add your first supplier to get started.</div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Supplier</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Lead Time</th>
                <th>Reliability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const score = Math.min(100, Math.max(60, 100 - s.lead_time_days * 4))
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                          {s.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                          {s.address && <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{s.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{s.contact_person || 'N/A'}</td>
                    <td style={{ fontSize: 13 }}>{s.email || 'N/A'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{s.phone || 'N/A'}</td>
                    <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#06b6d4' }}>{s.lead_time_days}d</span></td>
                    <td style={{ minWidth: 120 }}><ScoreBar score={score} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11.5, height: 26 }}>Edit</button>
                        <button onClick={() => setDeleteId(s.id)} style={{ padding: '3px 8px', fontSize: 11.5, height: 26, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)}>
          <div className="card animate-in" style={{ width: 440, padding: 24, margin: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Supplier</h2>
              <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAdd(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([['name','Supplier Name *'],['contact_person','Contact Person'],['email','Email'],['phone','Phone'],['address','Address']] as [keyof typeof form, string][]).map(([key,label]) => (
                <div key={key}><label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>{label.toUpperCase()}</label><input type="text" placeholder={label} value={String(form[key])} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></div>
              ))}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>LEAD TIME (DAYS)</label>
                <input type="number" min={1} max={30} value={form.lead_time_days} onChange={e => setForm(f => ({ ...f, lead_time_days: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card animate-in" style={{ width: 360, padding: 24, margin: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Supplier?</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '7px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
