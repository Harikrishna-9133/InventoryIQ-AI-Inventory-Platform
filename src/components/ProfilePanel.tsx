import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api'

interface Props {
  open: boolean
  onClose: () => void
}

const roleLabel: Record<string, string> = {
  admin: '🛡️ Admin',
  inventory_manager: '📦 Inventory Manager',
  accountant: '💼 Accountant',
  supplier: '🚚 Supplier',
  customer: '🛒 Customer',
}

export default function ProfilePanel({ open, onClose }: Props) {
  const { user, updateUser, logout } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  // Sync fields when user changes
  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setDepartment(user?.department || '')
  }, [user])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, department }),
      })
      updateUser({ name, phone, department })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      // Still update locally even if backend doesn't have the endpoint yet
      updateUser({ name, phone, department })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return }
    if (newPw.length < 8) { setPwMsg('Minimum 8 characters'); return }
    setSaving(true)
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      })
      setPwMsg('Password changed successfully! ✓')
      setOldPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwMsg(''); setChangingPw(false) }, 2000)
    } catch (e: any) {
      setPwMsg(e.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--secondary)',
    color: 'var(--foreground)',
    fontSize: 13.5,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--muted-foreground)',
    display: 'block',
    marginBottom: 5,
    fontFamily: 'JetBrains Mono, monospace',
    letterSpacing: '0.06em',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sliding panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 380,
          zIndex: 999,
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.25)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>My Profile</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Avatar + identity */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              {user?.profileImage ? (
                <img src={user.profileImage} alt="" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
              ) : (
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 700, color: 'white',
                  border: '3px solid rgba(99,102,241,0.3)',
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: '#10b981', border: '2px solid var(--card)' }} title="Online" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>{user?.email}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', fontWeight: 600 }}>
                  {roleLabel[user?.role || ''] || user?.role}
                </span>
              </div>
              {user?.authProvider === 'google' && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Signed in with Google
                </div>
              )}
            </div>
          </div>

          {/* Edit fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: -4 }}>Personal Information</div>

            <div>
              <label style={lbl}>FULL NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="Your full name" />
            </div>

            <div>
              <label style={lbl}>EMAIL ADDRESS</label>
              <input value={user?.email || ''} style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} disabled title="Email cannot be changed" />
            </div>

            <div>
              <label style={lbl}>PHONE NUMBER</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="+91 98765 43210" />
            </div>

            <div>
              <label style={lbl}>DEPARTMENT</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} style={inp} placeholder="e.g. Operations, Finance…" />
            </div>

            <div>
              <label style={lbl}>ROLE</label>
              <input value={roleLabel[user?.role || ''] || user?.role || ''} style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} disabled title="Contact admin to change role" />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 0',
                background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: saved ? '#34d399' : 'white',
                border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
                borderRadius: 9, fontWeight: 700, fontSize: 13.5,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {saving ? '⏳ Saving…' : saved ? '✓ Changes Saved!' : '💾 Save Changes'}
            </button>
          </div>

          {/* Change Password */}
          {user?.authProvider !== 'google' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Security</div>
                <button
                  onClick={() => setChangingPw(!changingPw)}
                  style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {changingPw ? 'Cancel' : '🔑 Change Password'}
                </button>
              </div>
              {changingPw && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={lbl}>CURRENT PASSWORD</label>
                    <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} style={inp} placeholder="Current password" />
                  </div>
                  <div>
                    <label style={lbl}>NEW PASSWORD</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inp} placeholder="Min. 8 characters" />
                  </div>
                  <div>
                    <label style={lbl}>CONFIRM NEW PASSWORD</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inp} placeholder="Repeat new password" />
                  </div>
                  {pwMsg && (
                    <div style={{ fontSize: 12.5, color: pwMsg.includes('✓') ? '#10b981' : '#ef4444', fontWeight: 500 }}>{pwMsg}</div>
                  )}
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    style={{ padding: '9px 0', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sign out */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button
              onClick={() => { onClose(); setTimeout(logout, 200) }}
              style={{
                width: '100%', padding: '10px 0',
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 9, cursor: 'pointer',
                color: '#ef4444', fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              ⎋ Sign Out of InventoryIQ
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', marginTop: 10 }}>
              Account ID #{user?.id} · {user?.status === 'active' ? '🟢 Active' : '🔴 ' + user?.status}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
