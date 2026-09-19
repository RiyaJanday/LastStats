import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { Search, TrendingDown, TrendingUp, X } from 'lucide-react'
import { formatPercent } from '../lib/utils'
import { marketApi } from '../lib/api'

// Real country-boundary geometry (Natural Earth, 50m resolution, via the
// world-atlas npm package) loaded straight from a CDN — no geometry is
// hand-embedded in this file. 50m (not 110m) was chosen deliberately:
// 110m collapses Hong Kong into China, and HKEX is one of our tracked
// exchanges, so it needs its own hoverable shape.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

const REFRESH_MS = 60000
// How many exchanges to preview directly in the hover tooltip before
// truncating to "+N more — click for full list", per the requirement that
// a country with a large roster (e.g. the US) shouldn't blow up the tooltip.
const TOOLTIP_PREVIEW_COUNT = 4

// Maps GET /api/market/exchanges `country` (from exchanges.json, the
// MASTER REFERENCE LIST) to world-atlas's `properties.name` for the
// entries known to diverge from that spelling. This list is necessarily
// best-effort — Natural Earth's exact strings shift slightly between
// dataset vintages, and a handful of small/contested territories (Kosovo,
// Palestine, several Caribbean dependencies) may not exist as their own
// polygon in the 50m file at all. Nothing is silently lost either way:
// every exchange — matched to a polygon or not — still appears in the
// "All tracked exchanges" list below the map. If you spot a country that
// has exchanges but never highlights on the map, add its correct
// world-atlas name here.
const COUNTRY_NAME_OVERRIDES = {
  'United States': 'United States of America',
  'Dominican Republic': 'Dominican Rep.',
  'Central African Republic': 'Central African Rep.',
  'Republic of Congo': 'Congo',
  "Cote d'Ivoire": "Côte d'Ivoire",
  Eswatini: 'eSwatini',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Antigua and Barbuda': 'Antigua and Barb.',
  'Saint Kitts and Nevis': 'St. Kitts and Nevis',
  'Saint Vincent and the Grenadines': 'St. Vin. and Gren.',
}

// GIFT City, Gujarat isn't a country, so it can't come from country
// geometry — it's plotted as its own point marker at its real coordinates,
// showing India's two live exchanges (NSE, BSE) since GIFT Nifty itself
// has no free live feed.
const GIFT_CITY = {
  label: 'GIFT City, Gujarat',
  coordinates: [72.68, 23.15],
  note: "GIFT Nifty isn't available via a free live feed — showing India's national exchanges",
}

