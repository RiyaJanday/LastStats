import { useEffect, useState } from 'react'
import { CalendarDays, Pause, Play, Plus, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { sipApi } from '../lib/api'
import { formatCompact, formatDate } from '../lib/utils'

const initialForm = {
  fundIsin: '',
  fundName: '',
  monthlyAmount: '',
  startDate: new Date().toISOString().split('T')[0],
  frequency: 'MONTHLY',
}

export default function SipPage() {
  const [plans, setPlans] = useState([])
  const [projection, setProjection] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(initialForm)

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const loadPlans = async () => {
    setLoading(true)
    try {
      const { data } = await sipApi.get('/api/sips')
      setPlans(data.data || data || [])
    } catch {
      toast.error('Could not load SIP plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const createSip = async (event) => {
    event.preventDefault()
    try {
      await sipApi.post('/api/sips', { ...form, monthlyAmount: Number(form.monthlyAmount) })
      toast.success('SIP created')
      setShowModal(false)
      setForm(initialForm)
      loadPlans()
    } catch {
      toast.error('Failed to create SIP')
    }
  }

  const toggleSip = async (plan) => {
    const action = plan.status === 'PAUSED' ? 'resume' : 'pause'
    try {
      await sipApi.patch(`/api/sips/${plan.id}/${action}`)
      toast.success(`SIP ${action}d`)
      loadPlans()
    } catch {
      toast.error(`Failed to ${action} SIP`)
    }
  }

  const loadProjection = async (plan) => {
    try {
      const { data } = await sipApi.get(`/api/sips/${plan.id}/projection?years=5&annualReturnPct=12`)
      setProjection({ plan, data: data.data || data })
    } catch {
      toast.error('Projection not available')
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">
        <div className="top-bar">
          <div>
            <p className="top-bar-title">SIP Plans</p>
            <p className="top-bar-sub">Create, pause, resume, and project long-term plans</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={loadPlans} className="btn-ghost"><RefreshCw size={13} /> Refresh</button>
            <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={14} /> New SIP</button>
          </div>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="card empty-state">Loading SIP plans...</div>
          ) : plans.length === 0 ? (
            <div className="card empty-state">
              <CalendarDays size={44} color="var(--lp-accent-2)" />
              <p style={{ fontWeight: 700, color: 'var(--lp-text)' }}>No SIP plans yet</p>
              <p>Create your first SIP to track automated investments.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {plans.map((plan) => (
                <div key={plan.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700 }}>{plan.fundName}</p>
                      <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginTop: 3 }}>{plan.fundIsin}</p>
                    </div>
                    <span className={plan.status === 'PAUSED' ? 'badge-loss' : 'badge-profit'}>{plan.status || 'ACTIVE'}</span>
                  </div>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    <Info label="Monthly Amount" value={formatCompact(plan.monthlyAmount)} />
                    <Info label="Start Date" value={formatDate(plan.startDate)} />
                    <Info label="Frequency" value={plan.frequency || 'MONTHLY'} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => toggleSip(plan)} className="btn-ghost" style={{ flex: 1 }}>
                      {plan.status === 'PAUSED' ? <Play size={13} /> : <Pause size={13} />}
                      {plan.status === 'PAUSED' ? 'Resume' : 'Pause'}
                    </button>
                    <button onClick={() => loadProjection(plan)} className="btn-primary" style={{ flex: 1 }}>5Y Projection</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projection && (
            <div className="card" style={{ marginTop: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                5Y Projection - {projection.plan.fundName}
              </h2>
              <div className="stat-grid stat-grid-3">
                <ProjectionStat label="Invested" value={formatCompact(projection.data.totalInvested)} />
                <ProjectionStat label="Projected Value" value={formatCompact(projection.data.projectedValue)} />
                <ProjectionStat label="Estimated Gain" value={formatCompact(projection.data.estimatedGain)} />
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Create SIP</h3>
              <form onSubmit={createSip} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="input-label">Fund ISIN</label>
                  <input className="input" value={form.fundIsin} onChange={setField('fundIsin')} required />
                </div>
                <div>
                  <label className="input-label">Fund Name</label>
                  <input className="input" value={form.fundName} onChange={setField('fundName')} required />
                </div>
                <div>
                  <label className="input-label">Monthly Amount</label>
                  <input className="input" type="number" value={form.monthlyAmount} onChange={setField('monthlyAmount')} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Start Date</label>
                    <input className="input" type="date" value={form.startDate} onChange={setField('startDate')} required />
                  </div>
                  <div>
                    <label className="input-label">Frequency</label>
                    <select className="input" value={form.frequency} onChange={setField('frequency')}>
                      {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create SIP</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--lp-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function ProjectionStat({ label, value }) {
  return (
    <div style={{ background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700 }}>{value}</p>
    </div>
  )
}
