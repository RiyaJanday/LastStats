import axios from 'axios'

// This single axios instance is used for PORTFOLIO calls (port 8082)
// NOTE: No API Gateway in this simplified runnable version —
// frontend calls each service directly on its own port.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082',
  headers: { 'Content-Type': 'application/json' },
})

// Before every request, attach a demo user ID header
// (In a full production build, this would attach the JWT token instead)
api.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = '00000000-0000-0000-0000-000000000001'
  return config
})

export default api

// Separate instance for SIP calls (sip-service runs on port 8083)
export const sipApi = axios.create({
  baseURL: 'http://localhost:8083',
  headers: { 'Content-Type': 'application/json' },
})
