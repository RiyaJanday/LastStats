import { useEffect, useState } from 'react'
import { LogOut, Moon, Palette, Save, Settings, Shield, Sun, Trash2, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import {
  accentSwatches,
  clearSession,
  deleteCurrentAccount,
  getSession,
  getTheme,
  getThemeAccentIndex,
  resetUserPassword,
  setTheme,
  setThemeAccentIndex,
  updateUserProfile,
} from '../lib/auth'

export default function SettingsPage() {
  const navigate = useNavigate()
  const session = getSession()
  const [themeChoice, setThemeChoice] = useState(getTheme())
  const [accentIndex, setAccentIndex] = useState(getThemeAccentIndex())
  const [profile, setProfile] = useState({
    name: session?.name || '',
    email: session?.email || '',
    phone: session?.phone || '',
    riskProfile: session?.riskProfile || 'Moderate',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setTheme(themeChoice)
  }, [themeChoice])

  const chooseAccent = (index) => {
    setAccentIndex(index)
    setThemeAccentIndex(index)
  }

  const setProfileField = (key) => (event) => setProfile((prev) => ({ ...prev, [key]: event.target.value }))
  const setPasswordField = (key) => (event) => setPasswords((prev) => ({ ...prev, [key]: event.target.value }))

  const saveProfile = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await updateUserProfile(profile)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await resetUserPassword(passwords.currentPassword, passwords.newPassword)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password reset successfully')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const logout = () => {
    clearSession()
    toast.success('Logged out')
    navigate('/login', { replace: true })
  }

  const deleteAccount = async () => {
    const confirmed = window.confirm('Delete your LastStats account? This cannot be undone.')
    if (!confirmed) return

    try {
      await deleteCurrentAccount()
      toast.success('Account deleted')
      navigate('/register', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Could not delete account')
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">
        <div className="top-bar">
          <div>
            <p className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={18} color="var(--lp-accent)" /> Settings
            </p>
            <p className="top-bar-sub">Profile, appearance, password, and account controls</p>
          </div>
          <button onClick={logout} className="btn-ghost"><LogOut size={14} /> Logout</button>
        </div>

        <div className="page-content">
          <div className="settings-grid">
            <div style={{ display: 'grid', gap: 20 }}>
              <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <User size={18} color="var(--lp-accent)" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lp-text)' }}>Profile</h2>
                </div>
                <form onSubmit={saveProfile} style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <label className="input-label">Full Name</label>
                    <input className="input" value={profile.name} onChange={setProfileField('name')} required />
                  </div>
                  <div>
                    <label className="input-label">Email</label>
                    <input className="input" type="email" value={profile.email} disabled title="Email cannot be changed" style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label className="input-label">Phone</label>
                    <input className="input" value={profile.phone} onChange={setProfileField('phone')} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="input-label">Risk Profile</label>
                    <select className="input" value={profile.riskProfile} onChange={setProfileField('riskProfile')}>
                      {['Conservative', 'Moderate', 'Aggressive'].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary" type="submit" disabled={savingProfile}>
                    <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </section>

              <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  {themeChoice === 'dark' ? <Moon size={18} color="var(--lp-accent)" /> : themeChoice === 'custom' ? <Palette size={18} color="var(--lp-accent)" /> : <Sun size={18} color="var(--lp-accent)" />}
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lp-text)' }}>Appearance</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <ThemeButton active={themeChoice === 'light'} icon={Sun} label="Light" onClick={() => setThemeChoice('light')} />
                  <ThemeButton active={themeChoice === 'dark'} icon={Moon} label="Dark" onClick={() => setThemeChoice('dark')} />
                  <ThemeButton active={themeChoice === 'custom'} icon={Palette} label="Custom" onClick={() => setThemeChoice('custom')} />
                </div>
                {themeChoice === 'custom' && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                    {accentSwatches.map((swatch, index) => (
                      <button
                        key={swatch.name}
                        type="button"
                        title={swatch.name}
                        onClick={() => chooseAccent(index)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          padding: 0,
                          background: `linear-gradient(135deg, ${swatch.accent}, ${swatch.accent2})`,
                          border: index === accentIndex ? '2px solid var(--lp-text)' : '2px solid transparent',
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
              <section className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <Shield size={18} color="var(--lp-accent)" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lp-text)' }}>Reset Password</h2>
                </div>
                <form onSubmit={resetPassword} style={{ display: 'grid', gap: 14, maxWidth: 460 }}>
                  <div>
                    <label className="input-label">Current Password</label>
                    <input className="input" type="password" value={passwords.currentPassword} onChange={setPasswordField('currentPassword')} required />
                  </div>
                  <div>
                    <label className="input-label">New Password</label>
                    <input className="input" type="password" value={passwords.newPassword} onChange={setPasswordField('newPassword')} required />
                  </div>
                  <div>
                    <label className="input-label">Confirm New Password</label>
                    <input className="input" type="password" value={passwords.confirmPassword} onChange={setPasswordField('confirmPassword')} required />
                  </div>
                  <button className="btn-primary" type="submit" disabled={savingPassword} style={{ width: 'fit-content' }}>
                    {savingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </section>

              <section className="card" style={{ borderColor: 'rgba(220, 38, 38, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Trash2 size={18} color="#dc2626" />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Danger Zone</h2>
                </div>
                <p style={{ fontSize: 13, color: 'var(--lp-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  Permanently deletes your LastStats account and login access.
                </p>
                <button onClick={deleteAccount} className="btn-ghost" style={{ color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.35)' }}>
                  <Trash2 size={14} /> Delete Account
                </button>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ThemeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid var(--lp-accent)' : '1px solid var(--lp-border)',
        background: active ? 'var(--lp-accent-soft, var(--lp-surface))' : 'var(--lp-surface)',
        color: active ? 'var(--lp-accent)' : 'var(--lp-text-muted)',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        fontWeight: 700,
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}
