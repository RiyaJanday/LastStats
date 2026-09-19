import { useMemo, useState } from 'react'
import { Activity, Play, RotateCcw, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Sidebar from '../components/Sidebar'
import { analyticsApi, api } from '../lib/api'
import { formatCompact } from '../lib/utils'

const DEFAULT_PARAMS = {
  currentValue: 500000,
  monthlySip: 10000,
  years: 10,
  returnPct: 12,
  volatility: 15,
}

export default function AlgoPage() {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [result, setResult] = useState(null)
  // The params that actually produced `result` — kept separate from `params`
  // so the chart/summary stay correct even if the person nudges a slider
  // after running, without immediately re-running.
  const [resultParams, setResultParams] = useState(null)
  const [loading, setLoading] = useState(false)

  const setParam = (key) => (event) => setParams((prev) => ({ ...prev, [key]: Number(event.target.value) }))

  const setParamClamped = (key, min, max) => (event) => {
    const raw = Number(event.target.value)
    if (Number.isNaN(raw)) return
    setParams((prev) => ({ ...prev, [key]: Math.min(max, Math.max(min, raw)) }))
  }

  const resetParams = () => setParams(DEFAULT_PARAMS)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const { data } = await analyticsApi.post('/api/simulation/monte-carlo', {
        current_value: params.currentValue,
        monthly_sip: params.monthlySip,
        years: params.years,
        annual_return_pct: params.returnPct,
        annual_volatility_pct: params.volatility,
        simulations: 1000,
      })
      setResult(data.data || data)
      setResultParams(params)
    } catch {
      toast.error('Analytics not reachable. Run the analytics service on port 8090.')
    } finally {
      setLoading(false)
    }
  }

  // [key, label, min, max, step, unit shown next to the number input,
  // optional "\u2248 formatted" preview shown under the slider for large rupee values]
  const sliders = [
    ['currentValue', 'Portfolio Value', 0, 5000000, 10000, 'Rs', formatCompact],
    ['monthlySip', 'Monthly SIP', 500, 100000, 500, 'Rs', formatCompact],
    ['years', 'Years', 1, 40, 1, 'yrs', null],
    ['returnPct', 'Expected Return', 1, 30, 0.5, '%', null],
    ['volatility', 'Volatility', 1, 50, 0.5, '%', null],
  ]

  const nothingToSimulate = params.currentValue <= 0 && params.monthlySip <= 0

  // Backend samples every 3rd month to keep the payload small (see
  // monte_carlo.py) — reconstruct the real month index per point, plus a
  // straight "total invested so far" reference line using the params that
  // actually produced this result (not any slider value changed since).
  const chartSeries = useMemo(() => {
    if (!result?.chart_data || !resultParams) return []
    const { p10, p50, p90 } = result.chart_data
    return p50.map((value, i) => {
      const month = i * 3
      return {
        month,
        years: Math.round((month / 12) * 10) / 10,
        p10: p10[i],
        bandHeight: p90[i] - p10[i],
        p50: value,
        p90: p90[i],
        invested: resultParams.currentValue + resultParams.monthlySip * month,
      }
    })
  }, [result, resultParams])

  const [drawdown, setDrawdown] = useState(null)
  const [drawdownLoading, setDrawdownLoading] = useState(false)

  const runDrawdown = async () => {
    setDrawdownLoading(true)
    try {
      // Pull the same daily snapshot history that powers the Dashboard
      // chart, across every one of the user's portfolios (range=ALL so
      // the drawdown analysis sees the full history, not just 1 month).
      const { data: historyRes } = await api.get('/api/portfolios/history', { params: { range: 'ALL' } })
      const history = historyRes.data || historyRes || []
      if (history.length < 2) {
        toast.error('Not enough snapshot history yet — check back after a few days of data.')
        setDrawdown(null)
        return
      }
      const series = history.map((point) => ({ date: point.date, value: point.currentValue }))
      const { data } = await analyticsApi.post('/api/drawdown/analyze', { series })
      setDrawdown(data.data || data)
    } catch {
      toast.error('Analytics not reachable. Run the analytics service on port 8090.')
    } finally {
      setDrawdownLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">
        <div className="top-bar">
          <div>
            <p className="top-bar-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="var(--lp-accent)" /> Algo Engine
            </p>
            <p className="top-bar-sub">Monte Carlo portfolio simulation</p>
          </div>
        </div>

        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', gap: 24 }}>
            <div className="card" style={{ height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lp-text)' }}>Parameters</h2>
                <button onClick={resetParams} className="btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}>
                  <RotateCcw size={11} /> Reset
                </button>
              </div>
              {sliders.map(([key, label, min, max, step, unit, formatFn]) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text-muted)' }}>{label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={params[key]}
                        onChange={setParamClamped(key, min, max)}
                        style={{
                          width: 76, fontSize: 12, fontWeight: 700, color: 'var(--lp-accent)',
                          background: 'var(--lp-surface)', border: '1px solid var(--lp-border)',
                          borderRadius: 6, padding: '3px 6px', textAlign: 'right',
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>{unit}</span>
                    </div>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={params[key]} onChange={setParam(key)} style={{ width: '100%', accentColor: 'var(--lp-accent)' }} />
                  {formatFn && (
                    <p style={{ fontSize: 10, color: 'var(--lp-text-muted)', textAlign: 'right', marginTop: 3 }}>
                      &#8776; {formatFn(params[key])}
                    </p>
                  )}
                </div>
              ))}
              <button onClick={runSimulation} disabled={loading || nothingToSimulate} className="btn-primary" style={{ width: '100%', padding: 12 }}>
                <Play size={14} /> {loading ? 'Simulating...' : 'Run Simulation'}
              </button>
              {nothingToSimulate ? (
                <p style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', marginTop: 10 }}>Set a starting portfolio value or a monthly SIP to run a simulation.</p>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', textAlign: 'center', marginTop: 10 }}>1,000 paths - Geometric Brownian Motion</p>
              )}
            </div>

            <div>
              {result ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="stat-grid stat-grid-3">
                    <ResultCard label="Median (P50)" value={formatCompact(result.percentiles?.p50)} color="var(--lp-text)" />
                    <ResultCard label="Best Case (P90)" value={formatCompact(result.percentiles?.p90)} color="#16a34a" />
                    <ResultCard label="Worst Case (P10)" value={formatCompact(result.percentiles?.p10)} color="#dc2626" />
                    <ResultCard label="Total Invested" value={formatCompact(result.total_invested)} color="var(--lp-text-muted)" />
                    <ResultCard label="Profit Probability" value={`${result.probability_of_profit || 0}%`} color="var(--lp-accent)" />
                    <ResultCard label="Simulations" value={Number(result.simulations || 0).toLocaleString()} color="var(--lp-text)" />
                  </div>
                  {chartSeries.length > 0 && (
                    <div className="card">
                      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lp-text)', marginBottom: 4 }}>Projected growth over time</h2>
                      <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 16 }}>
                        Shaded band = P10–P90 range across all 1,000 simulated paths - dashed line = money actually put in
                      </p>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="algoBandFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--lp-accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--lp-accent)" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--lp-border)" vertical={false} />
                            <XAxis
                              dataKey="years"
                              tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `Yr ${v}`}
                            />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--lp-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} width={60} />
                            <Tooltip content={<SimulationTooltip />} />
                            <Area type="monotone" dataKey="p10" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                            <Area type="monotone" dataKey="bandHeight" stackId="band" stroke="none" fill="url(#algoBandFill)" isAnimationActive={false} />
                            <Line type="monotone" dataKey="p50" stroke="var(--lp-accent)" strokeWidth={2.5} dot={false} animationDuration={700} />
                            <Line type="monotone" dataKey="invested" stroke="var(--lp-text-muted)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} animationDuration={700} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="card">
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lp-text)', marginBottom: 16 }}>
                      Outcome range after {resultParams?.years ?? params.years} years
                    </h2>
                    <div style={{ position: 'relative', height: 64, background: 'var(--lp-surface)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: '5%', right: '5%', top: 22, height: 20, background: 'linear-gradient(to right, rgba(220, 38, 38, 0.18), rgba(22, 163, 74, 0.18))', borderRadius: 10 }} />
                      <div style={{ position: 'absolute', left: '50%', top: 12, width: 3, height: 42, background: 'var(--lp-accent)', borderRadius: 2, transform: 'translateX(-50%)' }} />
                      <RangeLabel align="left" value={formatCompact(result.percentiles?.p10)} color="#dc2626" />
                      <RangeLabel align="center" value={formatCompact(result.percentiles?.p50)} color="var(--lp-accent)" />
                      <RangeLabel align="right" value={formatCompact(result.percentiles?.p90)} color="#16a34a" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card empty-state" style={{ minHeight: 360 }}>
                  <Activity size={52} color="var(--lp-accent)" />
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--lp-text)' }}>Run a simulation</p>
                  <p>Adjust the sliders and run the model to see possible portfolio futures.</p>
                </div>
              )}

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--lp-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingDown size={16} color="var(--lp-accent)" /> Drawdown Analysis
                  </h2>
                  <button onClick={runDrawdown} disabled={drawdownLoading} className="btn-ghost" style={{ fontSize: 12 }}>
                    {drawdownLoading ? 'Analyzing...' : 'Analyze my portfolio'}
                  </button>
                </div>
                {drawdown ? (
                  <div className="stat-grid stat-grid-3">
                    <ResultCard label="Max Drawdown" value={`${drawdown.max_drawdown_percent}%`} color="#dc2626" />
                    <ResultCard label="Peak → Trough" value={`${drawdown.peak_date} \u2192 ${drawdown.trough_date}`} color="var(--lp-text-muted)" />
                    <ResultCard label="Days to Trough" value={`${drawdown.days_to_trough} days`} color="var(--lp-text)" />
                    <ResultCard
                      label="Recovery"
                      value={drawdown.recovery_date ? `${drawdown.days_to_recovery} days` : 'Not yet recovered'}
                      color={drawdown.recovery_date ? '#16a34a' : '#dc2626'}
                    />
                    <ResultCard label="Current Drawdown" value={`${drawdown.current_drawdown_percent}%`} color="var(--lp-text)" />
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--lp-text-muted)' }}>
                    Uses your daily portfolio snapshots (Dashboard's history data) to find the worst peak-to-trough decline and whether it's recovered yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SimulationTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div style={{ background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 10, fontSize: 12, padding: '10px 14px' }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>Year {label}</p>
      <p style={{ color: '#16a34a', marginBottom: 2 }}>Best case (P90): {formatCompact(point.p90)}</p>
      <p style={{ color: 'var(--lp-accent)', marginBottom: 2 }}>Median (P50): {formatCompact(point.p50)}</p>
      <p style={{ color: '#dc2626', marginBottom: 2 }}>Worst case (P10): {formatCompact(point.p10)}</p>
      <p style={{ color: 'var(--lp-text-muted)' }}>Invested so far: {formatCompact(point.invested)}</p>
    </div>
  )
}

function ResultCard({ label, value, color }) {
  return (
    <div className="card">
      <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function RangeLabel({ align, value, color }) {
  const position = align === 'left' ? { left: '5%' } : align === 'right' ? { right: '5%' } : { left: '50%', transform: 'translateX(-50%)' }
  return <p style={{ position: 'absolute', bottom: 5, fontSize: 11, color, fontWeight: 700, whiteSpace: 'nowrap', ...position }}>{value}</p>
}
