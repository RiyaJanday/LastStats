import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/auth'

export default function ProtectedRoute({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />
}
