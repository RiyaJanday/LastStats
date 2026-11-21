'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import api from '@/lib/api'
import { Portfolio } from '@/types'
import { formatCompact, formatPercent } from '@/lib/utils'

export default function DashboardPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/portfolios')
      setPortfolios(data.data || [])
    } catch (err) {
      console.error('Could not load portfolios — is the backend running?', err)
      setPortfolios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0)
  const totalCurrent = portfolios.reduce((s, p) => s + p.currentValue, 0)
  const totalGain = totalCurrent - totalInvested
  const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const allHoldings = portfolios.flatMap(p => p.holdings || [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, background: '#f8faf0' }}>

        <div style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '16px 32px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a2810' }}>
            Dashboard
          </h1>
          <button onClick={loadData} className="btn-ghost">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px', marginBottom: '24px',
          }}>
            <div className="card">
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Total Invested</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                {loading ? '...' : formatCompact(totalInvested)}
              </p>
            </div>
            <div className="card">
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Current Value</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                {loading ? '...' : formatCompact(totalCurrent)}
              </p>
            </div>
            <div className="card">
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Gain / Loss</p>
              <p style={{
                fontSize: '24px', fontWeight: 700,
                color: totalGain >= 0 ? '#16a34a' : '#dc2626',
              }}>
                {loading ? '...' : formatCompact(Math.abs(totalGain))}
              </p>
              <p style={{
                fontSize: '12px',
                color: totalGain >= 0 ? '#16a34a' : '#dc2626',
              }}>
                {formatPercent(gainPercent)}
              </p>
            </div>
            <div className="card">
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Holdings</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                {allHoldings.length}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
              Holdings
            </h2>
            {allHoldings.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                No holdings yet — go to Portfolio and add a transaction.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Fund</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Invested</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Value</th>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '11px', color: '#9ca3af' }}>Gain %</th>
                  </tr>
                </thead>
                <tbody>
                  {allHoldings.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '8px', fontSize: '13px' }}>{h.fundName}</td>
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
        </div>
      </main>
    </div>
  )
}
