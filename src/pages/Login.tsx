import { useState, useEffect } from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api'

const roles = [
  { value: 'admin', label: 'Admin', icon: '🛡️', desc: 'Full system access & user management' },
  { value: 'inventory_manager', label: 'Inventory Manager', icon: '📦', desc: 'Manage stock, reorders & forecasts' },
  { value: 'accountant', label: 'Accountant', icon: '💼', desc: 'Financial reports & purchase orders' },
  { value: 'supplier', label: 'Supplier', icon: '🚚', desc: 'Manage supply & delivery details' },
]

export default function Login() {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPw, setShowLoginPw] = useState(false)
  const [remember, setRemember] = useState(true)

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regRole, setRegRole] = useState('inventory_manager')
  const [showRegPw, setShowRegPw] = useState(false)

  // Forgot / Reset password
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmNewPw, setConfirmNewPw] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)

  // On mount: check if URL has ?reset_token=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) {
      setResetToken(token)
      setMode('reset')
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      })
      if (response.success) {
        showToast('Signed in successfully!', 'success')
        setTimeout(() => login(response.token, response.user), 500)
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      if (response.success) {
        showToast('Welcome back!', 'success')
        setTimeout(() => login(response.token, response.user), 500)
      } else {
        showToast('Login failed. Please check your credentials.', 'error')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('approval')) {
        showToast('⏳ Your account is pending admin approval. Please wait.', 'info')
      } else if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('deactivated')) {
        showToast('🚫 Your account has been deactivated. Contact support.', 'error')
      } else {
        showToast(msg || 'Invalid email or password. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      showToast('If that email has an account, a reset link was sent. Check your inbox!', 'success')
      setForgotEmail('')
      setTimeout(() => setMode('login'), 3000)
    } catch (err: any) {
      showToast(err.message || 'Something went wrong. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmNewPw) { showToast('Passwords do not match', 'error'); return }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return }
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: newPw })
      })
      showToast(res.message || 'Password updated! You can now sign in.', 'success')
      setNewPw(''); setConfirmNewPw(''); setResetToken('')
      setTimeout(() => setMode('login'), 2500)
    } catch (err: any) {
      showToast(err.message || 'Reset failed. The link may have expired.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regPassword !== regConfirm) {
      showToast('Passwords do not match.', 'error')
      return
    }
    if (regPassword.length < 8) {
      showToast('Password must be at least 8 characters.', 'error')
      return
    }
    // Enforce at least fair strength: must have a letter + a number or symbol
    const hasLetter = /[a-zA-Z]/.test(regPassword)
    const hasNumberOrSymbol = /[0-9!@#$%^&*]/.test(regPassword)
    if (!hasLetter || !hasNumberOrSymbol) {
      showToast('Password must contain letters and at least one number or symbol.', 'error')
      return
    }
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole })
      })
      // Handle both {success: true} and any 2xx that has token/user
      if (response.token && response.user) {
        showToast('Account created! Signing you in…', 'success')
        setTimeout(() => login(response.token, response.user), 600)
      } else if (response.success) {
        showToast('Account created! Signing you in…', 'success')
        setTimeout(() => login(response.token, response.user), 600)
      } else {
        // Server returned 2xx but no token — treat as pending
        showToast('✅ Account created! Check your email or wait for approval.', 'info')
        setMode('login')
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed.'
      // Admin role returns HTTP 202 via HTTPException which apiFetch throws
      if (
        msg.toLowerCase().includes('approval') ||
        msg.toLowerCase().includes('pending') ||
        msg.toLowerCase().includes('admin') ||
        msg.toLowerCase().includes('accepted')
      ) {
        showToast('✅ Account created! Waiting for admin approval. You\'ll be notified.', 'info')
        setMode('login')
      } else if (msg.toLowerCase().includes('exists') || msg.toLowerCase().includes('already')) {
        showToast('An account with this email already exists. Try signing in.', 'error')
      } else {
        showToast(msg, 'error')
      }
    } finally {
      setLoading(false)
    }
  }


  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.06em',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080d1a',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.35)' : toast.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(59,130,246,0.35)'}`,
          color: toast.type === 'error' ? '#f87171' : toast.type === 'success' ? '#34d399' : '#60a5fa',
          fontSize: 13.5, fontWeight: 500,
          backdropFilter: 'blur(10px)',
          animation: 'slideDown 0.3s ease',
        }}>
          {toast.type === 'error' ? '⚠ ' : toast.type === 'success' ? '✓ ' : 'ℹ '}{toast.msg}
        </div>
      )}

      {/* Left — Brand panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: 'white',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}>IQ</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.1 }}>InventoryIQ</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>PREDICT · OPTIMIZE · AUTOMATE</div>
          </div>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>
          AI-Powered<br />
          <span style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Inventory Intelligence</span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 440, marginBottom: 48 }}>
          LSTM-powered demand forecasting, automated reorder alerts, and real-time analytics — all in one platform designed for modern supply chains.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 460 }}>
          {[
            { value: '94.2%', label: 'Forecast Accuracy', color: '#06b6d4', icon: '📈' },
            { value: '₹12.6L', label: 'Inventory Managed', color: '#8b5cf6', icon: '💰' },
            { value: '8 days', label: 'Stockout Prevention', color: '#3b82f6', icon: '🛡️' },
            { value: '18%', label: 'Avg Demand Growth', color: '#10b981', icon: '🚀' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '16px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 11, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'DM Sans, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth panel */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
          padding: '36px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 80px rgba(0,0,0,0.4)',
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}>
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.2s',
                  background: mode === tab ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
                  color: mode === tab ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: mode === tab ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                {tab === 'login' ? '🔑 Sign In' : '✨ Create Account'}
              </button>
            ))}
          </div>

          {/* Google Button — only render when not loading to prevent double SDK init */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'all', transition: 'opacity 0.2s' }}>
            {!loading && (
              <GoogleLogin
                key={mode}
                onSuccess={handleGoogleSuccess}
                onError={() => showToast('Google sign-in was cancelled.', 'error')}
                theme="filled_black"
                shape="pill"
                text={mode === 'login' ? 'signin_with' : 'signup_with'}
              />
            )}
            {loading && (
              <div style={{ padding: '10px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                ⏳ Please wait…
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>OR CONTINUE WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={labelStyle}>PASSWORD</label>
                  <button type="button" onClick={() => setMode('forgot')} style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif' }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                    {showLoginPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#3b82f6' }} />
                <label htmlFor="remember" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>Keep me signed in</label>
              </div>
              <div id="login-error-hint" style={{ display: 'none' }} />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s',
                  marginTop: 4,
                }}
              >
                {loading ? '⏳ Signing in…' : '→  Sign In to InventoryIQ'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                No account yet?{' '}
                <button type="button" onClick={() => setMode('register')} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Create one free →
                </button>
              </p>
            </form>
          )}

          {/* ── FORGOT PASSWORD FORM ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔑</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Forgot your password?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
                  Enter your registered email. We'll send a secure reset link valid for 30 minutes.
                </div>
              </div>
              <div>
                <label style={labelStyle}>REGISTERED EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
                }}
              >
                {loading ? '⏳ Sending…' : '📧 Send Reset Link'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                <button type="button" onClick={() => setMode('login')} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  ← Back to Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── RESET PASSWORD FORM ── */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Set New Password</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                  Choose a strong new password for your account.
                </div>
              </div>
              <div>
                <label style={labelStyle}>NEW PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                    {showNewPw ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPw.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: newPw.length >= i * 3 ? (newPw.length >= 12 ? '#10b981' : '#f59e0b') : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
                    ))}
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', marginLeft: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                      {newPw.length < 6 ? 'Weak' : newPw.length < 10 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmNewPw}
                  onChange={e => setConfirmNewPw(e.target.value)}
                  required
                  style={{ ...inputStyle, borderColor: confirmNewPw && confirmNewPw !== newPw ? 'rgba(239,68,68,0.5)' : (inputStyle.borderColor as string) }}
                />
                {confirmNewPw && confirmNewPw !== newPw && (
                  <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>⚠ Passwords don't match</div>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                }}
              >
                {loading ? '⏳ Updating…' : '✓ Set New Password'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                <button type="button" onClick={() => setMode('login')} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  ← Back to Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={labelStyle}>FULL NAME</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>WORK EMAIL</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                    {showRegPw ? '🙈' : '👁'}
                  </button>
                </div>
                {/* Password strength */}
                {regPassword.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: regPassword.length >= i * 3
                          ? (regPassword.length >= 12 ? '#10b981' : regPassword.length >= 8 ? '#f59e0b' : '#ef4444')
                          : 'rgba(255,255,255,0.07)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                    <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', marginLeft: 4, fontFamily: 'JetBrains Mono, monospace' }}>
                      {regPassword.length < 6 ? 'Weak' : regPassword.length < 10 ? 'Fair' : regPassword.length < 14 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={regConfirm}
                  onChange={e => setRegConfirm(e.target.value)}
                  required
                  style={{ ...inputStyle, borderColor: regConfirm && regConfirm !== regPassword ? 'rgba(239,68,68,0.5)' : inputStyle.borderColor as string }}
                />
              </div>

              {/* Role Selector */}
              <div>
                <label style={labelStyle}>YOUR ROLE IN THE ORGANIZATION</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {roles.map(r => (
                    <label
                      key={r.value}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                        background: regRole === r.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${regRole === r.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={regRole === r.value}
                        onChange={() => setRegRole(r.value)}
                        style={{ accentColor: '#6366f1', width: 14, height: 14 }}
                      />
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{r.desc}</div>
                      </div>
                      {r.value === 'admin' && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                          NEEDS APPROVAL
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px',
                  background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s',
                  marginTop: 4,
                }}
              >
                {loading ? '⏳ Creating account…' : '✨ Create My Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  Sign in →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(99,102,241,0.5) !important; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>
    </div>
  )
}
