import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerUser } from '../lib/auth'
import { AuthShell, PasswordInput } from './LoginPage'
import '../landing.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await registerUser(form)
      toast.success('Account created')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Set up your profile and start tracking your investments in LastStats.">
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <div>
          <label className="lp-input-label">Full Name</label>
          <input className="lp-input" value={form.name} onChange={setField('name')} placeholder="Riya Sharma" required />
        </div>
        <div>
          <label className="lp-input-label">Email</label>
          <input className="lp-input" type="email" value={form.email} onChange={setField('email')} placeholder="you@example.com" required />
        </div>
        <PasswordInput label="Password" value={form.password} onChange={setField('password')} placeholder="Minimum 6 characters" required />
        <PasswordInput label="Confirm Password" value={form.confirmPassword} onChange={setField('confirmPassword')} placeholder="Repeat password" required />
        <button className="lp-btn lp-gradient-btn" disabled={loading} style={{ width: '100%', padding: 13, fontSize: 14, marginTop: 4 }}>
          <UserPlus size={15} /> {loading ? 'Creating...' : 'Register'}
        </button>
      </form>
      <p className="lp-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--lp-accent)', fontWeight: 700, textDecoration: 'none' }}>Login</Link>
      </p>
    </AuthShell>
  )
}
