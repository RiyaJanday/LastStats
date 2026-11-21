import axios from 'axios'
import { clearSession, getAccessToken, refreshSession } from './auth'

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

// A 401 triggers one shared refresh attempt; only an expired/invalid refresh
// token clears the session and sends the user back to login.
function redirectToLogin() {
  clearSession()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

function handleAuthError(client) {
  return async (error) => {
    if (error?.response?.status !== 401) return Promise.reject(error)

    const request = error.config
    if (!request || request._authRetry) {
      redirectToLogin()
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
      return client.request(request)
    } catch (refreshError) {
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  }
}

api.interceptors.response.use((response) => response, handleAuthError(api))
sipApi.interceptors.response.use((response) => response, handleAuthError(sipApi))
