import { useState, useEffect } from 'react'
import { getPurchaseOrders, getSuppliers, getProducts, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from '../api'

type POItem = { id: number; product_id: number; quantity: number; unit_price: number; total_price: number }
type PO = { id: number; supplier_id: number; status: string; total_amount: number; order_date: string; expected_delivery: string | null; items: POItem[] }
type Supplier = { id: number; name: string }
type Product = { id: number; name: string; sku: string }

const statusBadge: Record<string, string> = {
  pending: 'badge-yellow', confirmed: 'badge-blue', shipped: 'badge-orange',
  delivered: 'badge-green', cancelled: 'badge-red',
}

function formatDate(d: string | null) {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatCurrency(v: number) {
  if (v >= 100000) return 'INR' + (v / 100000).toFixed(2) + 'L'
  if (v >= 1000) return 'INR' + (v / 1000).toFixed(1) + 'K'
  return 'INR' + v.toFixed(0)
}

export default function PurchaseOrders() {
  const [pos, setPOs] = useState<PO[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ supplier_id: '', items: [{ product_id: '', quantity: '1', unit_price: '0' }] })

  const load = async () => {
    setLoading(true)
    try {
      const [poData, supplierData, productData] = await Promise.all([getPurchaseOrders(), getSuppliers(), getProducts()])
      setPOs(Array.isArray(poData) ? poData : [])
      setSuppliers(Array.isArray(supplierData) ? supplierData : [])
      setProducts(Array.isArray(productData) ? productData : [])
    } catch { setPOs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = pos.filter(po => {
    const supplier = suppliers.find(s => s.id === po.supplier_id)
    const matchSearch = !search || (supplier?.name||'').toLowerCase().includes(search.toLowerCase()) || String(po.id).includes(search)
    const matchStatus = statusFilter === 'all' || po.status === statusFilter
    return matchSearch && matchStatus
  })

  const totals = {
    total: pos.length,
    pending: pos.filter(p => p.status === 'pending').length,
    confirmed: pos.filter(p => p.status === 'confirmed').length,
    delivered: pos.filter(p => p.status === 'delivered').length,
    totalValue: pos.reduce((s, p) => s + (p.total_amount || 0), 0),
  }

  const handleAdd = async () => {
    if (!form.supplier_id) { alert('Please select a supplier'); return }
    setSaving(true)
    try {
      await createPurchaseOrder({
        supplier_id: Number(form.supplier_id),
        items: form.items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))
      })
      setShowAdd(false)
      setForm({ supplier_id: '', items: [{ product_id: '', quantity: '1', unit_price: '0' }] })
      load()
    } catch (e: any) { alert(e.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try { await updatePurchaseOrder(id, { status }); load() }
    catch (e: any) { alert(e.message || 'Failed') }
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: '1', unit_price: '0' }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Purchase Orders</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{loading ? 'Loading...' : pos.length + ' orders · Total value: ' + formatCurrency(totals.totalValue)}</div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Create Purchase Order</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {[
          { label: 'Total', value: totals.total, color: '#3b82f6', key: 'all' },
          { label: 'Pending', value: totals.pending, color: '#f59e0b', key: 'pending' },
          { label: 'Confirmed', value: totals.confirmed, color: '#06b6d4', key: 'confirmed' },
          { label: 'Delivered', value: totals.delivered, color: '#10b981', key: 'delivered' },
          { label: 'Total Value', value: formatCurrency(totals.totalValue), color: '#8b5cf6', key: '' },
        ].map(s => (
          <button key={s.label} onClick={() => s.key && setStatusFilter(prev => prev === s.key ? 'all' : s.key)}
            className={statusFilter === s.key ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '10px 12px', borderRadius: 8, textAlign: 'left', cursor: s.key ? 'pointer' : 'default' }}>
            <div style={{ fontSize: 10.5, opacity: 0.7, marginBottom: 3, fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: statusFilter === s.key ? 'inherit' : s.color }}>{s.value}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="search" placeholder="Search by PO#, supplier..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12.5, maxWidth: 300 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 32, fontSize: 12.5, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0 8px', color: 'var(--foreground)' }}>
          <option value="all">All Statuses</option>
          {['pending','confirmed','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading purchase orders...</div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No purchase orders</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>Create your first PO or use AI Recommendations to auto-generate.</div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Create Purchase Order</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(po => {
            const supplier = suppliers.find(s => s.id === po.supplier_id)
            const isExpanded = expanded === po.id
            return (
              <div key={po.id} className="card animate-in" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexWrap: 'wrap' }} onClick={() => setExpanded(isExpanded ? null : po.id)}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, fontWeight: 700, color: '#3b82f6', minWidth: 70 }}>PO-{String(po.id).padStart(4,'0')}</div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{supplier?.name || 'Unknown Supplier'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{po.items?.length || 0} items · Ordered {formatDate(po.order_date)}</div>
                  </div>
                  <span className={'badge ' + (statusBadge[po.status] || 'badge-gray')}>{po.status}</span>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: '#10b981', minWidth: 80, textAlign: 'right' }}>{formatCurrency(po.total_amount)}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', minWidth: 100 }}>ETA: {formatDate(po.expected_delivery)}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {po.status === 'pending' && <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 7px', height: 24 }} onClick={e => { e.stopPropagation(); handleStatusChange(po.id, 'confirmed') }}>Confirm</button>}
                    {po.status === 'confirmed' && <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 7px', height: 24 }} onClick={e => { e.stopPropagation(); handleStatusChange(po.id, 'delivered') }}>Mark Delivered</button>}
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', padding: '0 4px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                {isExpanded && po.items?.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 18px', background: 'var(--secondary)' }}>
                    <table style={{ width: '100%' }}>
                      <thead><tr><th style={{ textAlign: 'left', fontSize: 11, color: 'var(--muted-foreground)', padding: '4px 0' }}>Product</th><th style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted-foreground)' }}>Qty</th><th style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted-foreground)' }}>Unit Price</th><th style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted-foreground)' }}>Total</th></tr></thead>
                      <tbody>
                        {po.items.map(item => {
                          const product = products.find(p => p.id === item.product_id)
                          return (
                            <tr key={item.id}>
                              <td style={{ fontSize: 12.5, padding: '5px 0' }}>{product?.name || 'Product #' + item.product_id}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>{item.quantity}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>INR{item.unit_price}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#10b981' }}>INR{item.total_price}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)}>
          <div className="card animate-in" style={{ width: 540, padding: 24, margin: 16, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Create Purchase Order</h2>
              <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAdd(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>SUPPLIER *</label>
                <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--foreground)', fontSize: 13 }}>
                  <option value="">Select supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)' }}>ORDER ITEMS</label>
                  <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={addItem}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 28px', gap: 6, marginBottom: 8 }}>
                    <select value={item.product_id} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, product_id: e.target.value } : it) }))} style={{ padding: '6px 8px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--foreground)', fontSize: 12 }}>
                      <option value="">Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" min={1} value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, quantity: e.target.value } : it) }))} placeholder="Qty" style={{ fontSize: 12, textAlign: 'right' }} />
                    <input type="number" min={0} step={0.01} value={item.unit_price} onChange={e => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, unit_price: e.target.value } : it) }))} placeholder="Unit Price" style={{ fontSize: 12, textAlign: 'right' }} />
                    <button onClick={() => removeItem(i)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 5, color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Creating...' : 'Create PO'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
