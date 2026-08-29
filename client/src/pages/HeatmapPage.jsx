/**
 * Coastal Salinity Risk Heatmap — Leaflet + OpenStreetMap
 * No API key required. Free interactive map.
 */
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Map, X, AlertTriangle } from 'lucide-react'
import { api } from '../lib/api.js'
import { socket } from '../lib/socket.js'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime, formatSensor } from '../lib/utils.js'
import LeafletRiskMap from '../components/GoogleRiskMap.jsx'

const RISK_COLORS = {
  LOW:      'var(--risk-low)',
  MEDIUM:   'var(--risk-medium)',
  HIGH:     'var(--risk-high)',
  CRITICAL: 'var(--risk-critical)',
  UNKNOWN:  'var(--text-muted)',
}

const RISK_HEX = {
  LOW: '#3FAE5A', MEDIUM: '#E6A23C', HIGH: '#E45756', CRITICAL: '#C83E4D', UNKNOWN: '#6F8992',
}

const RISK_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }

function FarmDetailPanel({ farm, onClose }) {
  if (!farm) return null
  return (
    <div style={{ background: 'rgba(25,118,210,0.06)', border: '1px solid rgba(25,118,210,0.2)', borderRadius: 10, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{farm.farmName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{farm.farmerName} · {farm.district}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.125rem' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Risk Level</div>
          <RiskBadge level={farm.riskLevel} />
        </div>
        <div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Risk Score</div>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: RISK_COLORS[farm.riskLevel], lineHeight: 1 }}>
            {farm.riskScore ?? '—'}<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
          </div>
        </div>
        {farm.soilEC != null && (
          <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Soil EC</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatSensor('soilEC', farm.soilEC)} dS/m</div>
          </div>
        )}
        {farm.groundwaterEC != null && (
          <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>GW EC</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatSensor('groundwaterEC', farm.groundwaterEC)} dS/m</div>
          </div>
        )}
        {farm.currentCrop && (
          <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Crop</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{farm.currentCrop}</div>
          </div>
        )}
        {farm.landArea != null && (
          <div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Area</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{farm.landArea} ha</div>
          </div>
        )}
      </div>

      {farm.trend && (
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trend:</span>
          <TrendBadge trend={farm.trend} />
        </div>
      )}

      {farm.activeAlerts > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--risk-high)', fontSize: '0.8125rem' }}>
          <AlertTriangle size={12} />
          {farm.activeAlerts} active alert{farm.activeAlerts > 1 ? 's' : ''}
        </div>
      )}

      {farm.lastUpdated && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Updated: {formatTime(farm.lastUpdated)}</div>
      )}
    </div>
  )
}

export default function HeatmapPage() {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [filterDistrict, setFilterDistrict] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['map-risk'],
    queryFn: api.analytics.mapRisk,
    refetchInterval: 30000,
  })

  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['map-risk'] })
    socket.on('risk:assessed',    refresh)
    socket.on('reading:received', refresh)
    socket.on('alert:created',    refresh)
    return () => {
      socket.off('risk:assessed',    refresh)
      socket.off('reading:received', refresh)
      socket.off('alert:created',    refresh)
    }
  }, [queryClient])

  const features = data?.features ?? []
  const regional = data?.regionalSummary ?? []

  const filtered = features.filter(f => {
    if (filterDistrict !== 'all' && f.district !== filterDistrict) return false
    if (filterRisk !== 'all' && f.riskLevel !== filterRisk) return false
    return true
  })

  const districts = [...new Set(features.map(f => f.district))].sort()
  const totalFarms = features.length
  const summary = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  for (const f of features) { if (summary[f.riskLevel] !== undefined) summary[f.riskLevel]++ }

  useEffect(() => {
    if (!selectedFarm) return
    const updated = features.find(f => f.id === selectedFarm.id)
    if (updated && updated !== selectedFarm) setSelectedFarm(updated)
  }, [features]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <Map size={20} style={{ color: 'var(--accent-green)' }} /> Coastal Salinity Risk Map
          </h1>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', color: 'var(--accent-seafoam)', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 999, padding: '1px 8px' }}>
            ● INTERACTIVE
          </span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Gujarat coastal farmland — interactive risk visualization · OpenStreetMap</p>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-seafoam)', lineHeight: 1 }}>{totalFarms}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Farms</div>
        </div>
        {['LOW','MEDIUM','HIGH','CRITICAL'].map(lvl => (
          <div key={lvl} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: RISK_COLORS[lvl], lineHeight: 1 }}>{summary[lvl]}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{RISK_LABELS[lvl]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>District:</label>
          <select className="form-input" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Risk:</label>
          <select className="form-input" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="all">All Risk Levels</option>
            {['LOW','MEDIUM','HIGH','CRITICAL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
        {/* Map */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="section-label">Gujarat Coastal Region</span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {Object.entries(RISK_HEX).filter(([k]) => k !== 'UNKNOWN').map(([level, color]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  {RISK_LABELS[level]}
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 440, background: 'var(--bg-elevated)', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Loading farm locations…
            </div>
          ) : (
            <LeafletRiskMap
              farms={filtered}
              selectedFarm={selectedFarm}
              onFarmSelect={setSelectedFarm}
              onViewDetails={(farmId) => navigate(`/farms/${farmId}`)}
            />
          )}
          {filtered.length === 0 && !isLoading && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              No farms match the current filters.
            </p>
          )}
          {filtered.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              Click a farm marker to see details · Scroll to zoom · Drag to pan
            </p>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {selectedFarm ? (
            <FarmDetailPanel farm={selectedFarm} onClose={() => setSelectedFarm(null)} />
          ) : (
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Map size={22} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              Click a farm on the map to see details
            </div>
          )}

          {/* District breakdown */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>By District</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {regional.map(r => (
                <div key={r.district}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.district}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.total} farms</span>
                  </div>
                  <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                    {r.LOW      > 0 && <div style={{ flex: r.LOW,      background: 'var(--risk-low)' }} />}
                    {r.MEDIUM   > 0 && <div style={{ flex: r.MEDIUM,   background: 'var(--risk-medium)' }} />}
                    {r.HIGH     > 0 && <div style={{ flex: r.HIGH,     background: 'var(--risk-high)' }} />}
                    {r.CRITICAL > 0 && <div style={{ flex: r.CRITICAL, background: 'var(--risk-critical)' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farm list */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Farms ({filtered.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 240, overflowY: 'auto' }}>
              {filtered.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFarm(f)}
                  style={{
                    textAlign: 'left', padding: '0.5rem 0.625rem', borderRadius: 7, fontSize: '0.8125rem',
                    background: selectedFarm?.id === f.id ? 'rgba(45,212,191,0.08)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedFarm?.id === f.id ? 'rgba(45,212,191,0.25)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.farmName}</span>
                    <RiskBadge level={f.riskLevel} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.district}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
