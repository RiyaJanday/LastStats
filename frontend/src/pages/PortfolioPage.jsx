import { useEffect, useState } from 'react'
import { Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import { analyticsApi, api } from '../lib/api'
import { formatCompact, formatDate, formatPercent } from '../lib/utils'

const initialForm = {
  fundIsin: '',
  fundName: '',
  fundCategory: 'Equity',
  transactionType: 'BUY',
  units: '',
  nav: '',
  amount: '',
  transactionDate: new Date().toISOString().split('T')[0],
  folioNumber: '',
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState([])
  const [selected, setSelected] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(initialForm)
  // Per-fund XIRR (money-weighted return, accounts for exact transaction
  // dates/amounts — unlike gainPercent, which is a simple invested-vs-current
  // comparison). Keyed by fundIsin. null = not yet computed, undefined key =
  // still loading, false = computed but not available (e.g. single-day history).
  const [xirrByIsin, setXirrByIsin] = useState({})

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const loadTransactions = async (portfolioId) => {
    try {
      const { data } = await api.get(`/api/portfolios/${portfolioId}/transactions`)
      setTransactions(Array.isArray(data) ? data : data.data || [])
    } catch {
      setTransactions([])
    }
  }

  const loadPortfolios = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/portfolios')
      const list = data.data || []
      setPortfolios(list)
      const nextSelected = list.find((item) => item.id === selected?.id) || list[0] || null
      setSelected(nextSelected)
      if (nextSelected) await loadTransactions(nextSelected.id)
    } catch {
      toast.error('Could not load portfolios')
      setPortfolios([])
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortfolios()
  }, [])

  // Recompute per-holding XIRR whenever the selected portfolio's holdings
  // or transaction history changes. XIRR needs every real cash flow for a
  // fund (each BUY/SIP as money invested, each SELL/DIVIDEND as money
  // returned) plus today's current value as the final flow — it's the
  // analytics service's job (POST /api/xirr/calculate), not something to
  // approximate from investedAmount/currentValue alone.
  useEffect(() => {
    if (!selected || (selected.holdings || []).length === 0) {
      setXirrByIsin({})
      return
    }
    let cancelled = false
    const todayIso = new Date().toISOString().split('T')[0]

    const computeAll = async () => {
      const entries = await Promise.all(
        selected.holdings.map(async (holding) => {
          const cashflows = transactions
            .filter((t) => t.fundIsin === holding.fundIsin)
            .map((t) => ({
              date: t.transactionDate,
              // XIRR convention here: positive amount = money invested
              // (outflow), negative = money returned (inflow). BUY/SIP put
              // money in; SELL/DIVIDEND take money out.
              amount: t.transactionType === 'SELL' || t.transactionType === 'DIVIDEND'
                ? -Number(t.amount)
                : Number(t.amount),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))

          if (cashflows.length === 0) return [holding.fundIsin, false]

          try {
            const { data } = await analyticsApi.post('/api/xirr/calculate', {
              cashflows,
              current_value: Number(holding.currentValue || 0),
              current_date: todayIso,
            })
            const result = data.data || data
            return [holding.fundIsin, typeof result?.xirr === 'number' ? result.xirr : false]
          } catch {
            return [holding.fundIsin, false]
          }
        })
      )
      if (!cancelled) setXirrByIsin(Object.fromEntries(entries))
    }

    computeAll()
    return () => { cancelled = true }
  }, [selected, transactions])

  const createPortfolio = async () => {
    try {
      await api.post('/api/portfolios', null, { params: { name: 'My Portfolio' } })
      toast.success('Portfolio created')
      loadPortfolios()
    } catch {
      toast.error('Failed to create portfolio')
    }
  }

  const addTransaction = async (event) => {
    event.preventDefault()
    if (!selected) return
    setSubmitting(true)
    try {
      await api.post(`/api/portfolios/${selected.id}/transactions`, {
        ...form,
        units: Number(form.units),
        nav: Number(form.nav),
        amount: Number(form.amount),
      })
      toast.success('Transaction added')
      setShowModal(false)
      setForm(initialForm)
      loadPortfolios()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="page-main">
        <div className="top-bar">
          <div>
            <p className="top-bar-title">Portfolio</p>
            <p className="top-bar-sub">Holdings and transaction history</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={loadPortfolios} className="btn-ghost">
              <RefreshCw size={13} /> Refresh
            </button>
            {portfolios.length === 0 && !loading && (
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

        <div className="page-content">
          {!loading && portfolios.length === 0 && (
            <div className="card empty-state">
              <p style={{ fontWeight: 700, color: 'var(--lp-text)' }}>No portfolio yet</p>
              <p>Click Create Portfolio to get started.</p>
            </div>
          )}

          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="stat-grid stat-grid-3">
                {[
                  ['Invested', formatCompact(selected.totalInvested), 'var(--lp-text)'],
                  ['Value', formatCompact(selected.currentValue), 'var(--lp-text)'],
                  [
                    'Gain / Loss',
                    formatCompact(Math.abs(selected.totalGain || 0)),
                    (selected.totalGain || 0) >= 0 ? '#16a34a' : '#dc2626',
                    formatPercent(selected.totalGainPercent),
                  ],
                ].map(([label, value, color, sub]) => (
                  <div key={label} className="card" style={{ padding: 18 }}>
                    <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginBottom: 6 }}>{label}</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
                    {sub && <p style={{ fontSize: 12, color, marginTop: 4 }}>{sub}</p>}
                  </div>
                ))}
              </div>

              <div className="card">
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
                  Holdings ({selected.holdingsCount || selected.holdings?.length || 0})
                </h2>
                {(selected.holdings || []).length === 0 ? (
                  <div className="empty-state">
                    <p>No holdings yet</p>
                    <p>Add your first transaction to see holdings here.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 840, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['Fund', 'Units', 'Avg NAV', 'Curr NAV', 'Invested', 'Value', 'Gain %', 'XIRR'].map((h) => <th key={h} className="tbl-header">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {selected.holdings.map((holding) => (
                          <tr key={holding.id || holding.fundIsin}>
                            <td className="tbl-cell">
                              <p style={{ fontWeight: 700 }}>{holding.fundName}</p>
                              <p style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>{holding.fundIsin}</p>
                            </td>
                            <td className="tbl-cell">{Number(holding.units || 0).toFixed(3)}</td>
                            <td className="tbl-cell">Rs {Number(holding.avgNav || 0).toFixed(2)}</td>
                            <td className="tbl-cell">Rs {Number(holding.currentNav || 0).toFixed(2)}</td>
                            <td className="tbl-cell">{formatCompact(holding.investedAmount)}</td>
                            <td className="tbl-cell">{formatCompact(holding.currentValue)}</td>
                            <td className="tbl-cell">
                              <span className={(holding.gainPercent || 0) >= 0 ? 'badge-profit' : 'badge-loss'}>
                                {(holding.gainPercent || 0) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {formatPercent(holding.gainPercent)}
                              </span>
                            </td>
                            <td className="tbl-cell" title="Money-weighted return — accounts for the exact date/amount of every transaction, unlike Gain % above">
                              {(() => {
                                const xirrValue = xirrByIsin[holding.fundIsin]
                                if (xirrValue === undefined) return <span style={{ color: 'var(--lp-text-muted)', fontSize: 11 }}>Calculating...</span>
                                if (xirrValue === false) return <span style={{ color: 'var(--lp-text-muted)' }}>—</span>
                                return (
                                  <span className={xirrValue >= 0 ? 'badge-profit' : 'badge-loss'}>
                                    {xirrValue >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    {formatPercent(xirrValue)}
                                  </span>
                                )
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {transactions.length > 0 && (
                <div className="card">
                  <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Recent Transactions</h2>
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--lp-border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700 }}>{transaction.fundName}</p>
                        <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginTop: 2 }}>
                          {formatDate(transaction.transactionDate)} - {transaction.transactionType} - {Number(transaction.units || 0).toFixed(3)} units
                        </p>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: transaction.transactionType === 'SELL' ? '#dc2626' : '#16a34a' }}>
                        {transaction.transactionType === 'SELL' ? '-' : '+'}{formatCompact(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Add Transaction</h3>
              <form onSubmit={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="input-label">Fund ISIN</label>
                  <input className="input" value={form.fundIsin} onChange={setField('fundIsin')} placeholder="INF090I01239" required />
                </div>
                <div>
                  <label className="input-label">Fund Name</label>
                  <input className="input" value={form.fundName} onChange={setField('fundName')} placeholder="HDFC Flexi Cap Fund - Direct" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Category</label>
                    <select className="input" value={form.fundCategory} onChange={setField('fundCategory')}>
                      {['Equity', 'Debt', 'Hybrid', 'ELSS', 'Index', 'International'].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Type</label>
                    <select className="input" value={form.transactionType} onChange={setField('transactionType')}>
                      {['BUY', 'SELL', 'SIP', 'DIVIDEND'].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Units</label>
                    <input className="input" type="number" step="0.001" value={form.units} onChange={setField('units')} required />
                  </div>
                  <div>
                    <label className="input-label">NAV</label>
                    <input className="input" type="number" step="0.01" value={form.nav} onChange={setField('nav')} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="input-label">Amount</label>
                    <input className="input" type="number" step="0.01" value={form.amount} onChange={setField('amount')} required />
                  </div>
                  <div>
                    <label className="input-label">Date</label>
                    <input className="input" type="date" value={form.transactionDate} onChange={setField('transactionDate')} required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Folio Number</label>
                  <input className="input" value={form.folioNumber} onChange={setField('folioNumber')} placeholder="Optional" />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => { setShowModal(false); setForm(initialForm) }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>{submitting ? 'Adding...' : 'Add Transaction'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
