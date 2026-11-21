'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/lib/api'
import { Portfolio } from '@/types'
import { formatCompact, formatPercent } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [selected, setSelected] = useState<Portfolio | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    fundIsin: '', fundName: '', fundCategory: 'Equity',
    transactionType: 'BUY', units: '', nav: '', amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
  })

  const load = async () => {
    try {
      const { data } = await api.get('/api/portfolios')
      const list: Portfolio[] = data.data || []
      setPortfolios(list)
      if (list.length > 0) setSelected(list[0])
    } catch {
      toast.error('Could not load portfolios')
    }
  }

  useEffect(() => { load() }, [])

  const createPortfolio = async () => {
    try {
      await api.post('/api/portfolios?name=My Portfolio')
      toast.success('Portfolio created!')
      load()
    } catch {
      toast.error('Failed to create portfolio')
    }
  }

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    try {
      await api.post(`/api/portfolios/${selected.id}/transactions`, {
        ...form,
        units: parseFloat(form.units),
        nav: parseFloat(form.nav),
        amount: parseFloat(form.amount),
      })
      toast.success('Transaction added!')
      setShowModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add transaction')
    }
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
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>Portfolio</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {portfolios.length === 0 && (
              <button onClick={createPortfolio} className="btn-primary">
                <Plus size={14} /> Create Portfolio
              </button>
            )}
            {selected && (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={14} /> Add Transaction
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {selected ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '20px' }}>
                <div className="card">
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Invested</p>
                  <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCompact(selected.totalInvested)}</p>
                </div>
                <div className="card">
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Current Value</p>
                  <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCompact(selected.currentValue)}</p>
                </div>
                <div className="card">
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Gain / Loss</p>
                  <p style={{
                    fontSize: '20px', fontWeight: 700,
                    color: selected.totalGain >= 0 ? '#16a34a' : '#dc2626',
                  }}>
                    {formatPercent(selected.totalGainPercent)}
                  </p>
                </div>
              </div>

              <div className="card">
                <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Holdings</h2>
                {(selected.holdings || []).length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                    No holdings yet. Click "Add Transaction" to add your first fund.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Fund</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Units</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Avg NAV</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Invested</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Value</th>
                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Gain %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.holdings.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '8px', fontSize: '13px' }}>{h.fundName}</td>
                          <td style={{ padding: '8px', fontSize: '13px' }}>{h.units?.toFixed(3)}</td>
                          <td style={{ padding: '8px', fontSize: '13px' }}>₹{h.avgNav?.toFixed(2)}</td>
                          <td style={{ padding: '8px', fontSize: '13px' }}>{formatCompact(h.investedAmount)}</td>
                          <td style={{ padding: '8px', fontSize: '13px' }}>{formatCompact(h.currentValue)}</td>
                          <td style={{
                            padding: '8px', fontSize: '13px',
                            color: h.gainPercent >= 0 ? '#16a34a' : '#dc2626',
                          }}>
                            {formatPercent(h.gainPercent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#9ca3af' }}>No portfolio yet. Click "Create Portfolio" to start.</p>
            </div>
          )}
        </div>

        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '420px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Add Transaction</h3>
              <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    <label className="input-label">Units</label>
                    <input className="input" type="number" step="0.001" value={form.units}
                      onChange={e => setForm(f => ({ ...f, units: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="input-label">NAV (₹)</label>
                    <input className="input" type="number" step="0.01" value={form.nav}
                      onChange={e => setForm(f => ({ ...f, nav: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Amount (₹)</label>
                  <input className="input" type="number" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input className="input" type="date" value={form.transactionDate}
                    onChange={e => setForm(f => ({ ...f, transactionDate: e.target.value }))} required />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Add
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
