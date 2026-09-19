import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Globe, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import WorldMarketsMap from '../components/WorldMarketsMap'
import GlobalMarketNews from '../components/GlobalMarketNews'
import { marketApi } from '../lib/api'
import { formatPercent } from '../lib/utils'

const INDICES_REFRESH_MS = 30000

export default function MarketPage() {
  const [worldIndices, setWorldIndices] = useState([])
  const [indicesLoading, setIndicesLoading] = useState(true)
  const [stocks, setStocks] = useState([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [refreshingMarkets, setRefreshingMarkets] = useState(false)
  const newsRef = useRef(null)
  const mapRef = useRef(null)

  const loadIndices = async () => {
    setIndicesLoading(true)
    try {
      const { data } = await marketApi.get('/api/market/world-indices')
      setWorldIndices(data.data || data || [])
      return true
    } catch {
      // Keep whatever indices were already showing rather than wiping them
      // on a transient failure; refreshAll()'s toast reports the failure.
      return false
    } finally {
      setIndicesLoading(false)
    }
  }

  // Refreshes indices, the map's exchange list, and news together, then
  // reports one overall outcome. Per-exchange "Data not available" is
  // expected and not a failure; this only distinguishes "could we reach
  // our own backend services" from "couldn't reach one or more of them".
  const refreshAll = async () => {
    if (refreshingMarkets) return
    setRefreshingMarkets(true)
    const toastId = toast.loading('Refreshing markets...')
    try {
      const results = await Promise.allSettled([
        loadIndices(),
        mapRef.current?.refresh?.() ?? Promise.resolve(true),
        newsRef.current?.refresh?.() ?? Promise.resolve(true),
      ])
      const allOk = results.every((r) => r.status === 'fulfilled' && r.value !== false)
      toast.success(allOk ? 'Markets updated' : 'Markets partially updated', { id: toastId })
    } catch {
      toast.error('Markets partially updated', { id: toastId })
    } finally {
      setRefreshingMarkets(false)
    }
  }

  useEffect(() => {
    // Only load indices here — GlobalMarketNews fetches its own news on
    // mount via GET /api/news. Deliberately NOT calling refreshAll() (which
    // hits POST /api/news/refresh, a real RSS ingestion pass across every
    // configured feed) on every page visit; that only happens when the
    // person explicitly clicks the top Refresh button.
    loadIndices()
    const interval = setInterval(loadIndices, INDICES_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  const searchStocks = async (event) => {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const { data } = await marketApi.get(`/api/market/search?q=${encodeURIComponent(query.trim())}`)
      setStocks(data.data || data || [])
    } catch {
      toast.error('Stock search failed')
      setStocks([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">
        <div className="top-bar">
          <div>
            <p className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="var(--lp-accent)" /> Markets
            </p>
            <p className="top-bar-sub">Live indices, world markets map, and news</p>
          </div>
          <button onClick={refreshAll} className="btn-ghost" disabled={refreshingMarkets}>
            <RefreshCw size={13} /> {refreshingMarkets ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="page-content">
          {/* ---- Section 1: all major indices, live ---- */}
          <div className="stat-grid stat-grid-4" style={{ marginBottom: 24 }}>
            {indicesLoading && worldIndices.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="card">Loading...</div>)
            ) : worldIndices.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1' }}>Market service not reachable — showing nothing rather than fake numbers.</div>
            ) : (
              worldIndices.map((index, i) => <IndexCard key={index.symbol} index={index} delay={i * 0.03} />)
            )}
          </div>

          {/* ---- Section 2: global market news (filters, search, backend pagination) ---- */}
          <GlobalMarketNews ref={newsRef} />

          {/* ---- Section 3: interactive world markets map ---- */}
          {/* Self-contained: fetches GET /api/market/exchanges (the full
              exchange master list merged with live data) on its own, so it
              no longer depends on the 12-index worldIndices state above. */}
          <div style={{ marginBottom: 24 }}>
            <WorldMarketsMap ref={mapRef} />
          </div>

          {/* ---- Stock search ---- */}
          <div className="card" style={{ marginBottom: 24 }}>
            <form onSubmit={searchStocks} style={{ display: 'flex', gap: 10 }}>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stocks, e.g. RELIANCE or INFY" />
              <button className="btn-primary" type="submit" disabled={searching}>
                <Search size={14} /> {searching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          <AnimatePresence>
            {stocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card"
              >
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Search Results</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Stock', 'Price', 'Change', 'Change %', '52-Week Range'].map((h) => <th key={h} className="tbl-header">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {stocks.map((stock, i) => (
                        <motion.tr
                          key={stock.symbol || stock.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.03 }}
                        >
                          <td className="tbl-cell">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', background: 'var(--lp-accent-soft, var(--lp-surface))', color: 'var(--lp-accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {(stock.symbol || stock.name || '?').slice(0, 2).toUpperCase()}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: 13 }}>{stock.symbol}</p>
                                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{stock.name}</p>
                              </div>
                            </div>
                          </td>
                          {stock.dataAvailable === false ? (
                            <td className="tbl-cell" colSpan={4} style={{ color: 'var(--lp-text-muted)' }}>Data not available</td>
                          ) : (
                            <>
                              <td className="tbl-cell">Rs {Number(stock.price ?? stock.lastPrice ?? 0).toFixed(2)}</td>
                              <td className="tbl-cell" style={{ color: Number(stock.change ?? 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                                {stock.change != null ? Number(stock.change).toFixed(2) : '—'}
                              </td>
                              <td className="tbl-cell"><ChangeBadge value={stock.changePercent} /></td>
                              <td className="tbl-cell" style={{ minWidth: 160 }}>
                                <RangeBar low={stock.weekLow52} high={stock.weekHigh52} current={stock.price ?? stock.lastPrice} />
                              </td>
                            </>
                          )}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

function IndexCard({ index, delay = 0 }) {
  const unavailable = index.dataAvailable === false
  const change = Number(index.changePercent ?? index.percentChange ?? 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
      className="card card-interactive"
      style={{ padding: 18 }}
    >
      <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginBottom: 2 }}>{index.name || index.symbol}</p>
      <p style={{ fontSize: 10, color: 'var(--lp-text-muted)', marginBottom: 8, opacity: 0.75 }}>{index.region}</p>
      {unavailable ? (
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-text-muted)' }}>Data not available</p>
      ) : (
        <>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{Number(index.value ?? index.lastPrice ?? 0).toFixed(2)}</p>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChangeBadge value={change} />
            {index.delayed && <span style={{ fontSize: 9, color: 'var(--lp-text-muted)', opacity: 0.75 }}>DELAYED</span>}
          </div>
        </>
      )}
    </motion.div>
  )
}

// Shows where the current price sits between its real 52-week low and
// high — genuine data from the quote, just visualized as a range bar
// instead of a bare pair of numbers.
function RangeBar({ low, high, current }) {
  const lo = Number(low || 0)
  const hi = Number(high || 0)
  const cur = Number(current || 0)
  if (!hi || hi <= lo) return <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>—</span>
  const pct = Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100))
  return (
    <div>
      <div style={{ position: 'relative', height: 5, borderRadius: 999, background: 'var(--lp-surface)', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'linear-gradient(90deg, #dc2626, #eab308, #16a34a)', opacity: 0.35 }} />
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `calc(${pct}% - 4px)` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ position: 'absolute', top: -2, width: 9, height: 9, borderRadius: '50%', background: 'var(--lp-text)', border: '2px solid var(--lp-bg-2)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--lp-text-muted)', marginTop: 4 }}>
        <span>Rs {lo.toFixed(0)}</span>
        <span>Rs {hi.toFixed(0)}</span>
      </div>
    </div>
  )
}

function ChangeBadge({ value }) {
  const numeric = Number(value || 0)
  return (
    <span className={numeric >= 0 ? 'badge-profit' : 'badge-loss'}>
      {numeric >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {formatPercent(numeric)}
    </span>
  )
}
