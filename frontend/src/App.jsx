import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import { getTheme, setTheme } from './lib/auth'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import PortfolioPage from './pages/PortfolioPage'
import SipPage from './pages/SipPage'
import MarketPage from './pages/MarketPage'
import AlgoPage from './pages/AlgoPage'
import AiPage from './pages/AiPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  useEffect(() => {
    setTheme(getTheme())
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
        <Route path="/sip" element={<ProtectedRoute><SipPage /></ProtectedRoute>} />
        <Route path="/market" element={<ProtectedRoute><MarketPage /></ProtectedRoute>} />
        <Route path="/algo" element={<ProtectedRoute><AlgoPage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#1a2810',
            border: '1px solid #dde8b4',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#6b8c3a', secondary: 'white' },
          },
        }}
      />
    </>
  )
}
