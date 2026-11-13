import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import Sidebar, { type Page } from './components/Sidebar'
import TopNav from './components/TopNav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AIForecasting from './pages/AIForecasting'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Suppliers from './pages/Suppliers'
import Recommendations from './pages/Recommendations'
import EmailNotifications from './pages/EmailNotifications'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import NotificationsPage from './pages/NotificationsPage'
import Settings from './pages/Settings'
import Progress from './pages/Progress'
import PurchaseOrders from './pages/PurchaseOrders'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  const { user, isLoading } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const handleThemeToggle = () => {
    setIsDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('light', !next)
      return next
    })
  }

  if (isLoading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text)' }}>Loading...</div>
  }

  if (!user) {
    return <Login />
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />
      case 'forecasting': return <AIForecasting />
      case 'inventory': return <Inventory />
      case 'customers': return <Customers />
      case 'suppliers': return <Suppliers />
      case 'recommendations': return <Recommendations />
      case 'purchase-orders': return <PurchaseOrders />
      case 'progress': return <Progress />
      case 'email': return <EmailNotifications />
      case 'analytics': return <Analytics />
      case 'reports': return <Reports />
      case 'notifications': return <NotificationsPage />
      case 'settings': return <Settings />
      case 'admin': return <AdminPanel />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
    }}>
      <Sidebar active={page} onNavigate={setPage} collapsed={collapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <TopNav
          page={page}
          onToggleSidebar={() => setCollapsed(c => !c)}
          onToggleTheme={handleThemeToggle}
          isDark={isDark}
          onNavigate={setPage}
        />
        <main style={{ flex: 1 }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
