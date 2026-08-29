import { useState, useEffect, useCallback, Component } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Activity, Cpu, Bell, Radio,
  Waves, AlertTriangle, RefreshCw, GitBranch, FlaskConical,
  Map, TrendingUp, Droplets, Sun, Moon
} from 'lucide-react'
import Dashboard from './pages/Dashboard.jsx'
import FarmsList from './pages/FarmsList.jsx'
import FarmDetail from './pages/FarmDetail.jsx'
import LiveMonitoring from './pages/LiveMonitoring.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import SimulatorPage from './pages/SimulatorPage.jsx'
import AIAdvisoryPage from './pages/AIAdvisoryPage.jsx'
import DecisionTracePage from './pages/DecisionTracePage.jsx'
import WhatIfPage from './pages/WhatIfPage.jsx'
import HeatmapPage from './pages/HeatmapPage.jsx'
import ForecastPage from './pages/ForecastPage.jsx'

// ── Theme hook ────────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setThemeState] = useState(() => {
    // Read the value already applied by the flash-prevention script in index.html
    return document.documentElement.getAttribute('data-theme') || 'dark'
  })

  const setTheme = useCallback((next) => {
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('salinity-shield-theme', next) } catch {}
    setThemeState(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, toggle }
}

// ── Theme toggle button ───────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark
        ? <Moon size={12} style={{ flexShrink: 0 }} />
        : <Sun  size={12} style={{ flexShrink: 0 }} />
      }
      <span className="theme-toggle__track">
        <span className="theme-toggle__thumb" />
      </span>
      {isDark
        ? <span style={{ fontSize: '0.6875rem', letterSpacing: '0.03em' }}>Dark</span>
        : <span style={{ fontSize: '0.6875rem', letterSpacing: '0.03em' }}>Light</span>
      }
    </button>
  )
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={36} style={{ color: 'var(--accent-red)', margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{this.state.error?.message}</p>
            <button
              className="btn-primary"
              style={{ gap: '0.5rem', margin: '0 auto' }}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const NAV_SECTIONS = [
  {
    title: 'Monitoring',
    items: [
      { path: '/',           label: 'Dashboard',       icon: LayoutDashboard, exact: true },
      { path: '/farms',      label: 'My Farms',         icon: MapPin },
      { path: '/monitoring', label: 'Live Monitoring',  icon: Activity },
      { path: '/alerts',     label: 'Alerts',           icon: Bell },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/decision-trace', label: 'AI Decision Trace',  icon: GitBranch },
      { path: '/forecast',       label: 'Salinity Forecast',  icon: TrendingUp },
      { path: '/what-if',        label: 'What-If Simulator',  icon: FlaskConical },
      { path: '/advisory',       label: 'AI Farm Advisor',    icon: Cpu },
    ],
  },
  {
    title: 'Regional',
    items: [
      { path: '/heatmap',   label: 'Risk Heatmap',     icon: Map },
      { path: '/simulator', label: 'Sensor Simulator', icon: Radio },
    ],
  },
]

function Sidebar({ theme, onToggleTheme }) {
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 9,
          background: 'rgba(45,212,191,0.1)',
          border: '1px solid rgba(45,212,191,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Waves size={18} style={{ color: 'var(--accent-seafoam)' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Salinity Shield AI
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Coastal Farmland Advisor
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '0 0.5rem',
              marginBottom: '0.4rem',
            }}>
              {section.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.625rem',
                    borderRadius: 7,
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: 'none',
                    color: isActive ? 'var(--accent-seafoam)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(45,212,191,0.08)' : 'transparent',
                    transition: 'background 0.12s, color 0.12s',
                  })}
                  onMouseEnter={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-primary)' } }}
                  onMouseLeave={e => { if (!e.currentTarget.dataset.active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' } }}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Theme toggle */}
        <div style={{ marginBottom: '0.75rem' }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Droplets size={12} style={{ color: 'var(--accent-seafoam)' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>IBM Granite AI</span>
          <span className="live-dot" style={{ marginLeft: 'auto', width: 6, height: 6 }} />
        </div>
        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', opacity: 0.6 }}>
          Gujarat Hackathon 2026
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
          <Sidebar theme={theme} onToggleTheme={toggle} />
          <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', minWidth: 0 }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/"               element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/farms"          element={<ErrorBoundary><FarmsList /></ErrorBoundary>} />
                <Route path="/farms/:id"      element={<ErrorBoundary><FarmDetail /></ErrorBoundary>} />
                <Route path="/monitoring"     element={<ErrorBoundary><LiveMonitoring /></ErrorBoundary>} />
                <Route path="/advisory"       element={<ErrorBoundary><AIAdvisoryPage /></ErrorBoundary>} />
                <Route path="/alerts"         element={<ErrorBoundary><AlertsPage /></ErrorBoundary>} />
                <Route path="/simulator"      element={<ErrorBoundary><SimulatorPage /></ErrorBoundary>} />
                <Route path="/decision-trace" element={<ErrorBoundary><DecisionTracePage /></ErrorBoundary>} />
                <Route path="/what-if"        element={<ErrorBoundary><WhatIfPage /></ErrorBoundary>} />
                <Route path="/heatmap"        element={<ErrorBoundary><HeatmapPage /></ErrorBoundary>} />
                <Route path="/forecast"       element={<ErrorBoundary><ForecastPage /></ErrorBoundary>} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
