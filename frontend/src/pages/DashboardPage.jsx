import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  Bot,
  CalendarDays,
  Globe,
  Layers,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import { api, marketApi } from '../lib/api'
import { getSession } from '../lib/auth'
import { formatCompact, formatPercent } from '../lib/utils'

const RANGES = ['1W', '1M', '3M', '1Y', 'ALL']

const DONUT_COLORS = ['var(--lp-accent)', 'var(--lp-accent-2)', '#8b5cf6', '#f472b6', '#22c55e', '#eab308', '#06b6d4']
const MARKET_REFRESH_MS = 30000

// Real fund_category values from the backend (Equity/Debt/Gold/International/etc.)
// mapped to a stable color so the same category always reads the same way
// across the donut, the table, and the exposure bars.
const CATEGORY_COLORS = {
  Equity: '#8b5cf6',
  Debt: '#06b6d4',
  Gold: '#eab308',
  International: '#f472b6',
  Other: '#64748b',
}
const categoryColor = (name) => CATEGORY_COLORS[name] || CATEGORY_COLORS.Other

export default function DashboardPage() {
  const navigate = useNavigate()
  const session = getSession()
  const firstName = session?.name?.split(' ')[0]
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [indices, setIndices] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [flash, setFlash] = useState(false)
  const [selectedFund, setSelectedFund] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'currentValue', dir: 'desc' })
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [range, setRange] = useState('1M')
  const holdingsRef = useRef(null)

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

  const loadIndices = async () => {
    try {
      const { data } = await marketApi.get('/api/market/indices')
      setIndices(data.data || data || [])
      setLastUpdated(Date.now())
      setFlash(true)
      setTimeout(() => setFlash(false), 700)
    } catch {
      setIndices([])
    }
  }

  const loadHistory = async (selectedRange) => {
    setHistoryLoading(true)
    try {
      const { data } = await api.get(`/api/portfolios/history?range=${selectedRange}`)
      setHistory(data.data || [])
    } catch (err) {
      console.error('Could not load portfolio history', err)
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadIndices()
    const interval = setInterval(loadIndices, MARKET_REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadHistory(range)
  }, [range])

  const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0)
  const totalCurrent = portfolios.reduce((s, p) => s + p.currentValue, 0)
  const totalGain = totalCurrent - totalInvested
  const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const allHoldings = portfolios.flatMap(p => p.holdings || [])

  const allocation = allHoldings
    .filter(h => h.currentValue > 0)
    .map(h => ({ name: h.fundName, value: h.currentValue }))
    .sort((a, b) => b.value - a.value)

  const ranked = [...allHoldings].filter(h => h.gainPercent != null).sort((a, b) => b.gainPercent - a.gainPercent)
  const bestPerformer = ranked[0]
  const worstPerformer = ranked[ranked.length - 1]

  // Real per-fund gain % compared side by side — derived straight from
  // each holding's own invested vs current value, no fabricated history.
  const performanceBars = ranked.slice(0, 8).map(h => ({
    name: h.fundName?.length > 10 ? `${h.fundName.slice(0, 9)}…` : h.fundName,
    fullName: h.fundName,
    gain: Number(h.gainPercent?.toFixed(2) || 0),
  }))

  // Diversification score: 100 - normalized Herfindahl-Hirschman Index
  // of the actual allocation weights. 100 = perfectly spread out,
  // 0 = single holding. Genuinely computed, clearly labeled.
  const diversificationScore = useMemo(() => {
    if (allocation.length === 0 || totalCurrent <= 0) return 0
    const hhi = allocation.reduce((sum, a) => sum + Math.pow(a.value / totalCurrent, 2), 0)
    const minHhi = 1 / allocation.length
    if (allocation.length === 1) return 0
    const normalized = (hhi - minHhi) / (1 - minHhi)
    return Math.round((1 - normalized) * 100)
  }, [allocation, totalCurrent])

  const gaugeColor = diversificationScore >= 66 ? '#16a34a' : diversificationScore >= 33 ? '#eab308' : '#dc2626'
  const gaugeData = [{ name: 'score', value: diversificationScore, fill: gaugeColor }]

  // Sector/category exposure — grouped straight from each holding's real
  // fund_category and current_value, same numbers that back the donut.
  const categoryExposure = useMemo(() => {
    if (totalCurrent <= 0) return []
    const totals = {}
    allHoldings.forEach((h) => {
      const cat = h.fundCategory || 'Other'
      totals[cat] = (totals[cat] || 0) + (h.currentValue || 0)
    })
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value, pct: (value / totalCurrent) * 100 }))
      .sort((a, b) => b.value - a.value)
  }, [allHoldings, totalCurrent])

  const visibleHoldings = useMemo(() => {
    let list = allHoldings
    if (selectedFund) list = list.filter(h => h.fundName === selectedFund)
    if (search.trim()) list = list.filter(h => h.fundName?.toLowerCase().includes(search.trim().toLowerCase()))
    return [...list].sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      const av = a[sort.key] ?? 0
      const bv = b[sort.key] ?? 0
      if (sort.key === 'fundName') return String(av).localeCompare(String(bv)) * dir
      return (av - bv) * dir
    })
  }, [allHoldings, selectedFund, search, sort])

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  const clickFund = (name) => {
    setSelectedFund((prev) => (prev === name ? null : name))
    holdingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">

        <div className="top-bar">
          <h1 className="top-bar-title">Dashboard</h1>
          <button onClick={() => { loadData(); loadIndices(); loadHistory(range) }} className="btn-ghost">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="page-content">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card greeting-card"
            style={{ marginBottom: 20 }}
          >
            <p style={{ fontSize: 13, color: 'var(--lp-text-muted)' }}>
              {firstName ? `Hello, ${firstName}` : 'Hello'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--lp-text-muted)', marginTop: 10 }}>Total Portfolio</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--lp-text)' }}>
                {loading ? '...' : <AnimatedAmount value={totalCurrent} />}
              </p>
              {!loading && totalInvested > 0 && (
                <span className={totalGain >= 0 ? 'badge-profit' : 'badge-loss'}>
                  {totalGain >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {formatPercent(gainPercent)}
                </span>
              )}
            </div>
          </motion.div>

          <div className="quick-actions">
            <QuickAction icon={Plus} label="Add Txn" onClick={() => navigate('/portfolio')} />
            <QuickAction icon={CalendarDays} label="New SIP" onClick={() => navigate('/sip')} />
            <QuickAction icon={Globe} label="Markets" onClick={() => navigate('/market')} />
            <QuickAction icon={Bot} label="Ask AI" onClick={() => navigate('/ai')} />
          </div>

          {indices.length > 0 && (
            <div className="ticker-track" style={{ marginBottom: 10 }}>
              <span
                style={{
                  flexShrink: 0, width: 7, height: 7, borderRadius: '50%', background: '#16a34a',
                  boxShadow: flash ? '0 0 0 6px rgba(22,163,74,0.3)' : '0 0 0 3px rgba(22,163,74,0.25)',
                  transition: 'box-shadow 0.4s ease', marginRight: 10, flexShrink: 0,
                }}
              />
              <div className="ticker-viewport">
                <div className="ticker-scroll">
                  {(() => {
                    const available = indices.filter((idx) => idx.dataAvailable !== false)
                    return [...available, ...available]
                  })().map((index, i) => {
                    const change = Number(index.changePercent ?? index.percentChange ?? 0)
                    const up = change >= 0
                    return (
                      <div key={`${index.name || index.symbol}-${i}`} className="market-chip">
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lp-text)' }}>{index.name || index.symbol}</span>
                        <span style={{ fontSize: 12, color: 'var(--lp-text-muted)' }}>{Number(index.value ?? index.lastPrice ?? 0).toFixed(2)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}>
                          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {formatPercent(change)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {lastUpdated && (
            <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 20 }}>
              Live · updates every 30s · last update {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="card"
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Performance Trends</h2>
                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginTop: 2 }}>
                  Recorded once a day — today's point lands after your next snapshot
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--lp-surface)', borderRadius: 999, padding: 3 }}>
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    style={{
                      border: 'none', borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: range === r ? 'var(--lp-accent)' : 'transparent',
                      color: range === r ? '#0a0912' : 'var(--lp-text-muted)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lp-text-muted)', fontSize: 13 }}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--lp-text-muted)', textAlign: 'center', padding: '0 20px' }}>
                <p style={{ fontSize: 13 }}>No history yet — this chart fills in day by day.</p>
                <p style={{ fontSize: 11 }}>A snapshot of your real portfolio value is recorded once every 24 hours.</p>
              </div>
            ) : (
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--lp-accent)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--lp-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--lp-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} width={60} />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      formatter={(value, name) => [formatCompact(value), name === 'currentValue' ? 'Value' : 'Invested']}
                      contentStyle={{ background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 10, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="investedAmount" stroke="var(--lp-text-muted)" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} animationDuration={700} />
                    <Area type="monotone" dataKey="currentValue" stroke="var(--lp-accent)" strokeWidth={2.5} fill="url(#currentGradient)" dot={false} animationDuration={700} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          <div className="stat-grid stat-grid-4" style={{ marginBottom: '20px' }}>
            <StatCard delay={0} icon={PiggyBank} label="Total Invested" raw={totalInvested} loading={loading} />
            <StatCard delay={0.05} icon={Wallet} label="Current Value" raw={totalCurrent} loading={loading} />
            <StatCard
              delay={0.1}
              icon={totalGain >= 0 ? TrendingUp : TrendingDown}
              iconColor={totalGain >= 0 ? '#16a34a' : '#dc2626'}
              label="Gain / Loss"
              raw={Math.abs(totalGain)}
              loading={loading}
              valueColor={totalGain >= 0 ? '#16a34a' : '#dc2626'}
              sub={formatPercent(gainPercent)}
              subColor={totalGain >= 0 ? '#16a34a' : '#dc2626'}
            />
            <StatCard
              delay={0.15}
              icon={Layers}
              label="Holdings"
              value={String(allHoldings.length)}
              onClick={() => holdingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </div>

          <div className="dashboard-grid">
            <div className="card" ref={holdingsRef}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700 }}>
                  Holdings {selectedFund && <span style={{ fontWeight: 500, color: 'var(--lp-text-muted)' }}>· filtered</span>}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedFund && (
                    <button onClick={() => setSelectedFund(null)} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>
                      <X size={12} /> Clear
                    </button>
                  )}
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-text-muted)' }} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search holdings..."
                      className="input"
                      style={{ paddingLeft: 30, width: 180, fontSize: 12, padding: '7px 10px 7px 30px' }}
                    />
                  </div>
                </div>
              </div>

              {allHoldings.length === 0 ? (
                <p style={{ color: 'var(--lp-text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                  No holdings yet — go to Portfolio and add a transaction.
                </p>
              ) : visibleHoldings.length === 0 ? (
                <p style={{ color: 'var(--lp-text-muted)', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
                  No holdings match "{search}".
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lp-border)' }}>
                        <SortableHeader label="Fund" sortKey="fundName" sort={sort} onClick={toggleSort} />
                        <SortableHeader label="Invested" sortKey="investedAmount" sort={sort} onClick={toggleSort} />
                        <SortableHeader label="Value" sortKey="currentValue" sort={sort} onClick={toggleSort} />
                        <SortableHeader label="Gain %" sortKey="gainPercent" sort={sort} onClick={toggleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {visibleHoldings.map((h, i) => (
                          <motion.tr
                            key={h.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                            className="tbl-row-hover"
                            onClick={() => clickFund(h.fundName)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="tbl-cell">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', background: 'var(--lp-accent-soft, var(--lp-surface))', color: 'var(--lp-accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {h.fundName?.slice(0, 2).toUpperCase()}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.fundName}</p>
                                  {h.fundCategory && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--lp-text-muted)', marginTop: 1 }}>
                                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: categoryColor(h.fundCategory), flexShrink: 0 }} />
                                      {h.fundCategory}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="tbl-cell">{formatCompact(h.investedAmount)}</td>
                            <td className="tbl-cell">{formatCompact(h.currentValue)}</td>
                            <td className="tbl-cell">
                              <span className={h.gainPercent >= 0 ? 'badge-profit' : 'badge-loss'}>
                                {h.gainPercent >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {formatPercent(h.gainPercent)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}

              {performanceBars.length > 1 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--lp-border)' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Holdings Performance</h2>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceBars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, 'Gain']}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                          contentStyle={{ background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 10, fontSize: 12 }}
                        />
                        <Bar dataKey="gain" radius={[6, 6, 0, 0]} animationDuration={800}>
                          {performanceBars.map((entry) => (
                            <Cell key={entry.fullName} fill={entry.gain >= 0 ? '#16a34a' : '#dc2626'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Asset Allocation</h2>
                {allocation.length === 0 ? (
                  <p style={{ color: 'var(--lp-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No holdings to break down yet.</p>
                ) : (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocation}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                            onClick={(entry) => clickFund(entry.name)}
                            style={{ cursor: 'pointer' }}
                            animationDuration={700}
                          >
                            {allocation.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                                stroke="none"
                                opacity={selectedFund && selectedFund !== entry.name ? 0.3 : 1}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCompact(value)} contentStyle={{ background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 10, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {allocation.slice(0, 6).map((entry, index) => (
                        <button
                          key={entry.name}
                          onClick={() => clickFund(entry.name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, width: '100%',
                            background: selectedFund === entry.name ? 'var(--lp-surface)' : 'transparent',
                            border: 'none', borderRadius: 8, padding: '5px 6px', cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[index % DONUT_COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: 'var(--lp-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
                          <span style={{ color: 'var(--lp-text-muted)' }}>{((entry.value / totalCurrent) * 100).toFixed(1)}%</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {allocation.length > 1 && (
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Shield size={14} color={gaugeColor} />
                    <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Diversification</h2>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 6 }}>
                    How evenly your money is spread across holdings
                  </p>
                  <div style={{ height: 160, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        data={gaugeData}
                        innerRadius="70%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        barSize={14}
                      >
                        <RadialBar dataKey="value" cornerRadius={20} background={{ fill: 'var(--lp-surface)' }} animationDuration={900} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--lp-text)' }}><AnimatedNumber value={diversificationScore} /></span>
                      <span style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>/ 100</span>
                    </div>
                  </div>
                </div>
              )}

              {categoryExposure.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Sector Exposure</h2>
                  <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 14 }}>
                    Real spread across your holdings' fund categories
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {categoryExposure.map((c, i) => (
                      <div key={c.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: 'var(--lp-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: categoryColor(c.name), flexShrink: 0 }} />
                            {c.name}
                          </span>
                          <span style={{ color: 'var(--lp-text-muted)' }}>{c.pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 999, background: 'var(--lp-surface)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.pct}%` }}
                            transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 999, background: categoryColor(c.name) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(bestPerformer || worstPerformer) && (
                <div className="card">
                  <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Top Movers</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bestPerformer && (
                      <MoverRow label="Best performer" name={bestPerformer.fundName} percent={bestPerformer.gainPercent} up onClick={() => clickFund(bestPerformer.fundName)} />
                    )}
                    {worstPerformer && worstPerformer !== bestPerformer && (
                      <MoverRow label="Worst performer" name={worstPerformer.fundName} percent={worstPerformer.gainPercent} up={false} onClick={() => clickFund(worstPerformer.fundName)} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Counts up from 0 to `value` on mount / whenever value changes.
// Pure presentation — no data fabrication, just eases the real number in.
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  useEffect(() => {
    const from = fromRef.current
    const to = Number(value) || 0
    const start = performance.now()
    let raf
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return display
}

function AnimatedAmount({ value }) {
  const display = useCountUp(value)
  return <>{formatCompact(display)}</>
}

function AnimatedNumber({ value }) {
  const display = useCountUp(value)
  return <>{Math.round(display)}</>
}

function StatCard({ icon: Icon, iconColor, label, value, raw, loading, valueColor, sub, subColor, onClick, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
      className="card card-interactive"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--lp-accent-soft, var(--lp-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={iconColor || 'var(--lp-accent)'} />
        </span>
        <p style={{ fontSize: '12px', color: 'var(--lp-text-muted)' }}>{label}</p>
      </div>
      <p style={{ fontSize: '22px', fontWeight: 700, color: valueColor || 'var(--lp-text)' }}>
        {loading ? '...' : raw !== undefined ? <AnimatedAmount value={raw} /> : value}
      </p>
      {sub && <p style={{ fontSize: '12px', marginTop: 2, color: subColor || 'var(--lp-text-muted)' }}>{sub}</p>}
    </motion.div>
  )
}

function MoverRow({ label, name, percent, up, onClick }) {
  return (
    <button onClick={onClick} className="mover-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'transparent', border: 'none', padding: '4px 0', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>{label}</p>
        <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--lp-text)' }}>{name}</p>
      </div>
      <span className={up ? 'badge-profit' : 'badge-loss'} style={{ flexShrink: 0 }}>
        {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {formatPercent(percent)}
      </span>
    </button>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="quick-action-btn">
      <span className="quick-action-icon"><Icon size={17} /></span>
      {label}
    </button>
  )
}

function SortableHeader({ label, sortKey, sort, onClick }) {
  const active = sort.key === sortKey
  return (
    <th className="tbl-header" onClick={() => onClick(sortKey)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: active ? 'var(--lp-accent)' : undefined }}>
        {label}
        <ArrowUpDown size={10} style={{ opacity: active ? 1 : 0.4, transform: active && sort.dir === 'asc' ? 'scaleY(-1)' : 'none' }} />
      </span>
    </th>
  )
}
