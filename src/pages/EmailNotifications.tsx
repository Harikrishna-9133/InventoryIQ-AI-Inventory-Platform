import { useState } from 'react'
import { apiFetch } from '../api'
import { emailLogs } from '../data/mockData'

const statusBadge: Record<string, string> = {
  Sent: 'badge-green',
  Scheduled: 'badge-blue',
  Failed: 'badge-red',
}

const emailTemplates = [
  { type: 'Low Stock Alert', icon: '⚠', color: '#f59e0b', desc: 'Triggered when stock falls below reorder level', enabled: true },
  { type: 'Stockout Warning', icon: '⛔', color: '#ef4444', desc: 'Triggered when product reaches 0 units', enabled: true },
  { type: 'Reorder Notification', icon: '↺', color: '#3b82f6', desc: 'AI-recommended reorder quantity ready', enabled: true },
  { type: 'Supplier Notification', icon: '⊠', color: '#8b5cf6', desc: 'Automatic PO emails to suppliers', enabled: false },
  { type: 'Weekly Report', icon: '⊞', color: '#10b981', desc: 'Full inventory summary every Monday 9AM', enabled: true },
]

export default function EmailNotifications() {
  const [preview, setPreview] = useState<typeof emailLogs[0] | null>(emailLogs[0])
  const [toggled, setToggled] = useState<Record<string, boolean>>(
    Object.fromEntries(emailTemplates.map(t => [t.type, t.enabled]))
  )
  const [loading, setLoading] = useState(false)
  const [testSupplierEmail, setTestSupplierEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const handleTriggerAlerts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/ai/reorder-alerts')
      alert(`AI Scan Complete!\nGenerated ${data.alert_count} alerts and dispatched direct emails to Admin & Suppliers.`)
    } catch (e: any) {
      alert("Failed to trigger alerts: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTestEmail = async () => {
    setSendingTest(true)
    try {
      const url = testSupplierEmail.trim()
        ? `/api/ai/send-test-email?supplier_email=${encodeURIComponent(testSupplierEmail.trim())}`
        : '/api/ai/send-test-email'
      const res = await apiFetch(url, { method: 'POST' })
      alert(`Test Email Dispatched!\nRecipients: ${res.details.recipients.join(', ')}`)
    } catch (e: any) {
      alert("Test email failed: " + e.message)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Email Automation Center</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            Direct Email Routing: <span style={{ color: '#10b981', fontWeight: 600 }}>Active</span> (Emails sent directly to Admin & Suppliers)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handleSendTestEmail} disabled={sendingTest} style={{ fontSize: 12.5 }}>
            {sendingTest ? 'Sending Test...' : '✉ Test Email to Admin & Supplier'}
          </button>
          <button className="btn-primary" onClick={handleTriggerAlerts} disabled={loading} style={{ opacity: loading ? 0.8 : 1, fontSize: 12.5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            {loading ? 'Scanning...' : 'Trigger AI Alert Scan'}
          </button>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Automation Rules</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emailTemplates.map(t => (
            <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.type}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1 }}>{t.desc}</div>
              </div>
              <button
                onClick={() => setToggled(prev => ({ ...prev, [t.type]: !prev[t.type] }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: toggled[t.type] ? '#3b82f6' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: toggled[t.type] ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </button>
              <span className={`badge ${toggled[t.type] ? 'badge-green' : 'badge-gray'}`} style={{ minWidth: 52, justifyContent: 'center' }}>{toggled[t.type] ? 'Active' : 'Off'}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Email Log */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Email Log</div>
          <table>
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Type</th>
                <th>Product</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.map(e => (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setPreview(e)}>
                  <td style={{ fontSize: 12.5 }}>{e.recipient}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{e.type}</td>
                  <td style={{ fontSize: 12.5, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.product}</td>
                  <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)' }}>{e.date}</td>
                  <td><span className={`badge ${statusBadge[e.status]}`}>{e.status}</span></td>
                  <td>
                    <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 11.5, height: 26 }}>Preview</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Email Preview</div>
          {preview ? (
            <div style={{ padding: 16, flex: 1 }}>
              {/* Email mock */}
              <div style={{ background: 'var(--secondary)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* Email header */}
                <div style={{ padding: '10px 14px', background: 'linear-gradient(90deg, #1e3a5f 0%, #1e2a4a 100%)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>InventoryIQ</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>noreply@inventoryiq.ai</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    {preview.type}: {preview.product}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: 12 }}>
                    Dear Customer,<br /><br />
                    This is an automated notification from <strong>InventoryIQ</strong> regarding <strong>{preview.product}</strong>.<br /><br />
                    {preview.type === 'Low Stock Alert' && 'The current stock has dropped below the configured reorder threshold. Immediate action is recommended to avoid stockout.'}
                    {preview.type === 'Stockout Warning' && 'The product has reached 0 units. Please create a purchase order immediately.'}
                    {preview.type === 'Reorder Notification' && 'Our LSTM model recommends a reorder. Predicted demand for the next 30 days exceeds current available stock.'}
                    {preview.type === 'Weekly Report' && 'Your weekly inventory health report is attached. Review trends and forecasts for the coming week.'}
                    {preview.type === 'Supplier Notification' && 'A purchase order has been generated automatically and requires your review.'}
                  </div>
                  <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>PRODUCT DETAILS</div>
                    <div style={{ fontSize: 12.5 }}>{preview.product}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 3 }}>Sent: {preview.date}</div>
                  </div>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12.5 }}>
                    View in InventoryIQ →
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>To: {preview.recipient}</span>
                <span className={`badge ${statusBadge[preview.status]}`} style={{ marginLeft: 'auto' }}>{preview.status}</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
              Select an email to preview
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
