export function formatCompact(amount) {
  if (!amount && amount !== 0) return 'Rs 0'
  const value = Number(amount) || 0
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}K`
  return `Rs ${value.toFixed(0)}`
}

export function formatPercent(value) {
  const v = Number(value) || 0
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Formats a Unix epoch-seconds timestamp (e.g. Yahoo Finance's
// providerPublishTime) as a short relative time like '12m ago' / '3h ago'.
export function formatTimeAgo(epochSeconds) {
  if (!epochSeconds) return ''
  const diffMs = Date.now() - epochSeconds * 1000
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Same relative-time formatting as formatTimeAgo, but for an ISO-8601
// timestamp string (e.g. "2026-09-04T10:15:30Z") — what GET /api/news
// returns for publishedAt (Jackson's default Instant serialization),
// as opposed to the epoch-seconds format the old Yahoo news endpoint used.
export function formatTimeAgoIso(isoString) {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
