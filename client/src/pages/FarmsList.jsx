import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, ChevronRight, Wheat } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AddFarmModal } from '../components/AddFarmModal.jsx'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime, formatSensor } from '../lib/utils.js'

function riskColor(level) {
  return { LOW: '#45D483', MEDIUM: '#F5B942', HIGH: '#FF554D', CRITICAL: '#FF2D78' }[level] || 'var(--text-muted)'
}

function riskBg(level) {
  return {
    LOW: 'rgba(69,212,131,0.07)', MEDIUM: 'rgba(245,185,66,0.07)',
    HIGH: 'rgba(255,85,77,0.07)', CRITICAL: 'rgba(255,45,120,0.07)',
  }[level] || 'var(--bg-elevated)'
}

function riskBorder(level) {
  return {
    LOW: 'rgba(69,212,131,0.22)', MEDIUM: 'rgba(245,185,66,0.22)',
    HIGH: 'rgba(255,85,77,0.22)', CRITICAL: 'rgba(255,45,120,0.28)',
  }[level] || 'var(--border)'
}

export default function FarmsList() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading } = useFarms()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterRisk, setFilterRisk] = useState('all')

  const handleFarmCreated = (newFarm) => navigate(`/farms/${newFarm.id}`)

  const sorted = [...farms]
    .filter(f => {
      if (filterRisk === 'all') return true
      return (f.riskAssessments?.[0]?.riskLevel || 'UNKNOWN') === filterRisk
    })
    .sort((a, b) => {
      const sa = a.riskAssessments?.[0]?.riskScore ?? 0
      const sb = b.riskAssessments?.[0]?.riskScore ?? 0
      return sb - sa
    })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My Farms</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {farms.length} farm{farms.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button className="btn-primary" style={{ gap: '0.4rem' }} onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Add New Farm
        </button>
      </div>

      {/* Risk filter pills */}
      {farms.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Filter:</span>
          {[
            { key: 'all',      label: 'All',      cls: 'active-all',      count: farms.length },
            { key: 'CRITICAL', label: 'Critical', cls: 'active-critical', count: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'CRITICAL').length },
            { key: 'HIGH',     label: 'High',     cls: 'active-high',     count: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'HIGH').length },
            { key: 'MEDIUM',   label: 'Medium',   cls: 'active-medium',   count: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'MEDIUM').length },
            { key: 'LOW',      label: 'Low',      cls: 'active-low',      count: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'LOW').length },
          ].map(({ key, label, cls, count }) => (
            <button
              key={key}
              onClick={() => setFilterRisk(key)}
              className={`risk-filter-pill${filterRisk === key ? ' ' + cls : ''}`}
            >
              {label}
              <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          ))}
        </div>
      )}

      {isLoading && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading farms…</p>}

      {!isLoading && farms.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <MapPin size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>No farms registered yet.</p>
          <button className="btn-primary" style={{ gap: '0.4rem', margin: '0 auto' }} onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Add Your First Farm
          </button>
        </div>
      )}

      {!isLoading && farms.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Farm', 'District', 'Crop', 'Area', 'Risk', 'Trend', 'EC', 'Last Update', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((farm) => {
                const risk    = farm.riskAssessments?.[0]
                const reading = farm.readings?.[0]
                return (
                  <tr
                    key={farm.id}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/farms/${farm.id}`)}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.0625rem' }}>{farm.farmName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{farm.farmerName}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>{farm.district}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Wheat size={11} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                        {farm.currentCrop || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{farm.landArea} ha</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <RiskBadge level={risk?.riskLevel} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {risk ? <TrendBadge trend={risk.trend} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem' }}>
                      {reading ? (
                        <span style={{ color: reading.soilEC >= 4 ? 'var(--risk-high)' : reading.soilEC >= 2 ? 'var(--risk-medium)' : 'var(--risk-low)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {formatSensor('soilEC', reading.soilEC)} dS/m
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {reading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatTime(reading.timestamp)}</span>
                          <span style={{ fontSize: '0.6875rem' }}>1 reading total</span>
                        </div>
                      ) : <span style={{ color: 'var(--border)' }}>No readings yet</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>
                      <ChevronRight size={15} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddFarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleFarmCreated}
      />
    </div>
  )
}
