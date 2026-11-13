import { useState } from 'react'

const reportTypes = [
  { id: 'inventory', name: 'Inventory Report', desc: 'Complete stock levels, movements, and valuations', icon: '⊟', color: '#3b82f6', lastGen: 'Aug 12, 2026' },
  { id: 'sales', name: 'Sales Report', desc: 'Revenue breakdown by product, customer, and period', icon: '≋', color: '#10b981', lastGen: 'Aug 12, 2026' },
  { id: 'forecast', name: 'Demand Forecast Report', desc: 'LSTM model predictions, accuracy metrics, confidence bands', icon: '⌬', color: '#06b6d4', lastGen: 'Aug 13, 2026' },
  { id: 'stockout', name: 'Stockout Report', desc: 'Products at risk, historical stockout events, cost impact', icon: '⚠', color: '#ef4444', lastGen: 'Aug 11, 2026' },
  { id: 'supplier', name: 'Supplier Report', desc: 'Performance scores, lead times, order history', icon: '⊠', color: '#8b5cf6', lastGen: 'Aug 10, 2026' },
  { id: 'customer', name: 'Customer Report', desc: 'Per-customer inventory, value, and activity analysis', icon: '◎', color: '#f59e0b', lastGen: 'Aug 12, 2026' },
]

const recentReports = [
  { name: 'Inventory Report — Aug 12', type: 'Inventory', size: '2.4 MB', format: 'PDF', date: 'Aug 12, 17:02' },
  { name: 'Weekly Demand Forecast — Aug 13', type: 'Forecast', size: '1.1 MB', format: 'Excel', date: 'Aug 13, 09:00' },
  { name: 'Stockout Analysis — Q3', type: 'Stockout', size: '890 KB', format: 'CSV', date: 'Aug 11, 14:30' },
  { name: 'Customer Performance — Aug', type: 'Customer', size: '1.8 MB', format: 'PDF', date: 'Aug 10, 10:15' },
]

const formatColor: Record<string, string> = { PDF: '#ef4444', Excel: '#10b981', CSV: '#3b82f6' }

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null)

  const handleGenerate = (id: string) => {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 1800)
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reports</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Generate, schedule, and export business reports</div>
        </div>
        <button className="btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Schedule Report
        </button>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {reportTypes.map(r => (
          <div key={r.id} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
              Last generated: {r.lastGen}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5 }}>
              <button
                className="btn-primary"
                style={{ gridColumn: 'span 2', justifyContent: 'center', fontSize: 12, padding: '6px', opacity: generating === r.id ? 0.7 : 1 }}
                onClick={() => handleGenerate(r.id)}
              >
                {generating === r.id ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="animate-pulse-slow">⏳</span> Generating…
                  </span>
                ) : 'Generate'}
              </button>
              {[{ label: 'PDF', icon: '⬇' }, { label: 'Excel', icon: '⬇' }, { label: 'CSV', icon: '⬇' }].map(f => (
                <button key={f.label} className="btn-ghost" style={{ justifyContent: 'center', fontSize: 11, padding: '6px 0' }}>
                  <span style={{ color: formatColor[f.label], fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent Reports</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentReports.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px', borderRadius: 6, background: 'var(--secondary)', border: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, background: `${formatColor[r.format]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, color: formatColor[r.format], flexShrink: 0 }}>{r.format}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{r.size}</div>
              </div>
              <span className="badge badge-gray" style={{ fontSize: 10 }}>{r.type}</span>
              <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', minWidth: 100, textAlign: 'right' }}>{r.date}</span>
              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
