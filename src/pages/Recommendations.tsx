import { useState, useEffect } from 'react'
import { getAIDecisions, createAIPurchaseOrder } from '../api'

type Decision = {
  product_id: number
  product_name: string
  decision: string
  reason: string
  current_stock: number
  forecast_demand: number
  reorder_level: number
  recommended_quantity?: number
  priority?: string
}

const priorityBadge: Record<string, string> = {
  CRITICAL: 'badge-red', HIGH: 'badge-orange', MEDIUM: 'badge-yellow', LOW: 'badge-green',
}

const decisionColor: Record<string, string> = {
  BUY: '#10b981', HOLD: '#3b82f6', SELL: '#f59e0b', CRITICAL: '#ef4444',
}

export default function Recommendations() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<number | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAIDecisions()
      setDecisions(Array.isArray(data) ? data : data?.decisions || [])
      setLastRefresh(new Date())
    } catch (e: any) {
      setError(e.message || 'Failed to load AI recommendations')
      setDecisions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreatePO = async (productId: number) => {
    setCreating(productId)
    try {
      await createAIPurchaseOrder(productId)
      alert('Purchase order created successfully!')
    } catch (e: any) {
      alert(e.message || 'Failed to create PO')
    } finally {
      setCreating(null)
    }
  }

  const critical = decisions.filter(d => d.decision === 'BUY' && (d.priority === 'CRITICAL' || d.current_stock === 0))
  const high = decisions.filter(d => d.decision === 'BUY' && d.priority === 'HIGH')
  const medium = decisions.filter(d => d.decision === 'BUY' && !['CRITICAL','HIGH'].includes(d.priority||''))

  const minutesAgo = Math.round((Date.now() - lastRefresh.getTime()) / 60000)

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Reorder Recommendations</h1>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>AI GENERATED</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            {loading ? 'Analyzing inventory with LSTM model...' : 'Updated ' + (minutesAgo < 1 ? 'just now' : minutesAgo + ' min ago') + ' · Based on LSTM demand forecast + supplier lead times'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh Forecast'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Critical Items', value: critical.length, color: '#ef4444', desc: 'Immediate action' },
          { label: 'High Priority', value: high.length, color: '#f97316', desc: 'Within 2 days' },
          { label: 'Medium Priority', value: medium.length, color: '#f59e0b', desc: 'Within 1 week' },
          { label: 'Total BUY Signals', value: decisions.filter(d => d.decision === 'BUY').length, color: '#3b82f6', desc: 'AI recommended' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 3 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>AI is analyzing inventory...</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Running LSTM forecast + decision engine</div>
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#ef4444' }}>Failed to load recommendations</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>{error}</div>
          <button className="btn-primary" onClick={load}>Try Again</button>
        </div>
      )}

      {!loading && !error && decisions.length === 0 && (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>All inventory levels are healthy</div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No reorder recommendations at this time. Check back later.</div>
        </div>
      )}

      {!loading && !error && decisions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {decisions.map(r => (
            <div key={r.product_id} className="card animate-in" style={{ padding: '18px 20px', borderLeft: '3px solid ' + (decisionColor[r.decision] || '#64748b') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{r.product_name}</span>
                    <span className={'badge ' + (priorityBadge[r.priority || ''] || 'badge-gray')} style={{ fontSize: 10 }}>{r.priority || r.decision}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: decisionColor[r.decision] || '#64748b', background: (decisionColor[r.decision] || '#64748b') + '18', padding: '2px 8px', borderRadius: 4 }}>{r.decision}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginBottom: 10 }}>{r.reason}</div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Current Stock', value: r.current_stock, color: r.current_stock === 0 ? '#ef4444' : r.current_stock < r.reorder_level ? '#f59e0b' : '#10b981' },
                      { label: 'Forecast Demand', value: Math.round(r.forecast_demand || 0), color: '#3b82f6' },
                      { label: 'Reorder Level', value: r.reorder_level, color: 'var(--muted-foreground)' },
                      { label: 'Recommended Qty', value: r.recommended_quantity || '—', color: '#8b5cf6' },
                    ].map(m => (
                      <div key={m.label}>
                        <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {r.decision === 'BUY' && (
                  <button className="btn-primary" style={{ flexShrink: 0, fontSize: 12.5 }} onClick={() => handleCreatePO(r.product_id)} disabled={creating === r.product_id}>
                    {creating === r.product_id ? 'Creating PO...' : 'Create Purchase Order'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
