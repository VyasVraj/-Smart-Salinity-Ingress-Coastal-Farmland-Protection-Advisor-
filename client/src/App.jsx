import { useState, useEffect, useCallback, Component, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Activity, Cpu, Bell, Radio,
  Waves, AlertTriangle, RefreshCw, GitBranch, FlaskConical,
  Map, TrendingUp, Droplets, Sun, Moon, ChevronLeft, ChevronRight,
  Search, Command, X, Menu,
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
import LandingPage from './pages/LandingPage.jsx'

// ── Theme hook ────────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setThemeState] = useState(() =>
    document.documentElement.getAttribute('data-theme') || 'dark'
  )
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

// ── Theme toggle ──────────────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle, compact }) {
  const isDark = theme === 'dark'
  if (compact) {
    return (
      <button className="theme-toggle" onClick={onToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ padding: '0.3rem 0.5rem', gap: '0.3rem' }}>
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </button>
    )
  }
  return (
    <button className="theme-toggle" onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {isDark ? <Moon size={12} style={{ flexShrink: 0 }} /> : <Sun size={12} style={{ flexShrink: 0 }} />}
      <span className="theme-toggle__track"><span className="theme-toggle__thumb" /></span>
      <span style={{ fontSize: '0.6875rem', letterSpacing: '0.03em' }}>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

// ── Error boundary ────────────────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(e, i) { console.error('[ErrorBoundary]', e, i) }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2rem', textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--risk-high)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{this.state.error?.message}</p>
          <button className="btn-primary" style={{ margin: '0 auto' }}
            onClick={() => this.setState({ hasError: false, error: null })}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ── Navigation config ─────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { path: '/farms',      label: 'My Farms',        icon: MapPin },
      { path: '/monitoring', label: 'Live Monitoring',  icon: Activity },
      { path: '/alerts',     label: 'Alert Center',     icon: Bell },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { path: '/decision-trace', label: 'AI Decision Trace',  icon: GitBranch },
      { path: '/forecast',       label: 'Salinity Forecast',  icon: TrendingUp },
      { path: '/what-if',        label: 'What-If Simulator',  icon: FlaskConical },
      { path: '/advisory',       label: 'AI Farm Advisor',    icon: Cpu },
    ],
  },
  {
    title: 'Regional Intel',
    items: [
      { path: '/heatmap',   label: 'Risk Heatmap',     icon: Map },
      { path: '/simulator', label: 'Sensor Simulator', icon: Radio },
    ],
  },
]

// ── AI Command Bar ────────────────────────────────────────────────────────────

const COMMANDS = [
  { label: 'Which farm needs immediate attention?',        icon: '🚨' },
  { label: 'Show all critical farms',                      icon: '📊' },
  { label: 'What should I do first?',                      icon: '⚡' },
  { label: 'Predict my farm\'s salinity trajectory',       icon: '📈' },
  { label: 'Simulate irrigation improvement',              icon: '💧' },
  { label: 'Explain AI decision for my farm',              icon: '🤖' },
]

