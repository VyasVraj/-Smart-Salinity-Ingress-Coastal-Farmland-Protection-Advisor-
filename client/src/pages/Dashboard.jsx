import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Waves, MapPin, AlertTriangle, Plus, GitBranch, TrendingUp,
  FlaskConical, Map, ChevronRight, Activity, CheckCircle,
  AlertCircle, XCircle, Heart, Cpu, Radio
} from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AddFarmModal } from '../components/AddFarmModal.jsx'
import { RiskBadge, TrendBadge, LiveBadge } from '../components/ui/Badges.jsx'
import { formatTime, formatSensor } from '../lib/utils.js'
import { api } from '../lib/api.js'

// ── Inline helpers ────────────────────────────────────────────────────────────

function riskColor(level) {
  return {
    LOW:      'var(--risk-low)',
    MEDIUM:   'var(--risk-medium)',
    HIGH:     'var(--risk-high)',
    CRITICAL: 'var(--risk-critical)',
  }[level] || 'var(--text-muted)'
}

function riskBg(level) {
  return {
    LOW:      'rgba(63,174,90,0.08)',
    MEDIUM:   'rgba(230,162,60,0.08)',
    HIGH:     'rgba(228,87,86,0.08)',
    CRITICAL: 'rgba(200,62,77,0.1)',
  }[level] || 'rgba(111,137,146,0.06)'
}

// ── GraniteStatusIndicator ────────────────────────────────────────────────────

function GraniteStatusIndicator() {
  const { data } = useQuery({
    queryKey: ['ai-health'],
    queryFn: api.analytics.aiHealth,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  })

  if (!data) return null

  if (data.status === 'connected') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--risk-low)', background: 'rgba(63,174,90,0.1)', border: '1px solid rgba(63,174,90,0.25)', borderRadius: 999, padding: '0.25rem 0.75rem' }}>
        <CheckCircle size={11} /> IBM Granite
      </span>
    )
  }
  if (data.status === 'unavailable') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--risk-high)', background: 'rgba(228,87,86,0.1)', border: '1px solid rgba(228,87,86,0.25)', borderRadius: 999, padding: '0.25rem 0.75rem' }}>
        <XCircle size={11} /> Granite Unavailable
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--risk-medium)', background: 'rgba(230,162,60,0.1)', border: '1px solid rgba(230,162,60,0.25)', borderRadius: 999, padding: '0.25rem 0.75rem' }}>
      <AlertCircle size={11} /> Demo Mode
    </span>
  )
}

// ── FarmCard ──────────────────────────────────────────────────────────────────

