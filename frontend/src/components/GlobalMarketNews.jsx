import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper, Search, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { marketApi } from '../lib/api'
import { formatTimeAgoIso } from '../lib/utils'

const PAGE_SIZE = 20
// How often to quietly check page 1 for articles newer than what's on
// screen. The backend's own ingestion scheduler runs every 7 minutes
// (NewsIngestionScheduler.java), so checking more often than that just
// catches the same batch sooner without hammering the service.
const LIVE_CHECK_MS = 60000

// Values here match exactly what NewsFeedRegistry.java tags articles with
// (country/region columns) — every chip actually filters real data, none
// are decorative placeholders that would silently return zero results.
const COUNTRY_FILTERS = [
  { label: 'All', value: '' },
  { label: '🇺🇸 US', value: 'United States' },
  { label: '🇮🇳 India', value: 'India' },
  { label: '🇬🇧 UK', value: 'United Kingdom' },
  { label: '🇩🇪 Germany', value: 'Germany' },
  { label: '🇨🇳 China', value: 'China' },
  { label: '🇦🇺 Australia', value: 'Australia' },
  { label: 'Europe', value: 'Europe' },
  { label: 'Asia', value: 'Asia' },
  { label: 'North America', value: 'North America' },
  { label: 'Global', value: 'Global' },
]

// Matches NewsCategoryClassifier.java's keyword buckets exactly (plus its
// "Markets" fallback), so every chip corresponds to a category articles can
// actually be tagged with.
const CATEGORY_FILTERS = [
  'All', 'Markets', 'Stocks', 'Economy', 'Central Banks', 'Interest Rates', 'Inflation',
  'Forex', 'Commodities', 'Bonds', 'Crypto', 'Companies', 'IPO', 'Banking', 'Technology',
  'Geopolitics', 'Energy',
]

// Builds a Google-style page list with ellipsis gaps, e.g. [1,'...',4,5,6,'...',124]
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const withGaps = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) withGaps.push('...')
    withGaps.push(sorted[i])
  }
  return withGaps
}