function CommandBar({ onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCommand = (label) => {
    onClose()
    navigate('/advisory', { state: { question: label } })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    onClose()
    navigate('/advisory', { state: { question: query.trim() } })
  }

  const filtered = COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="command-bar-overlay" onClick={onClose}>
      <div className="command-bar-modal" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9375rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              placeholder="Ask Salinity Shield AI anything…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="button" onClick={onClose}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
              ESC
            </button>
          </div>
        </form>

        {/* Suggestions */}
        <div style={{ padding: '0.75rem' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', padding: '0 0.375rem' }}>
            Suggested
          </div>
          {filtered.map((cmd, i) => (
            <button key={i}
              onClick={() => handleCommand(cmd.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                width: '100%', textAlign: 'left', padding: '0.625rem 0.75rem',
                background: 'transparent', border: 'none', borderRadius: 8,
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '0.9375rem', flexShrink: 0 }}>{cmd.icon}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{cmd.label}</span>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Press Enter to ask the AI
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Powered by</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>IBM Granite AI</span>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ theme, onToggleTheme, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(2,11,18,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={onCloseMobile}
        />
      )}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '1rem 0.75rem' : '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(69,212,131,0.1)', border: '1px solid rgba(69,212,131,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Waves size={17} style={{ color: '#20D9C5' }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Salinity Shield AI
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Coastal Farmland Advisor
              </div>
              <div style={{ fontSize: '0.5rem', color: 'rgba(69,212,131,0.5)', marginTop: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gujarat Hackathon 2026</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: collapsed ? '0.75rem 0.5rem' : '1rem 0.75rem', overflowY: 'auto' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom: '1.25rem' }}>
              {!collapsed && (
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.5rem', marginBottom: '0.375rem', opacity: 0.7 }}>
                  {section.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {section.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={onCloseMobile}
                    className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                    title={collapsed ? item.label : undefined}
                    style={{ justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? '0.6rem' : '0.5rem 0.75rem' }}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }} />
                        {!collapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: collapsed ? '0.75rem 0.5rem' : '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* AI Status */}
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.625rem', background: 'rgba(69,212,131,0.06)', border: '1px solid rgba(69,212,131,0.12)', borderRadius: 8 }}>
              <span className="ai-dot" />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-green-primary)', lineHeight: 1.2 }}>AI SYSTEM ONLINE</div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: 1 }}>IBM GRANITE</div>
              </div>
            </div>
          )}

          {/* Theme + collapse */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: '0.5rem' }}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} compact={collapsed} />
            {!collapsed && (
              <button onClick={onToggleCollapse} className="btn-ghost"
                style={{ padding: '0.3rem 0.5rem', gap: '0.25rem', fontSize: '0.6875rem' }}
                title="Collapse sidebar">
                <ChevronLeft size={12} />
              </button>
            )}
          </div>

          {collapsed && (
            <button onClick={onToggleCollapse} className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', padding: '0.4rem', marginTop: '0.375rem' }}
              title="Expand sidebar">
              <ChevronRight size={14} />
            </button>
          )}

          {!collapsed && (
            <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: '0.75rem', opacity: 0.5, textAlign: 'center' }}>
              Gujarat Hackathon 2026
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Global command bar trigger ────────────────────────────────────────────────

function CommandBarTrigger({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '0.4rem 0.875rem',
        fontSize: '0.8125rem', color: 'var(--text-muted)',
        cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
        minWidth: 200,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(69,212,131,0.4)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      <Command size={13} />
      <span>Ask Salinity Shield AI…</span>
      <kbd style={{ marginLeft: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, padding: '0 4px', fontSize: '0.625rem', letterSpacing: '0.02em' }}>⌘K</kbd>
    </button>
  )
}

// ── Top bar ────────────────────────────────────────────────────────────────�}

function TopBar({ onOpenCommand, onToggleMobile }) {
  return (
    <div className="top-bar" style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.625rem 1.25rem', borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleMobile}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.375rem', cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* Search / command trigger */}
      <CommandBarTrigger onOpen={onOpenCommand} />

      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.6875rem', color: '#45D483' }}>
        <span className="live-dot" />
        <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>LIVE</span>
      </div>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* /landing = standalone page, no sidebar */}
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/*"       element={<AppShell />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

// ── App shell (sidebar + topbar + all dashboard routes) ───────────────────────

function AppShell() {
  const { theme, toggle } = useTheme()
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen]       = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(v => !v)
      }
      if (e.key === 'Escape') setCmdOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Agricultural background */}
      <div className="agri-scene" aria-hidden="true">
        <div className="agri-scene__img" />
        <div className="agri-scene__tint" />
        <div className="agri-scene__radial" />
        <div className="agri-scene__grad" />
      </div>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          theme={theme}
          onToggleTheme={toggle}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar onOpenCommand={() => setCmdOpen(true)} onToggleMobile={() => setMobileOpen(v => !v)} />
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

        {cmdOpen && <CommandBar onClose={() => setCmdOpen(false)} />}
      </div>
    </>
  )
}
