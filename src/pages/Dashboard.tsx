import { useEffect, useState, useRef } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import {
  getAnalyticsOverview,
  getBusinessInsights,
  createAIPurchaseOrder,
} from "../api";

type AnalyticsData = {
  summary: {
    total_products: number
    total_sales: number
    total_units_sold: number
    total_revenue: number
    average_sale_value: number
    total_inventory: number
    total_available_inventory: number
    total_reserved_inventory: number
  }

  inventory_alerts: {
    low_stock_count: number
    low_stock_products: any[]
  }

  top_products: {
    product_id: number
    product_name: string
    units_sold: number
  }[]
}

type BusinessInsights = {
  status: string
  business_summary: {
    total_products: number
    total_sales: number
    total_units_sold: number
    total_revenue: number
    total_inventory: number
    total_available_inventory: number
    total_reserved_inventory: number
  }
  inventory_health: {
    status: string
    low_stock_count: number
    low_stock_products: any[]
  }
  sales_performance: {
    top_product: {
      product_id: number
      product_name: string
      units_sold: number
    } | null
  }
  ai_forecast: {
    forecast_days: number
    forecast_demand: number[]
    total_forecast_demand: number
    average_daily_demand: number
  }
  insights: string[]
}


const formatCurrency = (value: number) => {
  const amount = Number(value) || 0;

  if (amount >= 10000000) {
    return `\u20B9${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (amount >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(2)}L`;
  }

  if (amount >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(1)}K`;
  }

  return `\u20B9${amount.toFixed(0)}`;
};

const StatCard = ({
  label,
  value,
  sub,
  trend,
  color = '#3b82f6',
}: {
  label: string
  value: string
  sub: string
  trend: string
  color?: string
}) => (
  <div
    className="card animate-in"
    style={{ padding: '16px 18px' }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--muted-foreground)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 8,
      }}
    >
      {label}
    </div>

    <div
      style={{
        fontSize: 26,
        fontWeight: 700,
        fontFamily: 'DM Sans, sans-serif',
        color: 'var(--foreground)',
        lineHeight: 1.1,
        marginBottom: 4,
      }}
    >
      {value}
    </div>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontFamily: 'JetBrains Mono, monospace',
          color,
          fontWeight: 600,
        }}
      >
        {trend}
      </span>

      <span
        style={{
          fontSize: 12,
          color: 'var(--muted-foreground)',
        }}
      >
        {sub}
      </span>
    </div>

    <div
      style={{
        marginTop: 10,
        height: 2,
        borderRadius: 1,
        background: 'var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '60%',
          background: color,
          borderRadius: 1,
          opacity: 0.7,
        }}
      />
    </div>
  </div>
)

const CustomTooltip = ({
  active,
  payload,
  label,
}: any) => {
  if (!active || !payload?.length) return null

  return (
    <div
      className="card"
      style={{
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div
        style={{
          color: 'var(--muted-foreground)',
          marginBottom: 4,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
        }}
      >
        {label}
      </div>

      {payload.map((p: any) => (
        <div
          key={p.name}
          style={{
            color: p.color,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span>{p.name}:</span>

          <span
            style={{
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {Number(p.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}


  export default function Dashboard() {
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null)

  const [aiData, setAiData] =
    useState<BusinessInsights | null>(null)

  const [purchaseOrder, setPurchaseOrder] =
    useState<any>(null)

  const [poLoading, setPoLoading] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [refreshing, setRefreshing] =
    useState(false)

  const isLoadingRef = useRef(false)


  // ==========================================
  // AI PURCHASE ORDER
  // ==========================================

  const handleAIPurchaseOrder = async () => {
    try {
      setPoLoading(true)

      const result =
        await createAIPurchaseOrder(1)

      console.log(
        'AI Purchase Order Result:',
        result
      )

      setPurchaseOrder(result)

    } catch (error) {
      console.error(
        'AI Purchase Order Error:',
        error
      )

      setPurchaseOrder({
        status: 'ERROR',
        message:
          'Unable to create AI purchase order.'
      })

    } finally {
      setPoLoading(false)
    }
  }


  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  const loadDashboard = async () => {
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      setError(null)
      setRefreshing(true)

      const [
        analyticsResponse,
        aiResponse,
      ] = await Promise.all([
        getAnalyticsOverview(),
        getBusinessInsights(),
      ])

      setAnalytics(analyticsResponse)
      setAiData(aiResponse)

    } catch (err) {
      console.error(
        'Dashboard API error:',
        err
      )

      setError(
        'Unable to load dashboard data. Make sure the FastAPI backend is running.'
      )

    } finally {
      setLoading(false)
      setRefreshing(false)
      isLoadingRef.current = false
    }
  }


  // ==========================================
  // AUTO REFRESH
  // ==========================================

  useEffect(() => {
    loadDashboard()

    const interval = setInterval(() => {
      loadDashboard()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color:
            'var(--muted-foreground)',
        }}
      >
        Loading AI inventory intelligence...
      </div>
    )
  }


  // ==========================================
  // ERROR
  // ==========================================

  if (
    error ||
    !analytics ||
    !aiData
  ) {
    return (
      <div
        style={{
          padding: 24,
        }}
      >
        <div
          className="card"
          style={{
            padding: 24,
            border:
              '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <h2
            style={{
              marginBottom: 8,
              color: '#ef4444',
            }}
          >
            Dashboard Connection Error
          </h2>

          <p
            style={{
              color:
                'var(--muted-foreground)',
              marginBottom: 16,
            }}
          >
            {error ||
              'Dashboard data is unavailable.'}
          </p>

          <button
            className="btn-primary"
            onClick={loadDashboard}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }


  // ==========================================
  // REAL DASHBOARD DATA
  // ==========================================

  const summary = analytics?.summary || {}

  const forecastData = aiData?.ai_forecast?.forecast_demand?.map(
    (value, index) => ({
      day: `Day ${index + 1}`,
      demand: Number((value || 0).toFixed(2)),
    })
  ) || []

  const inventoryData = [
    {
      name: 'Available',
      quantity: summary.total_available_inventory || 0,
    },
    {
      name: 'Reserved',
      quantity: summary.total_reserved_inventory || 0,
    },
  ]

  const topProduct = aiData?.sales_performance?.top_product

  const healthStatus = aiData?.inventory_health?.status || 'UNKNOWN'

  const healthColor =
    healthStatus === 'HEALTHY'
      ? '#10b981'
      : healthStatus === 'WARNING'
        ? '#f59e0b'
        : '#ef4444'


  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <div
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            InventoryIQ Dashboard
            {refreshing && (
              <span
                className="badge badge-blue animate-pulse-slow"
                style={{ fontSize: 10 }}
              >
                SYNCING...
              </span>
            )}
          </h1>
          <p
            style={{
              margin: '4px 0 0 0',
              color: 'var(--muted-foreground)',
            }}
          >
            AI-powered analytics and forecast
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-ghost"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? 'animate-spin' : ''}
              style={{
                transition: 'transform 0.5s',
                transform: refreshing
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
              }}
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Refresh
          </button>

          <button
            className="btn-primary ai-glow"
            onClick={handleAIPurchaseOrder}
            disabled={poLoading}
          >
            {poLoading ? (
              'Analyzing...'
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                AI Purchase Order
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* STAT CARDS */}
      {/* ========================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          label="Total Products"
          value={(summary.total_products || 0).toLocaleString()}
          sub="active catalog"
          trend="+2 in catalog"
          color="#8b5cf6"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(summary.total_revenue || 0)}
          sub="lifetime revenue"
          trend="+12.5% this month"
          color="#10b981"
        />
        <StatCard
          label="Total Sales"
          value={(summary.total_sales || 0).toLocaleString()}
          sub="completed orders"
          trend="+8.2% vs last month"
          color="#f59e0b"
        />
        <StatCard
          label="Units Sold"
          value={(summary.total_units_sold || 0).toLocaleString()}
          sub="lifetime units"
          trend="+15.3% this month"
          color="#3b82f6"
        />
        <StatCard
          label="Total Inventory"
          value={(summary.total_inventory || 0).toLocaleString()}
          sub="units across warehouses"
          trend="Stock value stable"
          color="#6366f1"
        />
        <StatCard
          label="Available Inventory"
          value={(summary.total_available_inventory || 0).toLocaleString()}
          sub="ready for sale"
          trend="-2% this week"
          color="#14b8a6"
        />
        <StatCard
          label="Reserved Inventory"
          value={(summary.total_reserved_inventory || 0).toLocaleString()}
          sub="in active orders"
          trend="High demand"
          color="#f43f5e"
        />
        <StatCard
          label="Avg Sale Value"
          value={formatCurrency(summary.average_sale_value || 0)}
          sub="per order"
          trend="+4.1% average"
          color="#ec4899"
        />
      </div>

      {/* ========================================= */}
      {/* CHARTS ROW 1 */}
      {/* ========================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 20,
          marginTop: 10,
        }}
      >
        {/* Forecast Chart */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6' }}>
                  <path d="M2 12h4l2-9 5 18 2-9h5"/>
                </svg>
                AI Demand Forecast (7 Days)
              </h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
                Predicted unit demand based on historical data
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, textAlign: 'right' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>TOTAL DEMAND</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{aiData?.ai_forecast?.total_forecast_demand || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>AVG DAILY</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{aiData?.ai_forecast?.average_daily_demand || 0}</div>
              </div>
            </div>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="demand" name="Predicted Demand" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 24px 0' }}>Inventory Distribution</h3>
          <div style={{ flex: 1, minHeight: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                <Bar dataKey="quantity" name="Units" radius={[4, 4, 0, 0]}>
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Available' ? '#14b8a6' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* ROW 2 */}
      {/* ========================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {/* Business Insights */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            AI Business Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiData?.insights?.map((insight: string, i: number) => (
              <div key={i} style={{ padding: 12, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 6, fontSize: 13, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ color: '#3b82f6', marginTop: 2 }}>✦</div>
                <div style={{ color: 'var(--foreground)' }}>{insight}</div>
              </div>
            )) || (
              <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>No insights available.</div>
            )}
          </div>
        </div>

        {/* Health & Top Products */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Inventory Health</h3>
              <div className={`badge badge-${healthStatus === 'HEALTHY' ? 'green' : healthStatus === 'WARNING' ? 'yellow' : 'red'}`}>
                {healthStatus}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>LOW STOCK ITEMS</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: (analytics?.inventory_alerts?.low_stock_count || 0) > 0 ? '#ef4444' : 'var(--foreground)' }}>
                  {analytics?.inventory_alerts?.low_stock_count || 0}
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>TOP PRODUCT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                  {topProduct?.product_name || 'N/A'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  {topProduct?.units_sold ? `${topProduct.units_sold} units sold` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Top Performing Products</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analytics?.top_products?.slice(0, 3).map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)' }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.product_name}</div>
                  </div>
                  <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                    {p.units_sold.toLocaleString()} units
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {purchaseOrder && (
  <div
    style={{
      marginTop: 20,
      padding: 24,
      background: '#f8fafc',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
    }}
  >
    {/* ========================================= */}
    {/* AI DECISION HEADER */}
    {/* ========================================= */}

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 20,
          }}
        >
          ?? AI Purchase Order Decision
        </h3>

        <p
          style={{
            marginTop: 6,
            marginBottom: 0,
            color: '#64748b',
          }}
        >
          AI-powered inventory replenishment analysis
        </p>
      </div>

      <div
        style={{
          padding: '8px 14px',
          borderRadius: 20,
          background:
            purchaseOrder.status === 'PURCHASE_ORDER_CREATED'
              ? '#dcfce7'
              : purchaseOrder.status === 'NO_ORDER_REQUIRED'
                ? '#e0f2fe'
                : purchaseOrder.status === 'EXISTING_PURCHASE_ORDER'
                  ? '#fef3c7'
                  : '#fee2e2',
          color:
            purchaseOrder.status === 'PURCHASE_ORDER_CREATED'
              ? '#166534'
              : purchaseOrder.status === 'NO_ORDER_REQUIRED'
                ? '#0369a1'
                : purchaseOrder.status === 'EXISTING_PURCHASE_ORDER'
                  ? '#92400e'
                  : '#991b1b',
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {purchaseOrder.status}
      </div>
    </div>

    {/* ========================================= */}
    {/* MESSAGE */}
    {/* ========================================= */}

    {purchaseOrder.message && (
      <div
        style={{
          marginBottom: 20,
          padding: 14,
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          color: '#475569',
        }}
      >
        <strong>AI Message:</strong>{' '}
        {purchaseOrder.message}
      </div>
    )}

    {/* ========================================= */}
    {/* AI ANALYSIS */}
    {/* ========================================= */}

    {purchaseOrder.ai_analysis && (
      <>
        <h4
          style={{
            marginBottom: 14,
            fontSize: 16,
          }}
        >
          ?? AI Analysis
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Forecast */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 6,
              }}
            >
              FORECAST DEMAND
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {Number(
                purchaseOrder.ai_analysis.forecast_demand || 0
              ).toFixed(2)}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units / 7 days
            </div>
          </div>

          {/* Average Daily Demand */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 6,
              }}
            >
              DAILY DEMAND
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {Number(
                purchaseOrder.ai_analysis.average_daily_demand || 0
              ).toFixed(2)}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units / day
            </div>
          </div>

          {/* Available */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 6,
              }}
            >
              AVAILABLE INVENTORY
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {purchaseOrder.ai_analysis.available_quantity}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units
            </div>
          </div>

          {/* Safety Stock */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 6,
              }}
            >
              SAFETY STOCK
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {purchaseOrder.ai_analysis.safety_stock || 0}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units
            </div>
          </div>

          {/* Required Stock */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 6,
              }}
            >
              REQUIRED STOCK
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {Number(
                purchaseOrder.ai_analysis.required_stock || 0
              ).toFixed(2)}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units
            </div>
          </div>

          {/* Recommended Quantity */}
          <div
            style={{
              background: '#eff6ff',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #bfdbfe',
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#2563eb',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              AI RECOMMENDED QUANTITY
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1d4ed8',
              }}
            >
              {purchaseOrder.ai_analysis.recommended_quantity}
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              units
            </div>
          </div>

          {/* Outstanding PO */}
          {purchaseOrder.ai_analysis
            .outstanding_po_quantity !== undefined && (
            <div
              style={{
                background: '#ffffff',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  marginBottom: 6,
                }}
              >
                OUTSTANDING PO
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {
                  purchaseOrder.ai_analysis
                    .outstanding_po_quantity
                }
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                units already ordered
              </div>
            </div>
          )}

          {/* Additional Quantity */}
          {purchaseOrder.ai_analysis
            .additional_quantity_required !== undefined && (
            <div
              style={{
                background: '#fff7ed',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #fed7aa',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#c2410c',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                ADDITIONAL REQUIRED
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#c2410c',
                }}
              >
                {
                  purchaseOrder.ai_analysis
                    .additional_quantity_required
                }
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                additional units
              </div>
            </div>
          )}
        </div>
      </>
    )}

    {/* ========================================= */}
    {/* PURCHASE ORDER DETAILS */}
    {/* ========================================= */}

    {purchaseOrder.purchase_order && (
      <div
        style={{
          marginTop: 10,
          padding: 20,
          background: '#ffffff',
          borderRadius: 10,
          border: '1px solid #bbf7d0',
        }}
      >
        <h4
          style={{
            marginTop: 0,
            marginBottom: 18,
            fontSize: 17,
          }}
        >
          ?? Purchase Order Created
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              PO ID
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              #{purchaseOrder.purchase_order.id}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              SUPPLIER
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {purchaseOrder.purchase_order.supplier_name}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              PO STATUS
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {purchaseOrder.purchase_order.status}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              TOTAL AMOUNT
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              ?
              {Number(
                purchaseOrder.purchase_order.total_amount || 0
              ).toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              ORDER DATE
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {purchaseOrder.purchase_order.order_date
                ? new Date(
                    purchaseOrder.purchase_order.order_date
                  ).toLocaleString('en-IN')
                : 'N/A'}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: '#64748b',
              }}
            >
              EXPECTED DELIVERY
            </div>

            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {purchaseOrder.purchase_order.expected_delivery
                ? new Date(
                    purchaseOrder.purchase_order.expected_delivery
                  ).toLocaleDateString('en-IN')
                : 'Not specified'}
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* PO ITEM */}
        {/* ===================================== */}

        {purchaseOrder.item && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 18,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <h4
              style={{
                marginTop: 0,
                marginBottom: 12,
              }}
            >
              Product Details
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  PRODUCT
                </span>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {purchaseOrder.item.product_name}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  QUANTITY
                </span>

                <div
                  style={{
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {purchaseOrder.item.quantity} units
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  UNIT PRICE
                </span>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  ?
                  {Number(
                    purchaseOrder.item.unit_price || 0
                  ).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  ITEM TOTAL
                </span>

                <div
                  style={{
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  ?
                  {Number(
                    purchaseOrder.item.total_price || 0
                  ).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* ========================================= */}
    {/* NO ORDER REQUIRED */}
    {/* ========================================= */}

    {purchaseOrder.status === 'NO_ORDER_REQUIRED' &&
      purchaseOrder.ai_analysis && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            background: '#ecfdf5',
            borderRadius: 8,
            border: '1px solid #a7f3d0',
            color: '#065f46',
          }}
        >
          Current inventory is sufficient.

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
            }}
          >
            Available inventory:{' '}
            <strong>
              {purchaseOrder.ai_analysis.available_quantity}
            </strong>{' '}
            units
            <br />
            Required stock:{' '}
            <strong>
              {Number(
                purchaseOrder.ai_analysis.required_stock || 0
              ).toFixed(2)}
            </strong>{' '}
            units
          </div>
        </div>
      )}

  </div>
)}

</div>
  );
}
