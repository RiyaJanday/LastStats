import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  Bot,
  Briefcase,
  CalendarDays,
  Globe,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from 'lucide-react'
import logoDataUri from '../assets/logo.png'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/sip', label: 'SIP Plans', icon: CalendarDays },
  { path: '/market', label: 'Markets', icon: Globe },
  { path: '/algo', label: 'Algo Engine', icon: Activity },
  { path: '/ai', label: 'AI Assistant', icon: Bot },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div style={{
          padding: '18px 16px',
          borderBottom: '1px solid var(--lp-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <img src={logoDataUri} alt="LastStats" style={{ height: 34, width: 'auto' }} />
          <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path)

            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  marginBottom: '3px',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  textDecoration: 'none',
                  background: active ? 'linear-gradient(120deg, var(--lp-accent), var(--lp-accent-2))' : 'transparent',
                  color: active ? '#0a0912' : 'var(--lp-text-muted)',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--lp-border)',
          fontSize: '11px',
          color: 'var(--lp-text-muted)',
          textAlign: 'center',
        }}>
          Phase 1 - Local Dev
        </div>
      </aside>
    </>
  )
}
