'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, CalendarDays,
  Globe, Activity, BarChart3,
} from 'lucide-react'

// All the pages in our sidebar menu
const NAV = [
  { path: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/portfolio', label: 'Portfolio',   icon: Briefcase },
  { path: '/sip',       label: 'SIP Plans',   icon: CalendarDays },
  { path: '/market',    label: 'Markets',     icon: Globe },
  { path: '/algo',      label: 'Algo Engine', icon: Activity },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', background: 'white',
      borderRight: '1px solid #e5e7eb', display: 'flex',
      flexDirection: 'column', position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '34px', height: '34px', background: '#6b8c3a',
          borderRadius: '10px', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <BarChart3 size={17} color="white" />
        </div>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#1a2810' }}>
          LastStats
        </p>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = pathname.startsWith(path)
          return (
            <Link
              key={path}
              href={path}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '10px', marginBottom: '2px',
                fontSize: '13px', textDecoration: 'none',
                background: active ? '#6b8c3a' : 'transparent',
                color: active ? 'white' : '#6b7280',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
