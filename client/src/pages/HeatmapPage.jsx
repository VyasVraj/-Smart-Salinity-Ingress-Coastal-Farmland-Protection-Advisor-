/**
 * HeatmapPage â€” Regional Intelligence using OpenStreetMap + Leaflet
 * No Google Maps. No API key required.
 */
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Map, X, AlertTriangle, Filter } from 'lucide-react'
import { api } from '../lib/api.js'
import { socket } from '../lib/socket.js'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime, formatSensor } from '../lib/utils.js'
import LeafletRiskMap from '../components/LeafletRiskMap.jsx'

const RISK_COLORS = {
  LOW: '#45D483', MEDIUM: '#F5B942', HIGH: '#FF554D', CRITICAL: '#FF2D78', UNKNOWN: 'var(--text-muted)',
}
const RISK_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }

function FarmDetailPanel({ farm, onClose }) {
  if (!farm) return null
  const col = RISK_COLORS[farm.riskLevel] || RISK_COLORS.UNKNOWN
  return (
    <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${col}25`, borderRadius: 12, padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: col, opacity: 0.6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{farm.farmName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{farm.farmerName} Â· {farm.district}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.125rem' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Risk Level</div>
          <RiskBadge level={farm.riskLevel} />
        </div>
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Risk Score</div>
          <div style={{ fontWeight: 800, fontSize: '1.125rem', color: col, fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {farm.riskScore ?? 'â€”'}<span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
          </div>
        </div>
        {farm.soilEC != null && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Soil EC</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{formatSensor('soilEC', farm.soilEC)} dS/m</div>
          </div>
        )}
        {farm.groundwaterEC != null && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>GW EC</div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{formatSensor('groundwaterEC', farm.groundwaterEC)} dS/m</div>
          </div>
        )}
      </div>

      {farm.trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trend:</span>
          <TrendBadge trend={farm.trend} />
        </div>
      )}
      {farm.activeAlerts > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#FF554D', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={12} /> {farm.activeAlerts} active alert{farm.activeAlerts > 1 ? 's' : ''}
        </div>
      )}
      {farm.lastUpdated && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated: {formatTime(farm.lastUpdated)}</div>
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

  const features  = data?.features ?? []
  const regional  = data?.regionalSummary ?? []

  const filtered = features.filter(f => {
    if (filterDistrict !== 'all' && f.district !== filterDistrict) return false
    if (filterRisk !== 'all' && f.riskLevel !== filterRisk) return false
    return true
  })

  const districts  = [...new Set(features.map(f => f.district))].sort()
  const totalFarms = features.length
  const summary    = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  for (const f of features) { if (summary[f.riskLevel] !== undefined) summary[f.riskLevel]++ }

  useEffect(() => {
    if (!selectedFarm) return
    const updated = features.find(f => f.id === selectedFarm.id)
    if (updated && updated !== selectedFarm) setSelectedFarm(updated)
  }, [features]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: '1.5rem' }} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            <Map size={20} style={{ color: 'var(--accent-cyan)' }} /> Coastal Risk Map
          </h1>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-cyan)', background: 'rgba(25,230,210,0.1)', border: '1px solid rgba(25,230,210,0.2)', borderRadius: 999, padding: '2px 10px' }}>
            â— INTERACTIVE
          </span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Gujarat coastal farmland â€” live risk visualization Â· OpenStreetMap
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1, fontFamily: 'monospace' }}>{totalFarms}</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farms</div>
        </div>
        {['LOW','MEDIUM','HIGH','CRITICAL'].map(lvl => (
          <div key={lvl} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: RISK_COLORS[lvl], lineHeight: 1, fontFamily: 'monospace' }}>{summary[lvl]}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{RISK_LABELS[lvl]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>District:</label>
          <select className="form-input" style={{ minWidth: 140 }} value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Risk:</label>
          <select className="form-input" style={{ minWidth: 140 }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="all">All Risk Levels</option>
            {['LOW','MEDIUM','HIGH','CRITICAL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {(filterDistrict !== 'all' || filterRisk !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => { setFilterDistrict('all'); setFilterRisk('all') }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
        {/* Map */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>GUJARAT COASTAL REGION</span>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {Object.entries(RISK_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([level, color]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                  {RISK_LABELS[level]}
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton" style={{ height: 460, borderRadius: 8 }} />
          ) : (
            <LeafletRiskMap
              farms={filtered}
              selectedFarm={selectedFarm}
              onFarmSelect={setSelectedFarm}
              onViewDetails={(farmId) => navigate(`/farms/${farmId}`)}
            />
          )}
          {!isLoading && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
              {filtered.length === 0 ? 'No farms match current filters.' : 'Click a marker to inspect Â· Scroll to zoom Â· Drag to pan'}
            </p>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {selectedFarm ? (
            <FarmDetailPanel farm={selectedFarm} onClose={() => setSelectedFarm(null)} />
          ) : (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Map size={22} style={{ margin: '0 auto 0.625rem', opacity: 0.3 }} />
              Click a farm on the map to see details
            </div>
          )}

          {/* District breakdown */}
          {regional.length > 0 && (
            <div className="card" style={{ padding: '1rem' }}>
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>BY DISTRICT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {regional.map(r => (
                  <div key={r.district}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{r.district}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{r.total} farms</span>
                    </div>
                    <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                      {r.LOW      > 0 && <div style={{ flex: r.LOW,      background: '#45D483' }} />}
                      {r.MEDIUM   > 0 && <div style={{ flex: r.MEDIUM,   background: '#F5B942' }} />}
                      {r.HIGH     > 0 && <div style={{ flex: r.HIGH,     background: '#FF554D' }} />}
                      {r.CRITICAL > 0 && <div style={{ flex: r.CRITICAL, background: '#FF2D78' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farm list */}
          <div className="card" style={{ padding: '1rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>FARMS ({filtered.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 260, overflowY: 'auto' }}>
              {filtered.map(f => (
                <button key={f.id} onClick={() => setSelectedFarm(f)}
                  style={{
                    textAlign: 'left', padding: '0.5rem 0.625rem', borderRadius: 8, fontSize: '0.8125rem',
                    background: selectedFarm?.id === f.id ? 'var(--accent-cyan-dim)' : 'var(--bg-elevated)',
                    border: `1px solid ${selectedFarm?.id === f.id ? 'rgba(25,230,210,0.2)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{f.farmName}</span>
                    <RiskBadge level={f.riskLevel} />
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>{f.district}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No farms match current filters.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

