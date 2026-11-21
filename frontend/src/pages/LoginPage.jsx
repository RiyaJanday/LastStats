import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'
import { loginUser } from '../lib/auth'
import { getLandingTheme } from '../lib/landingTheme'
import logoDataUri from '../assets/logo.png'
import '../landing.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await loginUser(form)
      toast.success('Welcome back')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage portfolios, SIPs, markets, and simulations.">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="lp-input-label">Email</label>
          <input className="lp-input" type="email" value={form.email} onChange={setField('email')} placeholder="you@example.com" required />
        </div>
        <PasswordInput label="Password" value={form.password} onChange={setField('password')} placeholder="Your password" required />
        <button className="lp-btn lp-gradient-btn" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 14, marginTop: 4 }}>
          <LogIn size={15} /> {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p className="lp-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
        New to LastStats? <Link to="/register" style={{ color: 'var(--lp-accent)', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
      </p>
    </AuthShell>
  )
}

export function PasswordInput({ label, value, onChange, placeholder, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="lp-input-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="lp-input"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ paddingRight: 42 }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex',
            cursor: 'pointer',
            color: 'var(--lp-text-muted)',
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

export function AuthShell({ title, subtitle, children }) {
  const [theme] = useState(getLandingTheme())

  return (
    <div
      className="lp-root"
      data-lp-theme={theme}
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="lp-glass-strong"
        style={{ width: 'min(440px, 100%)', padding: '36px 32px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <img src={logoDataUri} alt="LastStats" style={{ height: 52, width: 'auto' }} />
        </div>

        <h1 className="lp-heading" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>{title}</h1>
        <p className="lp-muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 26, textAlign: 'center' }}>{subtitle}</p>

        {children}

        <p className="lp-muted" style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: 11, marginTop: 22 }}>
          <ShieldCheck size={13} /> Educational tool &mdash; not financial advice
        </p>
      </motion.div>
    </div>
  )
}
