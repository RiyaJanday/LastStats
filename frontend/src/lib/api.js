import axios from 'axios'
import { clearSession, getAccessToken } from './auth'

// One axios instance PER backend service — since there's no
// API Gateway in this simplified version, each service has its own port

// Auth service (port 8081)
export const authServiceApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
})

// Portfolio service (port 8082)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8082',
  headers: { 'Content-Type': 'application/json' },
})

// SIP service (port 8083)
export const sipApi = axios.create({
  baseURL: import.meta.env.VITE_SIP_URL || 'http://localhost:8083',
  headers: { 'Content-Type': 'application/json' },
})

// Market data service (port 8084) — public, no auth required
export const marketApi = axios.create({
  baseURL: import.meta.env.VITE_MARKET_URL || 'http://localhost:8084',
  headers: { 'Content-Type': 'application/json' },
})

// Python analytics service (port 8090) — public, no auth required
export const analyticsApi = axios.create({
  baseURL: import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8090',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the real JWT access token to every request that needs auth
// (portfolio-service and sip-service both require Authentication)
function attachAuthToken(config) {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

api.interceptors.request.use(attachAuthToken)
sipApi.interceptors.request.use(attachAuthToken)

// If the access token is missing/expired, the backend returns 401 —
// clear the stale session and bounce to login rather than failing silently.
function handleAuthError(error) {
  if (error?.response?.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
  return Promise.reject(error)
}

api.interceptors.response.use((response) => response, handleAuthError)
sipApi.interceptors.response.use((response) => response, handleAuthError)
