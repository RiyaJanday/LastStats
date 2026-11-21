import axios from 'axios'
import { accentSwatches } from './landingTheme'

const ACCESS_TOKEN_KEY = 'laststats_access_token'
const REFRESH_TOKEN_KEY = 'laststats_refresh_token'
const SESSION_KEY = 'laststats_session'
const THEME_KEY = 'laststats_theme'
const THEME_ACCENT_KEY = 'laststats_theme_accent'
let refreshInFlight = null

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

export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = requestRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function requestRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available.')

  const { data } = await authApi.post('/api/auth/refresh', null, {
    headers: { 'X-Refresh-Token': refreshToken },
  })
  const authResponse = data?.data
  if (!authResponse?.accessToken || !authResponse?.refreshToken) {
    throw new Error('The refresh response was incomplete.')
  }
  return storeAuth(authResponse)
}

authApi.interceptors.response.use((response) => response, async (error) => {
  const request = error?.config
  const headers = request?.headers
  const hasAccessToken = Boolean(headers?.get?.('Authorization') || headers?.Authorization || headers?.authorization)
  if (error?.response?.status !== 401 || !request || !hasAccessToken || request._authRetry) {
    return Promise.reject(error)
  }

  request._authRetry = true
  try {
    await refreshSession()
    request.headers = request.headers || {}
    if (typeof request.headers.set === 'function') {
      request.headers.set('Authorization', `Bearer ${getAccessToken()}`)
    } else {
      request.headers.Authorization = `Bearer ${getAccessToken()}`
    }
    return authApi.request(request)
  } catch (refreshError) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(refreshError)
  }
})

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
    throw new Error(errorMessage(error, 'Could not create account.'), { cause: error })
  }
}

export async function loginUser({ email, password }) {
  try {
    const { data } = await authApi.post('/api/auth/login', { email, password })
    return storeAuth(data.data)
  } catch (error) {
    throw new Error(errorMessage(error, 'Invalid email or password.'), { cause: error })
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
    throw new Error(errorMessage(error, 'Could not update profile.'), { cause: error })
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
    throw new Error(errorMessage(error, 'Current password is incorrect.'), { cause: error })
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
