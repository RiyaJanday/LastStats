'use client'
import { useState } from 'react'
import { Play, Activity } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { formatCompact } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'

const ANALYTICS_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'http://localhost:8090'

export default function AlgoPage() {
  const [currentValue, setCurrentValue] = useState(500000)
  const [monthlySip, setMonthlySip] = useState(10000)
  const [years, setYears] = useState(10)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const { data } = await axios.post(`${ANALYTICS_URL}/api/simulation/monte-carlo`, {
        current_value: currentValue,
        monthly_sip: monthlySip,
        years,
        annual_return_pct: 12,
        annual_volatility_pct: 15,
        simulations: 1000,
      })
      setResult(data)
    } catch {
      toast.error('Analytics service not reachable — is it running on port 8090?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, background: '#f8faf0' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#6b8c3a" /> Algo Engine
          </h1>
        </div>

        <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
          <div className="card">
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Parameters</h2>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Current Value (₹)</label>
              <input className="input" type="number" value={currentValue}
                onChange={e => setCurrentValue(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Monthly SIP (₹)</label>
              <input className="input" type="number" value={monthlySip}
                onChange={e => setMonthlySip(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Years</label>
              <input className="input" type="number" value={years}
                onChange={e => setYears(Number(e.target.value))} />
            </div>
            <button onClick={runSimulation} disabled={loading} className="btn-primary" style={{ width: '100%' }}>
              <Play size={14} /> {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>

          <div>
            {result ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                <div className="card">
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Median Outcome</p>
                  <p style={{ fontSize: '20px', fontWeight: 700 }}>{formatCompact(result.percentiles.p50)}</p>
                </div>
                <div className="card">
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Best Case</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>
                    {formatCompact(result.percentiles.p90)}
                  </p>
                </div>
                <div className="card">
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Worst Case</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626' }}>
                    {formatCompact(result.percentiles.p10)}
                  </p>
                </div>
                <div className="card" style={{ gridColumn: 'span 3' }}>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Profit Probability</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#6b8c3a' }}>
                    {result.probability_of_profit}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="card" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '300px', color: '#9ca3af',
              }}>
                Set parameters and run a simulation
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
