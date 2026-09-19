const THEME_KEY = 'laststats_landing_theme' // 'light' | 'dark' | 'custom'
const ACCENT_KEY = 'laststats_landing_accent' // index into accentSwatches

export const accentSwatches = [
  { name: 'Violet', accent: '#a78bfa', accent2: '#67e8f9' },
  { name: 'Amber', accent: '#fbbf24', accent2: '#f472b6' },
  { name: 'Sky', accent: '#60a5fa', accent2: '#c084fc' },
  { name: 'Magenta', accent: '#f472b6', accent2: '#fb923c' },
  { name: 'Teal', accent: '#2dd4bf', accent2: '#818cf8' },
]

export function getLandingTheme() {
  // Peach & Prussian is the app's default look — warm peach surface,
  // deep Prussian-blue ink — with dark and custom-accent as opt-ins.
  return localStorage.getItem(THEME_KEY) || 'light'
}

export function setLandingTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
}

export function getLandingAccentIndex() {
  return Number(localStorage.getItem(ACCENT_KEY) || 0)
}

export function setLandingAccentIndex(index) {
  localStorage.setItem(ACCENT_KEY, String(index))
}