const WorldMarketsMap = forwardRef(function WorldMarketsMap(_props, ref) {
  const wrapRef = useRef(null)
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)
  // { country, list, x, y } for a tracked country, or { country: null, label, x, y }
  // for a country with no listed exchange — the two are rendered differently.
  const [hover, setHover] = useState(null)
  const [selected, setSelected] = useState(null) // { country, list } — open detail modal
  const [query, setQuery] = useState('')

  // Shared by the mount-time load, the background poll, and the parent's
  // explicit Refresh button (via the exposed ref). Returns true/false so
  // the caller can show "Markets updated" vs "Markets partially updated"
  // without this component needing to know about toasts.
  // On failure, the PREVIOUSLY loaded exchange list is kept rather than
  // cleared — a transient network error refreshing the map shouldn't make
  // countries that were already showing disappear.
  const loadExchanges = async () => {
    try {
      const { data } = await marketApi.get('/api/market/exchanges')
      setExchanges(data.data || data || [])
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  useImperativeHandle(ref, () => ({ refresh: loadExchanges }))

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (!cancelled) await loadExchanges()
    }
    tick()
    const interval = setInterval(tick, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Group every exchange in the master list by its country — this is what
  // makes every country (not just the ~10 that used to be hardcoded)
  // eligible to render as tracked, whether or not it has a live feed.
  const byCountry = useMemo(() => {
    const map = {}
    for (const ex of exchanges) {
      if (!ex.country) continue
      if (!map[ex.country]) map[ex.country] = []
      map[ex.country].push(ex)
    }
    return map
  }, [exchanges])

  const geoNameFor = (country) => COUNTRY_NAME_OVERRIDES[country] || country
  // Reverse index: world-atlas geometry name -> our exchange list, so the
  // map render loop is a single lookup per country instead of a scan.
  const byGeoName = useMemo(() => {
    const map = {}
    for (const [country, list] of Object.entries(byCountry)) {
      map[geoNameFor(country)] = { country, list }
    }
    return map
  }, [byCountry])

  // Dynamic counters — computed from whatever the backend actually
  // returned this refresh, never hardcoded. "With data" only counts
  // exchanges where a real provider answered (dataAvailable === true);
  // everything else (no live source at all, or a provider that came back
  // empty) counts as "without".
  const stats = useMemo(() => {
    const total = exchanges.length
    const withData = exchanges.filter((e) => e.dataAvailable === true).length
    return {
      total,
      countries: Object.keys(byCountry).length,
      withData,
      withoutData: total - withData,
    }
  }, [exchanges, byCountry])

  // Search matches by country name or exchange name — city isn't part of
  // the current exchange schema (see note in ExchangeListPanel), so it's
  // intentionally not searched here rather than pretending to support it.
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const matches = []
    for (const [country, list] of Object.entries(byCountry)) {
      const countryHit = country.toLowerCase().includes(q)
      const exchangeHits = list.filter((ex) => ex.name.toLowerCase().includes(q))
      if (countryHit || exchangeHits.length > 0) {
        matches.push({ country, list, highlighted: countryHit ? list : exchangeHits })
      }
    }
    return matches.sort((a, b) => a.country.localeCompare(b.country))
  }, [query, byCountry])

  const giftExchanges = (byCountry.India || []).filter((e) => e.id === 'nse-india' || e.id === 'bse-india')

  const showTracked = (country, list) => (event) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ country, list, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const showUntracked = (label) => (event) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ country: null, label, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const moveTooltip = (event) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover((prev) => (prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : prev))
  }

  const hideTooltip = () => setHover(null)
  const openDetail = (country, list) => () => setSelected({ country, list })

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700 }}>Global Markets Map</h2>
            <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginTop: 2 }}>
              {stats.total > 0
                ? 'Hover a highlighted country for a preview, click for full detail'
                : loading
                  ? 'Loading exchange list...'
                  : 'Exchange service not reachable'}
            </p>
          </div>
          <div style={{ position: 'relative', width: 220, maxWidth: '100%' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--lp-text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 12, padding: '8px 10px 8px 32px' }}
              placeholder="Search country or exchange"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 280, maxHeight: 260, overflowY: 'auto',
                  background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 12,
                  boxShadow: '0 12px 28px rgba(0,0,0,0.25)', zIndex: 20,
                }}
              >
                {searchResults.slice(0, 12).map((r) => (
                  <button
                    key={r.country}
                    onClick={() => {
                      setSelected({ country: r.country, list: r.list })
                      setQuery('')
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 12,
                      background: 'transparent', border: 'none', borderBottom: '1px solid var(--lp-border)', color: 'var(--lp-text)', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{r.country}</span>
                    <span style={{ color: 'var(--lp-text-muted)' }}> — {r.list.length} exchange{r.list.length === 1 ? '' : 's'}</span>
                  </button>
                ))}
              </div>
            )}
            {query && searchResults.length === 0 && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 280, padding: '10px 14px', fontSize: 12,
                  background: 'var(--lp-bg-2)', border: '1px solid var(--lp-border)', borderRadius: 12, color: 'var(--lp-text-muted)', zIndex: 20,
                }}
              >
                No matching country or exchange.
              </div>
            )}
          </div>
        </div>

        <MapLegend stats={stats} />
      </div>

      <div className="world-map-wrap" ref={wrapRef}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 155 }}
          width={980}
          height={490}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const match = byGeoName[geo.properties.name]
                const tracked = Boolean(match)
                // Distinguishes "this country has an exchange we could
                // theoretically pull live data for" from "we only know it
                // has exchanges, no live feed for any of them" — a paler
                // fill for the latter so the map itself hints at coverage
                // depth, not just presence.
                const hasLiveSource = tracked && match.list.some((e) => e.marketDataSupported)
                const isActive = tracked
                  ? hover?.country === match.country
                  : hover?.label === geo.properties.name
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={tracked ? showTracked(match.country, match.list) : showUntracked(geo.properties.name)}
                    onMouseMove={moveTooltip}
                    onMouseLeave={hideTooltip}
                    onClick={tracked ? openDetail(match.country, match.list) : undefined}
                    style={{
                      fill: isActive
                        ? 'var(--lp-accent-2)'
                        : tracked
                          ? hasLiveSource
                            ? 'var(--lp-accent-soft, rgba(18,58,92,0.22))'
                            : 'var(--lp-accent-soft, rgba(18,58,92,0.10))'
                          : 'var(--lp-surface)',
                      stroke: 'var(--lp-border)',
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: tracked ? 'pointer' : 'default',
                      transition: 'fill 0.15s ease',
                    }}
                  />
                )
              })
            }
          </Geographies>

          {giftExchanges.length > 0 && (
            <Marker
              coordinates={GIFT_CITY.coordinates}
              onMouseEnter={showTracked(GIFT_CITY.label, giftExchanges)}
              onMouseMove={moveTooltip}
              onMouseLeave={hideTooltip}
              onClick={openDetail(GIFT_CITY.label, giftExchanges)}
            >
              <circle r={4} fill="var(--lp-accent-2)" stroke="var(--lp-bg)" strokeWidth={2} style={{ cursor: 'pointer' }} />
              <circle r={4} fill="none" stroke="var(--lp-accent-2)" strokeOpacity={0.5}>
                <animate attributeName="r" values="4;12" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.5;0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </Marker>
          )}
        </ComposableMap>

        {hover && (
          <div className="world-map-tooltip-float" style={{ left: hover.x, top: hover.y, pointerEvents: 'none' }}>
            {hover.country ? (
              <>
                <p style={{ fontSize: 12, fontWeight: 700 }}>{hover.country}</p>
                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', margin: '2px 0 6px' }}>
                  {hover.list.length} stock exchange{hover.list.length === 1 ? '' : 's'}
                </p>
                {hover.list.slice(0, TOOLTIP_PREVIEW_COUNT).map((ex) => (
                  <ExchangeRow key={ex.id} ex={ex} />
                ))}
                {hover.list.length > TOOLTIP_PREVIEW_COUNT && (
                  <p style={{ fontSize: 10, color: 'var(--lp-accent-2)', marginTop: 4 }}>
                    +{hover.list.length - TOOLTIP_PREVIEW_COUNT} more — click for full list
                  </p>
                )}
                {hover.list.length <= TOOLTIP_PREVIEW_COUNT && (
                  <p style={{ fontSize: 10, color: 'var(--lp-text-muted)', marginTop: 4, opacity: 0.75 }}>Click for details</p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, fontWeight: 700 }}>{hover.label}</p>
                <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginTop: 2 }}>No stock exchange listed</p>
              </>
            )}
          </div>
        )}
      </div>

      <ExchangeListPanel byCountry={byCountry} loading={loading} onSelect={(country, list) => setSelected({ country, list })} />

      {selected && <CountryDetailModal country={selected.country} list={selected.list} onClose={() => setSelected(null)} />}
    </div>
  )
})

