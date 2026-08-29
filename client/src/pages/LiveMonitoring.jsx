import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronRight } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { useFarmReadings } from '../hooks/useFarm.js'
import { RiskBadge, TrendBadge, LiveBadge, DemoBadge } from '../components/ui/Badges.jsx'
import { SalinityTrendChart } from '../components/charts/SalinityCharts.jsx'
import { MetricCard, getECStatus, getTDSStatus } from '../components/ui/MetricCard.jsx'
import { ActivityTimeline } from '../components/ActivityTimeline.jsx'
import { useActivityTimeline } from '../hooks/useActivityTimeline.js'
import { formatTime } from '../lib/utils.js'

export default function LiveMonitoring() {
  const navigate = useNavigate()
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const farmId = selectedId || farms[0]?.id || ''

  const { data: readings = [] } = useFarmReadings(farmId, 50)
  const { events } = useActivityTimeline(farmId)

  const selectedFarm = farms.find(f => f.id === farmId)
  const latestReading = readings[readings.length - 1]
  const latestRisk = selectedFarm?.riskAssessments?.[0]

  const riskCol = { LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)' }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <Activity size={20} style={{ color: 'var(--accent-green)' }} /> Live Monitoring
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Real-time farm salinity tracking</p>
        </div>
        <LiveBadge />
      </div>

      {/* Farm selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</label>
        <select
          className="form-input"
          style={{ minWidth: 200 }}
          value={farmId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
        {selectedFarm && (
          <button className="btn-ghost" onClick={() => navigate(`/farms/${farmId}`)}>
            View Full Detail <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Risk summary strip */}
      {selectedFarm && latestRisk && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Risk Level</div>
            <RiskBadge level={latestRisk.riskLevel} size="lg" />
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Risk Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: riskCol[latestRisk.riskLevel] || 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {latestRisk.riskScore}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
            </div>
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>Trend</div>
            <TrendBadge trend={latestRisk.trend} />
          </div>
          <div className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div className="section-label" style={{ marginBottom: '0.5rem' }}>EC Change</div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: latestRisk.trendChangePercent > 0 ? 'var(--risk-high)' : 'var(--risk-low)', lineHeight: 1 }}>
              {latestRisk.trendChangePercent > 0 ? '+' : ''}{latestRisk.trendChangePercent}%
            </div>
          </div>
        </div>
      )}

      {/* Latest reading */}
      {latestReading && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="section-label">Latest Reading</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(latestReading.timestamp)}</span>
            {latestReading.source === 'SIMULATOR' && <DemoBadge />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            <MetricCard label="Soil EC"        value={latestReading.soilEC}        unit="dS/m" status={getECStatus(latestReading.soilEC)} />
            <MetricCard label="Groundwater EC" value={latestReading.groundwaterEC} unit="dS/m" status={getECStatus(latestReading.groundwaterEC)} />
            <MetricCard label="TDS"            value={latestReading.tds}           unit="ppm"  status={getTDSStatus(latestReading.tds)} />
          </div>
        </div>
      )}

      {/* Chart */}
      {farmId && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '1rem' }}>Salinity Trend</div>
          <SalinityTrendChart readings={readings} />
        </div>
      )}

      {/* Agent activity */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="section-label">Agent Activity Timeline</div>
          <LiveBadge />
        </div>
        <ActivityTimeline events={events} />
      </div>
    </div>
  )
}
