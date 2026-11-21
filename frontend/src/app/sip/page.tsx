'use client'
import { useEffect, useState } from 'react'
import { Plus, Pause, Play } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import api, { sipApi } from '@/lib/api'
import { formatCompact } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SipPage() {
  const [portfolioId, setPortfolioId] = useState('')
  const [sips, setSips] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    fundIsin: '', fundName: '', monthlyAmount: '', sipDate: '1',
    startDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    api.get('/api/portfolios').then(res => {
      const list = res.data.data || []
      if (list[0]) {
        setPortfolioId(list[0].id)
        loadSips(list[0].id)
      }
    })
  }, [])

  const loadSips = async (pid: string) => {
    try {
      const { data } = await sipApi.get(`/api/sips/portfolio/${pid}`)
      setSips(data || [])
    } catch {
      setSips([])
    }
  }

  const createSip = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sipApi.post(`/api/sips/portfolio/${portfolioId}`, {
        ...form,
        monthlyAmount: parseFloat(form.monthlyAmount),
        sipDate: parseInt(form.sipDate),
      })
      toast.success('SIP created!')
      setShowForm(false)
      loadSips(portfolioId)
    } catch {
      toast.error('Failed — make sure you have a portfolio first')
    }
  }

  const toggleSip = async (sip: any) => {
    const action = sip.isActive ? 'pause' : 'resume'
    await sipApi.patch(`/api/sips/${sip.id}/${action}`)
    loadSips(portfolioId)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, background: '#f8faf0' }}>

        <div style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '16px 32px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>SIP Plans</h1>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} /> New SIP
          </button>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {sips.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
              No SIP plans yet. Click "New SIP" to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sips.map(sip => (
                <div key={sip.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{sip.fundName}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Day {sip.sipDate} every month · {sip.installmentsCount} installments
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700 }}>{formatCompact(sip.monthlyAmount)}/mo</p>
                    <p style={{ fontSize: '11px', color: '#6b8c3a' }}>
                      5Y projection: {formatCompact(sip.projectedValue5Y)}
                    </p>
                  </div>
                  <button onClick={() => toggleSip(sip)} className="btn-ghost">
                    {sip.isActive ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '400px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Create SIP</h3>
              <form onSubmit={createSip} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="input-label">Fund ISIN</label>
                  <input className="input" value={form.fundIsin}
                    onChange={e => setForm(f => ({ ...f, fundIsin: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label">Fund Name</label>
                  <input className="input" value={form.fundName}
                    onChange={e => setForm(f => ({ ...f, fundName: e.target.value }))} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="input-label">Monthly Amount (₹)</label>
                    <input className="input" type="number" value={form.monthlyAmount}
                      onChange={e => setForm(f => ({ ...f, monthlyAmount: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="input-label">SIP Date</label>
                    <input className="input" type="number" min="1" max="28" value={form.sipDate}
                      onChange={e => setForm(f => ({ ...f, sipDate: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