export default WorldMarketsMap

// Small legend + the four dynamic global counters, all in one row so the
// map's fill logic (has live data / has exchanges, no live feed / no
// exchange) is explained right where it's used. Deliberately does NOT
// include "positive/negative" dots for the *country* fill — a country
// with several exchanges can have conflicting movements, so the map
// itself never encodes direction; only individual exchange rows do.
function MapLegend({ stats }) {
  const dot = (color) => ({ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', alignItems: 'center', marginTop: 12, paddingBottom: 14, borderBottom: '1px solid var(--lp-border)' }}>
      <LegendItem swatch={<span style={dot('var(--lp-accent-soft, rgba(18,58,92,0.22))')} />} label="Live market data" />
      <LegendItem swatch={<span style={dot('var(--lp-accent-soft, rgba(18,58,92,0.10))')} />} label="Exchange(s), no live feed" />
      <LegendItem swatch={<span style={{ ...dot('var(--lp-surface)'), border: '1px solid var(--lp-border)' }} />} label="No exchange listed" />
      <LegendItem swatch={<TrendingUp size={11} color="#16a34a" />} label="Positive" />
      <LegendItem swatch={<TrendingDown size={11} color="#dc2626" />} label="Negative" />

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <Stat label="Global Exchanges" value={stats.total} />
        <Stat label="Countries / Territories" value={stats.countries} />
        <Stat label="With Market Data" value={stats.withData} />
        <Stat label="Without Market Data" value={stats.withoutData} />
      </div>
    </div>
  )
}

function LegendItem({ swatch, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--lp-text-muted)' }}>
      {swatch}
      {label}
    </span>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
      <p style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>{label}</p>
    </div>
  )
}

// One exchange row shared by the hover tooltip and the "All tracked
// exchanges" panel — three distinct states per the backend contract: no
// live source at all, a real provider that came back empty, or a real
// live value.
function ExchangeRow({ ex }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>{ex.name}</span>
      {!ex.marketDataSupported ? (
        <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>No live data source</span>
      ) : ex.dataAvailable === false ? (
        <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>Data not available</span>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{Number(ex.value ?? 0).toFixed(2)}</span>
          <span className={Number(ex.changePercent) >= 0 ? 'badge-profit' : 'badge-loss'} style={{ padding: '2px 6px', fontSize: 10 }}>
            {Number(ex.changePercent) >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {formatPercent(ex.changePercent)}
          </span>
        </span>
      )}
    </div>
  )
}

