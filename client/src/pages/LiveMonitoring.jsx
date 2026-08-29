/**
 * Live Monitoring — Real-time farm salinity console
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronRight, Radio } from 'lucide-react'
import { useFarms, useFarmReadings } from '../hooks/useFarm.js'
import { RiskBadge, TrendBadge, LiveBadge, DemoBadge } from '../components/ui/Badges.jsx'
import { SalinityTrendChart } from '../components/charts/SalinityCharts.jsx'
import { MetricCard, getECStatus, getTDSStatus } from '../components/ui/MetricCard.jsx'
import { ActivityTimeline } from '../components/ActivityTimeline.jsx'
import { useActivityTimeline } from '../hooks/useActivityTimeline.js'
import { formatTime } from '../lib/utils.js'

function riskColor(level) {
  return { LOW: '#45D483', MEDIUM: '#F59E0B', HIGH: '#FF453A', CRITICAL: '#FF007A' }[level] || 'var(--text-muted)'
}

export default function LiveMonitoring() {
  const navigate  = useNavigate()
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const farmId = selectedId || farms[0]?.id || ''

  const { data: readings = [] } = useFarmReadings(farmId, 50)
  const { events } = useActivityTimeline(farmId)

  const selectedFarm  = farms.find(f => f.id === farmId)
  const latestReading = readings[readings.length - 1]
  const latestRisk    = selectedFarm?.riskAssessments?.[0]
  const level = latestRisk?.riskLevel || 'UNKNOWN'
  const col   = riskColor(level)

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }} className="page-enter">
      {/* Header — monitoring console style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(69,212,131,0.1)', border: '1px solid rgba(69,212,131,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={16} style={{ color: '#45D483' }} />
          </div>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              ▣ Live Monitoring
              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#45D483', background: 'rgba(69,212,131,0.1)', border: '1px solid rgba(69,212,131,0.25)', borderRadius: 999, padding: '2px 8px', letterSpacing: '0.05em' }}>● LIVE</span>
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Real-time farm salinity tracking</p>
          </div>
        </div>
        <LiveBadge />
      </div>

      {/* Farm selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</label>
        <select className="form-input" style={{ minWidth: 200 }} value={farmId} onChange={e => setSelectedId(e.target.value)}>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
        {selectedFarm && (
          <button className="btn-ghost" onClick={() => navigate(`/farms/${farmId}`)} style={{ gap: '0.25rem' }}>
            Farm Details <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Risk summary strip */}
      {selectedFarm && latestRisk && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center', borderColor: `${col}30` }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Risk Level</div>
            <RiskBadge level={latestRisk.riskLevel} size="lg" />
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center', borderColor: `${col}30` }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Risk Score</div>
            <div style={{ fontSize: '1.625rem', fontWeight: 800, color: col, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: 'monospace' }}>
              {latestRisk.riskScore}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
            </div>
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Trend</div>
            <TrendBadge trend={latestRisk.trend} />
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>EC Change</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: latestRisk.trendChangePercent > 0 ? '#FF453A' : '#45D483', lineHeight: 1, fontFamily: 'monospace' }}>
              {latestRisk.trendChangePercent > 0 ? '+' : ''}{latestRisk.trendChangePercent}%
            </div>
          </div>
        </div>
      )}

      {/* Live sensor status */}
      {latestReading && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
            <Radio size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>LIVE SENSOR DATA</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(latestReading.timestamp)}</span>
            {latestReading.source === 'SIMULATOR' && <DemoBadge />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <MetricCard label="Soil EC"        value={latestReading.soilEC}        unit="dS/m" status={getECStatus(latestReading.soilEC)} />
            <MetricCard label="Groundwater EC" value={latestReading.groundwaterEC} unit="dS/m" status={getECStatus(latestReading.groundwaterEC)} />
            <MetricCard label="TDS"            value={latestReading.tds}           unit="ppm"  status={getTDSStatus(latestReading.tds)} />
          </div>

          {/* Enhanced sensor status pills */}
          <div style={{ display: 'flex', gap: '0.625rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Soil Sensor',        active: latestReading.soilEC != null },
              { label: 'Groundwater Sensor', active: latestReading.groundwaterEC != null },
              { label: 'TDS Sensor',         active: latestReading.tds != null },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: s.active ? 'rgba(69,212,131,0.06)' : 'var(--bg-elevated)', border: `1px solid ${s.active ? 'rgba(69,212,131,0.2)' : 'var(--border-subtle)'}`, borderRadius: 8, fontSize: '0.75rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.active ? '#45D483' : 'var(--text-disabled)', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: s.active ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                <span style={{ color: s.active ? '#45D483' : 'var(--text-disabled)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.6875rem' }}>{s.active ? 'ACTIVE' : 'INACTIVE'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!latestReading && farmId && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          <Radio size={24} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Waiting for sensor data…</p>
        </div>
      )}

      {/* Chart */}
      {farmId && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>REAL-TIME SALINITY TREND</span>
            <LiveBadge />
          </div>
          <SalinityTrendChart readings={readings} />
        </div>
      )}

      {/* Agent activity */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>AGENT ACTIVITY TIMELINE</span>
          <LiveBadge />
        </div>
        <ActivityTimeline events={events} />
      </div>
    </div>
  )
}
