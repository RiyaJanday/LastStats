import axios from 'axios'
import { accentSwatches } from './landingTheme'

const ACCESS_TOKEN_KEY = 'laststats_access_token'
const REFRESH_TOKEN_KEY = 'laststats_refresh_token'
const SESSION_KEY = 'laststats_session'
const THEME_KEY = 'laststats_theme'
const THEME_ACCENT_KEY = 'laststats_theme_accent'

export { accentSwatches }

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
})

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light'
}

export function getThemeAccentIndex() {
  return Number(localStorage.getItem(THEME_ACCENT_KEY) || 0)
}

export function setThemeAccentIndex(index) {
  localStorage.setItem(THEME_ACCENT_KEY, String(index))
  if (getTheme() === 'custom') applyThemeAccent(index)
}

function applyThemeAccent(index) {
  const swatch = accentSwatches[index] || accentSwatches[0]
  document.body.style.setProperty('--lp-accent', swatch.accent)
  document.body.style.setProperty('--lp-accent-2', swatch.accent2)
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  document.body.dataset.theme = theme
  if (theme === 'custom') {
    applyThemeAccent(getThemeAccentIndex())
  } else {
    document.body.style.removeProperty('--lp-accent')
    document.body.style.removeProperty('--lp-accent-2')
  }
}

export async function registerUser({ name, email, password }) {
  try {
    const { data } = await authApi.post('/api/auth/register', {
      email,
      password,
      fullName: name.trim(),
    })
    return storeAuth(data.data)
  } catch (error) {
    throw new Error(errorMessage(error, 'Could not create account.'))
  }
}

export async function loginUser({ email, password }) {
  try {
    const { data } = await authApi.post('/api/auth/login', { email, password })
    return storeAuth(data.data)
  } catch (error) {
    throw new Error(errorMessage(error, 'Invalid email or password.'))
  }
}

export async function updateUserProfile(profile) {
  try {
    const { data } = await authApi.put(
      '/api/auth/profile',
      {
        fullName: profile.name,
        phone: profile.phone,
        riskProfile: profile.riskProfile,
      },
      { headers: authHeader() }
    )
    return storeAuth(data.data)
  } catch (error) {
    throw new Error(errorMessage(error, 'Could not update profile.'))
  }
}

export async function resetUserPassword(currentPassword, newPassword) {
  try {
    await authApi.post(
      '/api/auth/reset-password',
      { currentPassword, newPassword },
      { headers: authHeader() }
    )
  } catch (error) {
    throw new Error(errorMessage(error, 'Current password is incorrect.'))
  }
}

export async function deleteCurrentAccount() {
  try {
    await authApi.delete('/api/auth/account', { headers: authHeader() })
  } finally {
    clearSession()
  }
}

function storeAuth(authResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken)
  const sessionUser = mapUser(authResponse.user)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  return sessionUser
}

function mapUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    riskProfile: user.riskProfile || 'Moderate',
  }
}

function authHeader() {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function errorMessage(error, fallback) {
  return error?.response?.data?.message || fallback
}
