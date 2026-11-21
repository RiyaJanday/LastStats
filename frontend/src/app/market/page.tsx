'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import axios from 'axios'

const MARKET_URL = 'http://localhost:8084'   // market-data-service direct port

export default function MarketPage() {
  const [indices, setIndices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${MARKET_URL}/api/market/indices`)
      .then(res => setIndices(res.data || []))
      .catch(() => setIndices([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, background: '#f8faf0' }}>
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>Markets</h1>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {loading ? (
              <p style={{ color: '#9ca3af' }}>Loading market data...</p>
            ) : indices.length === 0 ? (
              <p style={{ color: '#9ca3af' }}>
                Could not load — make sure market-data-service is running on port 8085
              </p>
            ) : (
              indices.map(idx => (
                <div key={idx.symbol} className="card">
                  <p style={{ fontSize: '10px', color: '#9ca3af' }}>{idx.region}</p>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{idx.name}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700 }}>
                    {idx.price?.toLocaleString('en-IN')}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: idx.changePercent >= 0 ? '#16a34a' : '#dc2626',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    {idx.changePercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {idx.changePercent?.toFixed(2)}%
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