const GlobalMarketNews = forwardRef(function GlobalMarketNews(_props, ref) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalArticles, setTotalArticles] = useState(0)

  const [countryFilter, setCountryFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const [refreshing, setRefreshing] = useState(false)
  const [newCount, setNewCount] = useState(null)

  // Background "live" check: page 1 + no filters is the only view where
  // "newer articles exist" is a meaningful, correct signal (a filtered or
  // paged-back view has no well-defined "newest" to compare against). Refs
  // hold the latest values so the poll interval itself never has to be torn
  // down and recreated just because a load finished.
  const [liveNewCount, setLiveNewCount] = useState(0)
  const articlesRef = useRef(articles)
  const totalArticlesRef = useRef(totalArticles)
  const viewingDefaultRef = useRef(true)
  useEffect(() => { articlesRef.current = articles }, [articles])
  useEffect(() => { totalArticlesRef.current = totalArticles }, [totalArticles])
  useEffect(() => {
    viewingDefaultRef.current = page === 1 && !countryFilter && !categoryFilter && !activeSearch
    if (!viewingDefaultRef.current) setLiveNewCount(0)
  }, [page, countryFilter, categoryFilter, activeSearch])

  const load = async (targetPage = page) => {
    setLoading(true)
    try {
      const { data } = await marketApi.get('/api/news', {
        params: {
          country: countryFilter || undefined,
          category: categoryFilter || undefined,
          search: activeSearch || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        },
      })
      setArticles(data.articles || [])
      setPage(data.page || targetPage)
      setTotalPages(Math.max(1, data.totalPages || 1))
      setTotalArticles(data.totalArticles || 0)
    } catch {
      toast.error('News service not reachable')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch page 1 whenever a filter changes — changing a filter always
  // resets to the newest matching page rather than keeping a stale offset.
  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter, categoryFilter, activeSearch])

  const goToPage = (target) => {
    if (target < 1 || target > totalPages || target === page) return
    load(target)
    document.getElementById('global-news-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setActiveSearch(searchInput.trim())
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const { data } = await marketApi.post('/api/news/refresh')
      setNewCount(data.newArticles || 0)
      // Only jump the user back to page 1 on an explicit Refresh click —
      // the background scheduler ingesting new articles never does this
      // on its own (spec §20: don't move the user away from their page).
      await load(1)
    } catch {
      toast.error('News refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  useImperativeHandle(ref, () => ({ refresh }))

  // Poll for new articles landing in the background (from the scheduled
  // ingestion job) without disrupting whatever the person is doing — this
  // never auto-reloads the list, it only surfaces a dismissible "N new"
  // banner they can act on, same pattern as the post-Refresh banner above.
  useEffect(() => {
    const checkForNew = async () => {
      if (!viewingDefaultRef.current) return
      try {
        const { data } = await marketApi.get('/api/news', { params: { page: 1, limit: 1 } })
        const latestId = data.articles?.[0]?.id
        const knownLatestId = articlesRef.current[0]?.id
        const extra = (data.totalArticles || 0) - totalArticlesRef.current
        if (latestId && knownLatestId && latestId !== knownLatestId && extra > 0) {
          setLiveNewCount(extra)
        }
      } catch {
        // Silent — this is a background poll, not a user action; a failed
        // check just tries again next interval.
      }
    }
    const interval = setInterval(checkForNew, LIVE_CHECK_MS)
    return () => clearInterval(interval)
  }, [])

  const showLatest = () => {
    setLiveNewCount(0)
    load(1)
  }

  return (
    <div className="card" style={{ marginBottom: 24 }} id="global-news-top">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Newspaper size={16} color="var(--lp-accent)" />
        <h2 style={{ fontSize: 14, fontWeight: 700 }}>Global Market News</h2>
      </div>
      <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 16 }}>
        Real headlines from publishers worldwide, archived permanently and searchable
      </p>

      {liveNewCount > 0 && (
        <button
          onClick={showLatest}
          className="btn-ghost"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
            borderColor: 'var(--lp-accent)', color: 'var(--lp-accent)', marginBottom: 14, padding: '10px 14px',
          }}
        >
          <Sparkles size={13} /> {liveNewCount} new article{liveNewCount === 1 ? '' : 's'} just published — Show
        </button>
      )}

      {newCount !== null && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--lp-surface)', border: '1px solid var(--lp-border)',
            borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 12,
          }}
        >
          <span>{newCount > 0 ? `${newCount} new article${newCount === 1 ? '' : 's'} added` : 'No new articles right now'}</span>
          <button onClick={() => setNewCount(null)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Dismiss</button>
        </div>
      )}

      {/* Country / region filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {COUNTRY_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setCountryFilter(f.value)}
            className="market-chip"
            style={{
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              borderColor: countryFilter === f.value ? 'var(--lp-accent)' : undefined,
              color: countryFilter === f.value ? 'var(--lp-accent)' : undefined,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORY_FILTERS.map((c) => {
          const value = c === 'All' ? '' : c
          const active = categoryFilter === value
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(value)}
              className="market-chip"
              style={{
                cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '6px 12px',
                borderColor: active ? 'var(--lp-accent)' : undefined,
                color: active ? 'var(--lp-accent)' : undefined,
              }}
            >
              {c}
            </button>
          )
        })}
      </div>

      <form onSubmit={submitSearch} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search the news archive, e.g. Federal Reserve"
        />
        <button className="btn-primary" type="submit"><Search size={14} /> Search</button>
        {activeSearch && (
          <button type="button" className="btn-ghost" onClick={() => { setSearchInput(''); setActiveSearch('') }}>
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <p style={{ color: 'var(--lp-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Loading news...</p>
      ) : articles.length === 0 ? (
        <p style={{ color: 'var(--lp-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          No articles match these filters yet — try Refresh or a different filter.
        </p>
      ) : (
        <div className="news-grid">
          {articles.map((item) => (
            <a key={item.id} href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="news-item">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                {item.country && <span style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>{item.country}</span>}
                <span style={{ fontSize: 10, color: 'var(--lp-accent)', fontWeight: 700 }}>{item.category}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{item.title}</p>
              {item.description && (
                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>{item.source}</span>
                <span style={{ fontSize: 11, color: 'var(--lp-text-muted)', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  {formatTimeAgoIso(item.publishedAt)} <ExternalLink size={10} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 10, textAlign: 'center' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalArticles)} of {totalArticles.toLocaleString()} articles
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn-ghost" disabled={page === 1} onClick={() => goToPage(page - 1)} style={{ padding: '6px 10px' }}>
              <ChevronLeft size={14} />
            </button>
            {buildPageList(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`gap-${i}`} style={{ fontSize: 12, color: 'var(--lp-text-muted)', padding: '0 4px' }}>...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={p === page ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '6px 12px', minWidth: 34, fontSize: 12 }}
                >
                  {p}
                </button>
              )
            )}
            <button className="btn-ghost" disabled={page === totalPages} onClick={() => goToPage(page + 1)} style={{ padding: '6px 10px' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {refreshing && <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', textAlign: 'center', marginTop: 10 }}>Refreshing...</p>}
    </div>
  )
})

export default GlobalMarketNews