function FarmCard({ farm, onClick }) {
  const risk    = farm.riskAssessments?.[0]
  const reading = farm.readings?.[0]
  const alerts  = farm.alerts?.length || 0
  const level   = risk?.riskLevel || 'UNKNOWN'

  return (
    <div
      onClick={onClick}
      className="hover-lift"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${riskBg(level) === 'rgba(111,137,146,0.06)' ? 'var(--border-subtle)' : riskColor(level) + '33'}`,
        borderRadius: 10,
        padding: '1.125rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{farm.farmName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 3, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <MapPin size={10} />
            {farm.farmerName} · {farm.district}
          </div>
        </div>
        <RiskBadge level={level} />
      </div>

      {/* Metrics */}
      {reading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.375rem', marginBottom: '0.75rem' }}>
          {[
            { label: 'Soil EC', value: formatSensor('soilEC',        reading.soilEC),        unit: 'dS/m' },
            { label: 'GW EC',   value: formatSensor('groundwaterEC', reading.groundwaterEC), unit: 'dS/m' },
            { label: 'TDS',     value: formatSensor('tds',           reading.tds),           unit: 'ppm'  },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--bg-elevated)', borderRadius: 7, padding: '0.375rem 0.5rem', textAlign: 'center', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 1 }}>{m.label}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.value} <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {risk && <TrendBadge trend={risk.trend} />}
          {risk && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{risk.riskScore}/100</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {alerts > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--risk-high)' }}>
              <AlertTriangle size={11} /> {alerts}
            </span>
          )}
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
      {reading && (
        <div style={{ marginTop: '0.375rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          Updated {formatTime(reading.timestamp)}
        </div>
      )}
    </div>
  )
}

// ── AgentPipeline ─────────────────────────────────────────────────────────────

const PIPELINE = [
  { label: 'Monitor',    color: '#3A9AB5', desc: 'Sensor readings ingested' },
  { label: 'Detect',     color: 'var(--accent-seafoam)', desc: 'Anomaly detection' },
  { label: 'Assess',     color: 'var(--risk-medium)', desc: 'Risk scoring engine' },
  { label: 'Forecast',   color: '#8B5CF6', desc: 'Trend projection' },
  { label: 'Recommend',  color: 'var(--risk-low)', desc: 'IBM Granite advisory' },
  { label: 'Alert',      color: 'var(--risk-high)', desc: 'Farmer notification' },
]

function AgentPipeline() {
  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div className="section-label" style={{ marginBottom: '0.875rem' }}>AI Agent Pipeline</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
        {PIPELINE.map((stage, i) => (
          <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `2px solid ${stage.color}`,
                background: stage.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.25rem',
                fontSize: '0.625rem', fontWeight: 700, color: stage.color,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stage.label}</div>
              <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginTop: 1 }}>{stage.desc}</div>
            </div>
            {i < PIPELINE.length - 1 && (
              <div style={{ width: 20, height: 1, background: 'var(--border)', margin: '0 0.25rem', marginBottom: 16 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CoastalHealthCard ─────────────────────────────────────────────────────────

function CoastalHealthCard({ farmId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health-summary', farmId],
    queryFn: () => api.analytics.healthSummary(farmId),
    enabled: !!farmId,
    staleTime: 60_000,
    retry: false,
  })

  const healthColors = {
    GOOD:     { text: 'var(--risk-low)',      bg: 'rgba(63,174,90,0.06)',   border: 'rgba(63,174,90,0.2)' },
    WATCH:    { text: 'var(--risk-medium)',   bg: 'rgba(230,162,60,0.06)',  border: 'rgba(230,162,60,0.2)' },
    AT_RISK:  { text: 'var(--risk-high)',     bg: 'rgba(228,87,86,0.06)',   border: 'rgba(228,87,86,0.2)' },
    CRITICAL: { text: 'var(--risk-critical)', bg: 'rgba(200,62,77,0.08)',   border: 'rgba(200,62,77,0.25)' },
  }

  if (isLoading) {
    return (
      <div className="card" style={{ padding: '1.25rem' }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8, width: i === 1 ? '40%' : i === 2 ? '80%' : '60%' }} />)}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card" style={{ padding: '1.25rem', textAlign: 'center', borderStyle: 'dashed' }}>
        <Heart size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No health summary yet — submit a reading to trigger the AI pipeline.</p>
      </div>
    )
  }

  const content = typeof data.content === 'object' ? data.content : (() => { try { return JSON.parse(data.content) } catch { return {} } })()
  const { overallHealth, healthScore, salinityStatus, mainRisk, topActions = [], confidenceNote } = content
  const clr = healthColors[overallHealth] || healthColors.WATCH

  return (
    <div style={{ background: clr.bg, border: `1px solid ${clr.border}`, borderRadius: 10, padding: '1.125rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={15} style={{ color: clr.text }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Coastal Farm Health</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {healthScore != null && (
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: clr.text }}>{healthScore}/100</span>
          )}
          {overallHealth && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: clr.text, background: clr.bg, border: `1px solid ${clr.border}`, borderRadius: 4, padding: '0.125rem 0.5rem' }}>
              {overallHealth}
            </span>
          )}
        </div>
      </div>

      {typeof healthScore === 'number' && (
        <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.75rem' }}>
          <div style={{ height: '100%', background: clr.text, borderRadius: 99, width: `${Math.min(100, healthScore)}%`, transition: 'width 0.5s ease' }} />
        </div>
      )}

      {salinityStatus && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{salinityStatus}</p>}

      {topActions.length > 0 && (
        <div>
          <div className="section-label" style={{ marginBottom: '0.375rem' }}>Top Actions</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {topActions.slice(0, 3).map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}.</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confidenceNote && <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>{confidenceNote}</p>}
      <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right', opacity: 0.7 }}>Powered by IBM Granite</p>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading, error } = useFarms()
  const [modalOpen, setModalOpen] = useState(false)

  const stats = {
    total:    farms.length,
    critical: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'CRITICAL').length,
    high:     farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'HIGH').length,
    medium:   farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'MEDIUM').length,
    low:      farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'LOW').length,
    alerts:   farms.reduce((s, f) => s + (f.alerts?.length || 0), 0),
  }

  const worstFarm = farms.reduce((w, f) => {
    const s = f.riskAssessments?.[0]?.riskScore ?? 0
    return s > (w?.riskAssessments?.[0]?.riskScore ?? 0) ? f : w
  }, null)

  const worseningFarms = farms.filter(f => {
    const t = f.riskAssessments?.[0]?.trend
    return t === 'WORSENING' || t === 'RAPIDLY_WORSENING'
  })

  // Group by district
  const byDistrict = {}
  for (const f of farms) {
    if (!byDistrict[f.district]) byDistrict[f.district] = { farms: [], worst: null }
    byDistrict[f.district].farms.push(f)
    const ra = f.riskAssessments?.[0]
    if (ra && (!byDistrict[f.district].worst || ra.riskScore > (byDistrict[f.district].worst.riskScore ?? 0))) {
      byDistrict[f.district].worst = ra
    }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            <Waves size={24} style={{ color: 'var(--accent-seafoam)' }} />
            Salinity Shield AI
          </h1>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Smart Salinity Ingress &amp; Coastal Farmland Protection Advisor
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <GraniteStatusIndicator />
          <LiveBadge />
          <button
            className="btn-primary"
            style={{ gap: '0.4rem' }}
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} /> Add Farm
          </button>
        </div>
      </div>

      {/* ── Farm health summary strip ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '0.625rem',
        marginBottom: '1.25rem',
      }}>
        {[
          { value: stats.total,    label: 'Farms',    color: 'var(--accent-seafoam)' },
          { value: stats.critical, label: 'Critical', color: 'var(--risk-critical)' },
          { value: stats.high,     label: 'High',     color: 'var(--risk-high)' },
          { value: stats.medium,   label: 'Medium',   color: 'var(--risk-medium)' },
          { value: stats.low,      label: 'Low',      color: 'var(--risk-low)' },
          { value: stats.alerts,   label: 'Alerts',   color: 'var(--risk-medium)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.625rem', fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert banner ──────────────────────────────────────────────────── */}
      {worstFarm && stats.critical + stats.high > 0 && (
        <div style={{
          background: 'rgba(200,62,77,0.07)',
          border: '1px solid rgba(200,62,77,0.2)',
          borderRadius: 10, padding: '0.875rem 1.125rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <AlertTriangle size={16} style={{ color: 'var(--risk-high)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--risk-high)' }}>Attention Required</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {stats.critical > 0 && `${stats.critical} critical `}
              {stats.high > 0 && `${stats.high} high-risk `}
              {worseningFarms.length > 0 && `· ${worseningFarms.length} worsening`}
            </span>
          </div>
          {worstFarm && (
            <button className="btn-ghost" onClick={() => navigate(`/farms/${worstFarm.id}`)}>
              View {worstFarm.farmName} <ChevronRight size={13} style={{ marginLeft: 2 }} />
            </button>
          )}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* District overview */}
          {Object.keys(byDistrict).length > 0 && (
            <div className="card" style={{ padding: '1rem 1.25rem' }}>
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>Gujarat Coastal Farmland Health</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {Object.entries(byDistrict).map(([district, info]) => {
                  const level = info.worst?.riskLevel || 'UNKNOWN'
                  const trend = info.worst?.trend || 'STABLE'
                  return (
                    <div key={district} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 8,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor(level), flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{district}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{info.farms.length} farm{info.farms.length !== 1 ? 's' : ''}</span>
                      <TrendBadge trend={trend} />
                      <RiskBadge level={level} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Agent pipeline */}
          <AgentPipeline />

          {/* Intelligence shortcuts */}
          <div>
            <div className="section-label" style={{ marginBottom: '0.625rem' }}>Intelligence Features</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
              {[
                { icon: GitBranch,   label: 'AI Decision Trace',  desc: 'View full agent pipeline', path: '/decision-trace', color: '#8B5CF6' },
                { icon: TrendingUp,  label: 'Salinity Forecast',  desc: '30-day trajectory',        path: '/forecast',       color: 'var(--accent-seafoam)' },
                { icon: FlaskConical, label: 'What-If Simulator', desc: 'Model interventions',       path: '/what-if',        color: '#3A9AB5' },
                { icon: Map,          label: 'Risk Heatmap',      desc: 'Gujarat coastal map',       path: '/heatmap',        color: 'var(--risk-low)' },
              ].map(item => (
                <button key={item.path} onClick={() => navigate(item.path)} style={{ textAlign: 'left', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 9, padding: '0.875rem', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <item.icon size={15} style={{ color: item.color }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Farm overview */}
          {!isLoading && farms.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div className="section-label">Farm Overview</div>
                <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => navigate('/farms')}>
                  View All <ChevronRight size={12} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {farms.map(farm => (
                  <FarmCard key={farm.id} farm={farm} onClick={() => navigate(`/farms/${farm.id}`)} />
                ))}
              </div>
            </div>
          )}

          {isLoading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading farms…</div>}
          {error && (
            <div style={{ background: 'rgba(228,87,86,0.08)', border: '1px solid rgba(228,87,86,0.2)', borderRadius: 10, padding: '1rem', fontSize: '0.875rem', color: 'var(--risk-high)' }}>
              Failed to load farms: {error.message}
            </div>
          )}

          {!isLoading && farms.length === 0 && !error && (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Waves size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>No farms registered yet.</p>
              <button className="btn-primary" style={{ gap: '0.4rem', margin: '0 auto' }} onClick={() => setModalOpen(true)}>
                <Plus size={15} /> Add Your First Farm
              </button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* AI Insight */}
          <div style={{ background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.15)', borderRadius: 10, padding: '1.125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <Cpu size={14} style={{ color: 'var(--accent-seafoam)' }} />
              <span className="section-label" style={{ color: 'var(--accent-seafoam)', letterSpacing: '0.05em' }}>AI Insight</span>
            </div>
            {worstFarm ? (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {stats.critical > 0
                    ? `${stats.critical} farm${stats.critical > 1 ? 's are' : ' is'} at critical salinity risk. Immediate intervention is recommended.`
                    : stats.high > 0
                      ? `${stats.high} farm${stats.high > 1 ? 's are' : ' is'} at high risk. Monitor closely and consider irrigation adjustments.`
                      : 'Coastal farmland conditions are being monitored. Continue current practices.'}
                </p>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Most affected: </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{worstFarm.district}</span>
                </div>
                <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }} onClick={() => navigate(`/farms/${worstFarm.id}`)}>
                  View {worstFarm.farmName} <ChevronRight size={13} />
                </button>
              </>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Add farms to see AI-powered insights.</p>
            )}
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.75rem', opacity: 0.7 }}>Powered by IBM Granite</p>
          </div>

          {/* Coastal Farm Health for worst farm */}
          {worstFarm && (
            <div>
              <div className="section-label" style={{ marginBottom: '0.625rem' }}>
                Health — {worstFarm.farmName}
              </div>
              <CoastalHealthCard farmId={worstFarm.id} />
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                { label: 'Live Monitoring',   path: '/monitoring',     icon: Activity },
                { label: 'View Alerts',       path: '/alerts',         icon: AlertTriangle },
                { label: 'AI Farm Advisor',   path: '/advisory',       icon: Cpu },
                { label: 'Sensor Simulator',  path: '/simulator',      icon: Radio },
              ].map(action => (
                <button
                  key={action.path}
                  className="btn-ghost"
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '0.5rem 0.625rem' }}
                  onClick={() => navigate(action.path)}
                >
                  {action.icon && <action.icon size={13} style={{ marginRight: '0.375rem', flexShrink: 0 }} />}
                  {action.label}
                  <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddFarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newFarm) => navigate(`/farms/${newFarm.id}`)}
      />
    </div>
  )
}
