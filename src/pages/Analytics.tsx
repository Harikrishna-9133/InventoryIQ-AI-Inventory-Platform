import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { revenueAnalyticsData, warehouseData, inventoryTrendData } from '../data/mockData'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card" style={{ padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted-foreground)', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 14 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
            {typeof p.value === 'number' && p.value > 10000 ? `₹${(p.value / 1000).toFixed(0)}k` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const kpis = [
  { label: 'Inventory Turnover', value: '8.4x', sub: '+0.6x vs last period', trend: 'up', color: '#3b82f6' },
  { label: 'Stockout Rate', value: '1.2%', sub: '−0.4% improvement', trend: 'down', color: '#10b981' },
  { label: 'Overstock Rate', value: '8.3%', sub: '+1.1% increase', trend: 'up', color: '#f59e0b' },
  { label: 'Demand Growth', value: '+18%', sub: 'YoY comparison', trend: 'up', color: '#8b5cf6' },
]

const productPerf = [
  { name: 'Basmati Rice 25kg', revenue: 142000, turnover: 9.2, margin: 22 },
  { name: 'Sunflower Oil 5L', revenue: 118000, turnover: 7.8, margin: 18 },
  { name: 'Toor Dal 10kg', revenue: 96000, turnover: 6.4, margin: 24 },
  { name: 'Sugar 50kg', revenue: 84000, turnover: 8.1, margin: 14 },
  { name: 'Atta Flour 10kg', revenue: 71000, turnover: 5.9, margin: 19 },
]

export default function Analytics() {
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Analytics</h1>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Performance insights · Aug 2026 · All Warehouses</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="btn-ghost" style={{ height: 34, fontSize: 12.5, border: '1px solid var(--border)', paddingRight: 24 }}>
            <option>Last 8 Months</option>
            <option>Last Quarter</option>
            <option>YTD</option>
          </select>
          <button className="btn-primary" style={{ height: 34 }}>Export Analytics</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue & Profit */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Revenue & Profitability Trend</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>Monthly breakdown (₹ thousands)</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueAnalyticsData}>
            <defs>
              {[{ id: 'rev', color: '#3b82f6' }, { id: 'profit', color: '#10b981' }].map(g => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={g.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" name="Revenue" dot={false} />
            <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profit)" name="Profit" dot={false} />
            <Line type="monotone" dataKey="cost" stroke="#64748b" strokeWidth={1.5} dot={false} name="Cost" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Inventory health trend */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inventory Health Trend</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 16 }}>Stock status distribution over time</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={inventoryTrendData} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }} />
              <Bar dataKey="inStock" fill="#3b82f6" radius={[2,2,0,0]} name="In Stock" />
              <Bar dataKey="lowStock" fill="#f59e0b" radius={[2,2,0,0]} name="Low Stock" />
              <Bar dataKey="outOfStock" fill="#ef4444" radius={[2,2,0,0]} name="Out of Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Warehouse utilization */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Warehouse Utilization</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14 }}>Capacity usage across locations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {warehouseData.map(w => (
              <div key={w.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{w.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: w.utilization >= 85 ? '#ef4444' : w.utilization >= 70 ? '#f59e0b' : '#10b981' }}>{w.utilization}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--secondary)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${w.utilization}%`, height: '100%', borderRadius: 3,
                    background: w.utilization >= 85 ? '#ef4444' : w.utilization >= 70 ? '#f59e0b' : '#3b82f6',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3, fontFamily: 'JetBrains Mono, monospace' }}>{w.used.toLocaleString()} / {w.capacity.toLocaleString()} units</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Product Performance</div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Monthly Revenue</th>
                <th>Turnover Rate</th>
                <th>Gross Margin</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {productPerf.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#3b82f6' }}>₹{(p.revenue / 1000).toFixed(0)}k</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{p.turnover}x</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: p.margin >= 20 ? '#10b981' : '#f59e0b' }}>{p.margin}%</td>
                  <td style={{ minWidth: 100 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--secondary)', overflow: 'hidden' }}>
                      <div style={{ width: `${(p.revenue / 145000) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: 2 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
