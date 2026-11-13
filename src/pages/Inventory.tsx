import { useState, useEffect } from 'react'
import { getInventory, getProducts, getWarehouses, createInventory, updateInventory, deleteInventory } from '../api'

type InventoryItem = {
  id: number
  product_id: number
  warehouse_id: number
  quantity: number
  reserved_quantity: number
  available_quantity: number
}
type Product = { id: number; name: string; sku: string; category_id: number | null; reorder_level: number }
type Warehouse = { id: number; name: string; location: string | null }

function getStatus(item: InventoryItem, product: Product | undefined) {
  const q = item.quantity
  const rl = product?.reorder_level ?? 10
  if (q === 0) return 'Out of Stock'
  if (q <= rl * 0.5) return 'Critical'
  if (q <= rl) return 'Low Stock'
  if (q > rl * 5) return 'Overstock'
  return 'In Stock'
}

const statusBadge: Record<string, string> = {
  'In Stock': 'badge-green', 'Low Stock': 'badge-yellow', 'Critical': 'badge-red',
  'Overstock': 'badge-blue', 'Out of Stock': 'badge-gray',
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity: '0', reserved_quantity: '0' })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const [inv, prods, whs] = await Promise.all([getInventory(), getProducts(), getWarehouses()])
      setInventory(Array.isArray(inv) ? inv : [])
      setProducts(Array.isArray(prods) ? prods : [])
      setWarehouses(Array.isArray(whs) ? whs : [])
    } catch {
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const enriched = inventory.map(item => ({
    ...item,
    product: products.find(p => p.id === item.product_id),
    warehouse: warehouses.find(w => w.id === item.warehouse_id),
    status: getStatus(item, products.find(p => p.id === item.product_id)),
  }))

  const filtered = enriched.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || (item.product?.name||'').toLowerCase().includes(q) || (item.product?.sku||'').toLowerCase().includes(q) || (item.warehouse?.name||'').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = ['In Stock','Low Stock','Critical','Overstock','Out of Stock'].map(s => ({ label: s, count: enriched.filter(i => i.status === s).length }))
  const handleEdit = (item: any) => {
  setEditingId(item.id)
  setForm({
    product_id: String(item.product_id),
    warehouse_id: String(item.warehouse_id),
    quantity: String(item.quantity),
    reserved_quantity: String(item.reserved_quantity),
  })
  setShowAdd(true)
}


  const handleAdd = async () => {
  if (!form.product_id || !form.warehouse_id) return

  setSaving(true)

  const data = {
    quantity: Number(form.quantity),
    reserved_quantity: Number(form.reserved_quantity),
  }

  try {
    if (editingId !== null) {
      await updateInventory(editingId, {
  product_id: Number(form.product_id),
  warehouse_id: Number(form.warehouse_id),
  quantity: Number(form.quantity),
  reserved_quantity: Number(form.reserved_quantity),
})
    }

    setShowAdd(false)
    setEditingId(null)
    setForm({
      product_id: '',
      warehouse_id: '',
      quantity: '0',
      reserved_quantity: '0',
    })

    await load()
  } catch (e: any) {
    alert(e.message || 'Failed')
  } finally {
    setSaving(false)
  }
}

  const handleDelete = async (id: number) => {
    try { await deleteInventory(id); setDeleteId(null); load() }
    catch (e: any) { alert(e.message || 'Failed') }
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Inventory Management</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{loading ? 'Loading...' : inventory.length + ' inventory records'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Inventory</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {statusCounts.map(s => (
          <button key={s.label} onClick={() => setStatusFilter(prev => prev === s.label ? 'All' : s.label)}
            className={statusFilter === s.label ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '10px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: 'inherit', opacity: 0.7, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{s.count}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="search" placeholder="Search by product, SKU, warehouse..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12.5, flex: 1, maxWidth: 360 }} />
        <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{filtered.length} records</span>
      </div>

      {loading && <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading inventory data...</div>}

      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No inventory records</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>First add products and warehouses, then create inventory records.</div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Inventory</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Stock Qty</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product?.name || 'Product #' + item.product_id}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{item.product?.sku || ''}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{item.warehouse?.name || 'WH #' + item.warehouse_id}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14 }}>{item.quantity}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f59e0b' }}>{item.reserved_quantity}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#10b981', fontWeight: 600 }}>{item.available_quantity}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--muted-foreground)' }}>{item.product?.reorder_level ?? 10}</td>
                  <td><span className={'badge ' + (statusBadge[item.status] || 'badge-gray')}>{item.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
  className="btn-ghost"
  onClick={() => handleEdit(item)}
  style={{ padding: '3px 8px', fontSize: 11.5, height: 26 }}
>
  Edit
</button>
                      <button onClick={() => setDeleteId(item.id)} style={{ padding: '3px 8px', fontSize: 11.5, height: 26, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#ef4444', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </td>
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
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
  {editingId !== null ? 'Edit Inventory Record' : 'Add Inventory Record'}
</h2>
              <button className="btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowAdd(false)}>X</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>PRODUCT *</label>
                <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--foreground)', fontSize: 13 }}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>WAREHOUSE *</label>
                <select value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))} style={{ width: '100%', padding: '8px 10px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--foreground)', fontSize: 13 }}>
                  <option value="">Select warehouse...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} {w.location ? '- ' + w.location : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>QUANTITY</label>
                  <input type="number" min={0} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>RESERVED QTY</label>
                  <input type="number" min={0} value={form.reserved_quantity} onChange={e => setForm(f => ({ ...f, reserved_quantity: e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>
  {saving ? 'Saving...' : editingId !== null ? 'Update Inventory' : 'Add Inventory'}
</button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card animate-in" style={{ width: 360, padding: 24, margin: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Remove Inventory Record?</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>This will remove this inventory entry. Stock data will be lost.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '7px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
