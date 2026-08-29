import { useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/utils.js'

function riskCol(level) {
  return { LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)' }[level] || 'var(--text-muted)'
}

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: farms = [] } = useFarms()
  const [selectedFarmId, setSelectedFarmId] = useState('all')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')

  const allAlerts = farms.flatMap(f => (f.alerts || []).map(a => ({ ...a, farmName: f.farmName, farmId: f.id })))
  const filtered = allAlerts
    .filter(a => selectedFarmId === 'all' || a.farmId === selectedFarmId)
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const activeCount   = allAlerts.filter(a => a.status === 'ACTIVE').length
  const summaryBySev  = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const a of allAlerts.filter(a => a.status === 'ACTIVE')) { summaryBySev[a.severity] = (summaryBySev[a.severity] || 0) + 1 }

  const resolveMutation = useMutation({
    mutationFn: (id) => api.alerts.resolve(id),
    onSuccess: () => queryClient.invalidateQueries(['farms']),
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            <Bell size={20} style={{ color: 'var(--risk-medium)' }} /> Alert Center
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{activeCount} active alert{activeCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {Object.entries(summaryBySev).map(([sev, count]) => (
          <div key={sev} className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: riskCol(sev), lineHeight: 1, letterSpacing: '-0.02em' }}>{count}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sev}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</label>
          <select className="form-input" style={{ minWidth: 160 }} value={selectedFarmId} onChange={e => setSelectedFarmId(e.target.value)}>
            <option value="all">All Farms</option>
            {farms.map(f => <option key={f.id} value={f.id}>{f.farmName}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</label>
          <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Bell size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No alerts found.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {filtered.map(alert => {
          const col = riskCol(alert.severity)
          return (
            <div key={alert.id} className="card" style={{
              padding: '1rem 1.125rem',
              opacity: alert.status === 'RESOLVED' ? 0.55 : 1,
              borderLeft: `3px solid ${col}`,
              borderLeftWidth: 3,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: col, background: col + '18', border: `1px solid ${col}30`, borderRadius: 4, padding: '0.1rem 0.45rem', letterSpacing: '0.04em' }}>
                      {alert.severity}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{alert.title}</span>
                    {alert.status === 'RESOLVED' && <span style={{ fontSize: '0.75rem', color: 'var(--risk-low)' }}>✓ Resolved</span>}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.375rem' }}>{alert.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{alert.farmName}</span>
                    <span>·</span>
                    <span>{formatTime(alert.createdAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {alert.status === 'ACTIVE' && (
                    <button className="btn-ghost" style={{ fontSize: '0.8125rem' }} onClick={() => resolveMutation.mutate(alert.id)}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
