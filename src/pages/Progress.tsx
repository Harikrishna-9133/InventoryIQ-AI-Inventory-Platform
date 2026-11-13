import { useState, useEffect } from 'react'

// ─── Data ────────────────────────────────────────────────────────────────────

const kpiRings = [
  { label: 'Stock Optimization', value: 78, target: 90, color: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  { label: 'Order Fulfillment', value: 94, target: 98, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
  { label: 'Forecast Accuracy', value: 87, target: 90, color: '#06b6d4', glow: 'rgba(6,182,212,0.3)' },
  { label: 'Dead Stock Reduction', value: 62, target: 80, color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)' },
]

const milestones = [
  { id: 1, status: 'done', date: 'Aug 01', title: 'AI Model Deployed', desc: 'LSTM demand forecasting model went live with 87% accuracy', icon: '🤖', color: '#10b981' },
  { id: 2, status: 'done', date: 'Aug 08', title: 'Overstock Reduced ₹2.1L', desc: 'Sugar 50kg & Salt Iodized clearance campaign completed', icon: '📉', color: '#10b981' },
  { id: 3, status: 'done', date: 'Aug 13', title: 'Supplier Onboarding', desc: '3 new suppliers integrated — Sunrise FMCG, Metro Dist., BestPack', icon: '🤝', color: '#10b981' },
  { id: 4, status: 'active', date: 'Aug 20', title: 'Forecast Accuracy ≥ 90%', desc: 'Model retraining in progress — current: 87.4% MAPE', icon: '🎯', color: '#3b82f6' },
  { id: 5, status: 'active', date: 'Aug 28', title: 'Automate Top 5 Supplier POs', desc: '3 of 5 suppliers configured for auto-PO generation', icon: '⚡', color: '#f59e0b' },
  { id: 6, status: 'upcoming', date: 'Sep 10', title: 'Multi-Warehouse Sync', desc: 'Live inventory sync across all 5 warehouses', icon: '🏭', color: '#64748b' },
  { id: 7, status: 'upcoming', date: 'Sep 25', title: 'Customer Portal Launch', desc: 'Self-service portal for top 5 retail customers', icon: '🚀', color: '#64748b' },
]

const campaigns = [
  { id: 'C001', name: 'Monsoon Restock', items: 10, done: 7, value: '₹1.8L', eta: 'Aug 16', status: 'active', color: '#3b82f6' },
  { id: 'C002', name: 'Festive Season Prep', items: 15, done: 4, value: '₹4.2L', eta: 'Sep 05', status: 'active', color: '#8b5cf6' },
  { id: 'C003', name: 'Critical Stockout Recovery', items: 3, done: 3, value: '₹0.9L', eta: 'Aug 14', status: 'done', color: '#10b981' },
  { id: 'C004', name: 'Dead Stock Clearance', items: 8, done: 6, value: '₹2.1L', eta: 'Aug 20', status: 'active', color: '#f59e0b' },
]

const weeklyTrend = [
  { week: 'W1', accuracy: 81, acted: 4, savings: 38 },
  { week: 'W2', accuracy: 83, acted: 6, savings: 52 },
  { week: 'W3', accuracy: 86, acted: 5, savings: 61 },
  { week: 'W4', accuracy: 87, acted: 8, savings: 74 },
]

const aiActions = [
  { id: 1, icon: '✅', action: 'Reordered 145 units Atta Wheat Flour', outcome: 'Stockout avoided — saved ₹32,000', time: '8 min ago', type: 'success' },
  { id: 2, icon: '🔍', action: 'Flagged 3 dead-stock items (₹45K)', outcome: 'Clearance campaign triggered automatically', time: '2 hrs ago', type: 'info' },
  { id: 3, icon: '📈', action: 'Demand spike predicted: Rice +28% in WH-Mumbai', outcome: 'Pre-emptive reorder of 200 units placed', time: '8 hrs ago', type: 'success' },
  { id: 4, icon: '⚠️', action: 'Supplier delay detected: Metro Distributors', outcome: 'Alternate supplier (AgriPrime) auto-suggested', time: '1 day ago', type: 'warning' },
  { id: 5, icon: '🤖', action: 'Model retrained with Aug demand data', outcome: 'Forecast accuracy improved 81% → 87%', time: '2 days ago', type: 'success' },
  { id: 6, icon: '💡', action: 'Seasonal adjustment applied for Ghee', outcome: 'Safety stock raised from 10 → 15 units', time: '3 days ago', type: 'info' },
]

const teamActivity = [
  { name: 'Arjun Mehta', avatar: 'AM', color: '#3b82f6', actions: [3, 5, 4, 6, 7, 5, 8], role: 'Inventory Manager' },
  { name: 'Priya Sharma', avatar: 'PS', color: '#8b5cf6', actions: [2, 3, 5, 4, 3, 6, 4], role: 'Procurement Lead' },
  { name: 'Rohit Verma', avatar: 'RV', color: '#10b981', actions: [1, 2, 3, 2, 4, 3, 5], role: 'Warehouse Ops' },
  { name: 'Sneha Patel', avatar: 'SP', color: '#f59e0b', actions: [4, 4, 2, 3, 2, 4, 3], role: 'Supply Chain' },
]
const activityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── SVG Ring ─────────────────────────────────────────────────────────────────

function RingChart({ value, target, color, glow, size = 96 }: { value: number; target: number; color: string; glow: string; size?: number }) {
  const [animated, setAnimated] = useState(0)
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ
  const targetOffset = circ - (target / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 80)
    return () => clearTimeout(t)
  }, [value])

  return (
    <svg width={size} height={size} style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={7} strokeOpacity={0.2}
        strokeDasharray={circ} strokeDashoffset={targetOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={7}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={15} fontWeight={700} fontFamily="DM Sans, sans-serif">{value}%</text>
    </svg>
  )
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value), 120); return () => clearTimeout(t) }, [value])
  return (
    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${(w / max) * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Progress() {
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week')

  const totalSavings = weeklyTrend.reduce((s, w) => s + w.savings, 0)
  const avgAccuracy = Math.round(weeklyTrend.reduce((s, w) => s + w.accuracy, 0) / weeklyTrend.length)
  const totalActed = weeklyTrend.reduce((s, w) => s + w.acted, 0)

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Progress Tracker</h1>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>LIVE</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            Platform health · AI impact · Campaign milestones · Team performance
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost">Export Report</button>
          <button className="btn-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'AI Savings This Month', value: `₹${totalSavings}K`, sub: '+₹12K vs last month', color: '#10b981', icon: '💰' },
          { label: 'Avg Forecast Accuracy', value: `${avgAccuracy}%`, sub: '+6pp from baseline', color: '#06b6d4', icon: '🎯' },
          { label: 'AI Actions Taken', value: String(totalActed), sub: `${Math.round(totalActed * 100 / 24)}% recommendation rate`, color: '#8b5cf6', icon: '⚡' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 3 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* KPI Rings */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#06b6d4' }}>◉</span> Platform KPIs vs Targets
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {kpiRings.map(k => (
            <div key={k.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <RingChart value={k.value} target={k.target} color={k.color} glow={k.glow} size={96} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Target: <span style={{ color: k.color }}>{k.target}%</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  {k.value >= k.target
                    ? <span className="badge badge-green" style={{ fontSize: 10 }}>✓ On Target</span>
                    : <span className="badge badge-yellow" style={{ fontSize: 10 }}>↑ {k.target - k.value}% to go</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones + Campaigns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Milestone Timeline */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>◈</span> Milestone Timeline
            <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 'auto' }}>
              {milestones.filter(m => m.status === 'done').length}/{milestones.length} Done
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {milestones.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                {i < milestones.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 15, top: 28, width: 2, height: 'calc(100% + 2px)',
                    background: m.status === 'done' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                  background: m.status === 'done' ? 'rgba(16,185,129,0.15)' : m.status === 'active' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${m.status === 'done' ? '#10b981' : m.status === 'active' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, marginTop: 10,
                  boxShadow: m.status === 'active' ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                }}>
                  {m.status === 'done' ? '✓' : m.icon}
                </div>
                <div style={{ paddingBottom: 16, paddingTop: 8, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: m.status === 'upcoming' ? 'var(--muted-foreground)' : 'var(--foreground)',
                    }}>{m.title}</span>
                    {m.status === 'active' && (
                      <span className="animate-pulse-slow" style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginBottom: 3 }}>{m.desc}</div>
                  <div style={{ fontSize: 10.5, color: m.status === 'done' ? '#10b981' : m.status === 'active' ? '#3b82f6' : 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{m.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Campaigns */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#3b82f6' }}>⊕</span> Reorder Campaigns
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {campaigns.map(c => {
                const pct = Math.round((c.done / c.items) * 100)
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                        {c.status === 'done'
                          ? <span className="badge badge-green" style={{ fontSize: 10 }}>Done</span>
                          : <span className="badge badge-blue" style={{ fontSize: 10 }}>Active</span>
                        }
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {c.done}/{c.items} POs
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <MiniBar value={c.done} max={c.items} color={c.status === 'done' ? '#10b981' : c.color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: c.status === 'done' ? '#10b981' : c.color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Value: <strong style={{ color: 'var(--foreground)' }}>{c.value}</strong></span>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>ETA: <strong style={{ color: 'var(--foreground)' }}>{c.eta}</strong></span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#8b5cf6' }}>≋</span> Weekly AI Metrics
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['week', 'month'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: activeTab === t ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: activeTab === t ? '#60a5fa' : 'var(--muted-foreground)',
                    border: activeTab === t ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weeklyTrend.map(w => (
                <div key={w.week} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted-foreground)', flexShrink: 0 }}>{w.week}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#06b6d4', width: 60 }}>Accuracy</span>
                      <MiniBar value={w.accuracy} max={100} color="#06b6d4" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#06b6d4', width: 34, textAlign: 'right' }}>{w.accuracy}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#10b981', width: 60 }}>Savings</span>
                      <MiniBar value={w.savings} max={100} color="#10b981" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', width: 34, textAlign: 'right' }}>₹{w.savings}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Action Log + Team Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* AI Action Log */}
        <div className="card ai-glow" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#06b6d4' }}>🤖</span> AI Action Log
            <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 'auto' }}>LIVE FEED</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiActions.map((a, i) => (
              <div key={a.id} className="animate-in" style={{
                padding: '10px 12px', borderRadius: 8,
                background: a.type === 'success' ? 'rgba(16,185,129,0.05)' : a.type === 'warning' ? 'rgba(245,158,11,0.05)' : 'rgba(6,182,212,0.05)',
                border: `1px solid ${a.type === 'success' ? 'rgba(16,185,129,0.15)' : a.type === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.12)'}`,
                animationDelay: `${i * 0.05}s`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2 }}>{a.action}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{a.outcome}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Activity */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b' }}>👥</span> Team Activity
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 4 }}>— actions this week</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {teamActivity.map(m => {
              const total = m.actions.reduce((s, a) => s + a, 0)
              const maxVal = Math.max(...m.actions)
              return (
                <div key={m.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: `${m.color}20`, border: `2px solid ${m.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: m.color, fontFamily: 'JetBrains Mono, monospace',
                    }}>{m.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{m.role}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: 'DM Sans, sans-serif' }}>{total}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>actions</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 28 }}>
                    {m.actions.map((val, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{
                          width: '100%',
                          height: `${(val / maxVal) * 24}px`,
                          background: m.color,
                          opacity: 0.3 + (val / maxVal) * 0.7,
                          borderRadius: 3,
                          transition: 'height 0.6s ease',
                          minHeight: 4,
                        }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                    {activityDays.map(d => (
                      <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 9.5, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>{d[0]}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