// Full detail panel for one country/territory, opened by clicking the map
// or a search result / list-panel row. Shows every exchange for that
// country with its complete quote (index name, value, change, delayed
// flag, data source) where available — never just the map's truncated
// preview.
function CountryDetailModal({ country, list, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{country}</h2>
            <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginTop: 2 }}>
              {list.length} stock exchange{list.length === 1 ? '' : 's'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8, borderRadius: 999 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {list.map((ex) => (
            <div key={ex.id} style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--lp-surface)', border: '1px solid var(--lp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{ex.name}</p>
                {ex.exchangeType && (
                  <span style={{ fontSize: 10, color: 'var(--lp-text-muted)', border: '1px solid var(--lp-border)', borderRadius: 999, padding: '2px 8px' }}>
                    {ex.exchangeType.replace('_', ' ')}
                  </span>
                )}
              </div>

              {!ex.marketDataSupported ? (
                <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginTop: 6 }}>Data not available</p>
              ) : ex.dataAvailable === false ? (
                <p style={{ fontSize: 12, color: 'var(--lp-text-muted)', marginTop: 6 }}>Data not available</p>
              ) : (
                <div style={{ marginTop: 8 }}>
                  {ex.indexName && <p style={{ fontSize: 11, color: 'var(--lp-text-muted)', marginBottom: 3 }}>{ex.indexName}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{Number(ex.value ?? 0).toFixed(2)}</span>
                    <span className={Number(ex.changePercent) >= 0 ? 'badge-profit' : 'badge-loss'}>
                      {Number(ex.changePercent) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {formatPercent(ex.changePercent)}
                    </span>
                    {ex.delayed ? (
                      <span style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>DELAYED</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#16a34a' }}>LIVE</span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--lp-text-muted)', marginTop: 6, opacity: 0.8 }}>
                    {ex.dataSource ? `Source: ${ex.dataSource}` : null}
                    {ex.dataSource && ex.lastUpdated ? ' · ' : null}
                    {ex.lastUpdated ? `Updated ${new Date(ex.lastUpdated).toLocaleTimeString()}` : null}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Safety-net list beneath the map: every country from the master exchange
// list, regardless of whether its polygon was successfully matched above.
// This guarantees the spec's "every exchange, every country" promise holds
// even where COUNTRY_NAME_OVERRIDES is incomplete or a territory has no
// distinct 50m polygon. Rows are clickable and open the same detail modal
// as the map itself.
//
// Note: the master exchange schema (exchanges.json / ExchangeMasterEntry)
// currently tracks id/name/country/countryCode/region/exchangeType/
// marketDataSupported/trackingKey/indexName/regionalGroup — it does not
// yet carry city or lat/long per exchange, so this panel (and the search
// box above) match on country and exchange name only. Adding verified
// city/coordinate data for all ~220 exchanges is a separate, larger data
// task rather than something to fill in with a guess here.
function ExchangeListPanel({ byCountry, loading, onSelect }) {
  const [open, setOpen] = useState(false)
  const countries = Object.keys(byCountry).sort()

  return (
    <div style={{ borderTop: '1px solid var(--lp-border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
        style={{ width: '100%', justifyContent: 'space-between', display: 'flex', padding: '10px 24px', fontSize: 12, borderRadius: 0 }}
      >
        <span>All tracked exchanges ({countries.length} countries)</span>
        <span>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '0 24px 16px' }}>
          {loading && countries.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>Loading...</p>
          ) : countries.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>Exchange service not reachable.</p>
          ) : (
            countries.map((country) => (
              <div key={country} style={{ marginBottom: 10 }}>
                <button
                  onClick={() => onSelect(country, byCountry[country])}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--lp-text)' }}>{country} →</p>
                </button>
                {byCountry[country].map((ex) => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--lp-text-muted)', padding: '2px 0' }}>
                    <span>{ex.name}</span>
                    {!ex.marketDataSupported ? (
                      <span>No live data source</span>
                    ) : ex.dataAvailable === false ? (
                      <span>Data not available</span>
                    ) : (
                      <span style={{ color: Number(ex.changePercent) >= 0 ? '#16a34a' : '#dc2626' }}>
                        {Number(ex.value ?? 0).toFixed(2)} ({formatPercent(ex.changePercent)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
