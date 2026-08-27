import { useState, Component } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MapPin, Activity, Cpu, Bell, Radio, MessageSquare, Waves, AlertTriangle, RefreshCw, GitBranch, FlaskConical, Map, TrendingUp } from 'lucide-react'
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-8 max-w-lg w-full text-center space-y-4">
            <AlertTriangle size={40} className="text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-gray-400">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <pre className="text-xs text-gray-600 bg-gray-800 rounded-lg p-3 text-left overflow-auto max-h-40">{this.state.error?.stack}</pre>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="inline-flex items-center gap-2 btn-primary">
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
    title: 'AI Intelligence',
    items: [
      { path: '/decision-trace', label: 'AI Decision Trace',  icon: GitBranch },
      { path: '/forecast',       label: 'Forecast',           icon: TrendingUp },
      { path: '/what-if',        label: 'What-If Simulator',  icon: FlaskConical },
      { path: '/advisory',       label: 'AI Advisory',        icon: Cpu },
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

function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <Waves size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="font-bold text-white text-sm leading-tight">Salinity Shield AI</h1>
          <p className="text-xs text-gray-500">Coastal Farmland Advisor</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-1">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">Gujarat Hackathon 2026</p>
        <p className="text-xs text-gray-700 mt-0.5">Powered by IBM Granite AI</p>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="flex min-h-screen bg-gray-950">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <Routes>
                <Route path="/"                element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                <Route path="/farms"           element={<ErrorBoundary><FarmsList /></ErrorBoundary>} />
                <Route path="/farms/:id"       element={<ErrorBoundary><FarmDetail /></ErrorBoundary>} />
                <Route path="/monitoring"      element={<ErrorBoundary><LiveMonitoring /></ErrorBoundary>} />
                <Route path="/advisory"        element={<ErrorBoundary><AIAdvisoryPage /></ErrorBoundary>} />
                <Route path="/alerts"          element={<ErrorBoundary><AlertsPage /></ErrorBoundary>} />
                <Route path="/simulator"       element={<ErrorBoundary><SimulatorPage /></ErrorBoundary>} />
                <Route path="/decision-trace"  element={<ErrorBoundary><DecisionTracePage /></ErrorBoundary>} />
                <Route path="/what-if"         element={<ErrorBoundary><WhatIfPage /></ErrorBoundary>} />
                <Route path="/heatmap"         element={<ErrorBoundary><HeatmapPage /></ErrorBoundary>} />
                <Route path="/forecast"        element={<ErrorBoundary><ForecastPage /></ErrorBoundary>} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
