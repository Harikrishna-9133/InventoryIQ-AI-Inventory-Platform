import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, deleteCustomer } from '../api'

type Customer = {
  id: number
  company_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
}

const initForm = { company_name: '', contact_person: '', email: '', phone: '', address: '' }

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getCustomers()
      setCustomers(Array.isArray(data) ? data : [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || (c.company_name||'').toLowerCase().includes(q) || (c.contact_person||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q)
  })

  const handleAdd = async () => {
    if (!form.company_name.trim()) return
    setSaving(true)
    try { await createCustomer(form); setShowAdd(false); setForm(initForm); load() }
    catch (e: any) { alert(e.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await deleteCustomer(id); setDeleteId(null); load() }
    catch (e: any) { alert(e.message || 'Failed') }
  }

  const avatar = (c: Customer) => {
    const n = c.contact_person || c.company_name || '?'
    return n.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Customer Management</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{loading ? 'Loading...' : customers.length + ' customers in database'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {(['grid', 'table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', border: 'none', background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? 'white' : 'var(--muted-foreground)', transition: 'all 0.15s' }}>{v === 'grid' ? 'Grid' : 'Table'}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Customer</button>
        </div>
      </div>

      <div className="card" style={{ padding: '12px 14px' }}>
        <input type="search" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12.5, maxWidth: 320 }} />
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="card" style={{ padding: 18, height: 140, opacity: 0.5 }} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No customers yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>Add your first customer to get started.</div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Customer</button>
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(c => (
            <div key={c.id} className="card animate-in" style={{ padding: 18, transition: 'box-shadow 0.15s, transform 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>{avatar(c)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{c.contact_person || 'No contact'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company_name}</div>
                </div>
                <span className="badge badge-green">Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12, fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                {c.email && <div>📧 {c.email}</div>}
                {c.phone && <div>📞 {c.phone}</div>}
                {c.address && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {c.address}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Edit</button>
                <button onClick={() => setDeleteId(c.id)} style={{ flex: 1, fontSize: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'table' && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{avatar(c)}</div><span style={{ fontWeight: 500 }}>{c.company_name}</span></div></td>
                  <td style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>{c.contact_person || 'N/A'}</td>
                  <td style={{ fontSize: 13 }}>{c.email || 'N/A'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c.phone || 'N/A'}</td>
                  <td><div style={{ display: 'flex', gap: 4 }}><button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11.5, height: 26 }}>Edit</button><button onClick={() => setDeleteId(c.id)} style={{ padding: '3px 8px', fontSize: 11.5, height: 26, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', cursor: 'pointer' }}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)}>
          <div className="card animate-in" style={{ width: 440, padding: 24, margin: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Customer</h2>
              <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAdd(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([['company_name','Company Name *'],['contact_person','Contact Person'],['email','Email'],['phone','Phone'],['address','Address']] as [keyof typeof form, string][]).map(([key,label]) => (
                <div key={key}><label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>{label.toUpperCase()}</label><input type="text" placeholder={label} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-in" style={{ width: 360, padding: 24, margin: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Customer?</div>
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
