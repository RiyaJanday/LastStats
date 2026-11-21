// Format a number as a short Indian currency string
// Example: 1500000 -> "₹15.00L"
export function formatCompact(amount: number): string {
  if (!amount) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
  if (amount >= 100000)   return `₹${(amount / 100000).toFixed(2)}L`
  if (amount >= 1000)     return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

// Format percentage with a + or - sign
// Example: 12.5 -> "+12.50%"
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${(value ?? 0).toFixed(2)}%`
}
