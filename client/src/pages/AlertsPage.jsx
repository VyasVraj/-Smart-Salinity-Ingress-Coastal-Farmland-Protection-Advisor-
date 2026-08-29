/**
 * Alert Center — Incident management with severity-sorted alerts
 */
import { useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, ChevronRight, Shield, Filter } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/utils.js'

function riskCol(level) {
  return { LOW: '#45D483', MEDIUM: '#F5B942', HIGH: '#FF554D', CRITICAL: '#FF2D78' }[level] || 'var(--text-muted)'
}
function riskBg(level) {
  return {
    LOW: 'rgba(69,212,131,0.07)', MEDIUM: 'rgba(245,158,11,0.07)',
    HIGH: 'rgba(255,69,58,0.07)', CRITICAL: 'rgba(255,0,122,0.07)',
  }[level] || 'var(--bg-elevated)'
}
function riskBorder(level) {
  return {
    LOW: 'rgba(69,212,131,0.2)', MEDIUM: 'rgba(245,158,11,0.2)',
    HIGH: 'rgba(255,69,58,0.2)', CRITICAL: 'rgba(255,0,122,0.25)',
  }[level] || 'var(--border)'
}

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { data: farms = [] } = useFarms()
  const [selectedFarmId, setSelectedFarmId] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('ACTIVE')

  const allAlerts = farms.flatMap(f => (f.alerts || []).map(a => ({ ...a, farmName: f.farmName, farmId: f.id })))
  const filtered  = allAlerts
    .filter(a => selectedFarmId === 'all' || a.farmId === selectedFarmId)
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4) || new Date(b.createdAt) - new Date(a.createdAt))

  const activeCount  = allAlerts.filter(a => a.status === 'ACTIVE').length
  const summaryBySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  for (const a of allAlerts.filter(a => a.status === 'ACTIVE')) {
    summaryBySev[a.severity] = (summaryBySev[a.severity] || 0) + 1
  }

  const resolveMutation = useMutation({
    mutationFn: (id) => api.alerts.resolve(id),
    onSuccess: () => queryClient.invalidateQueries(['farms']),
  })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }} className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            <Bell size={20} style={{ color: activeCount > 0 ? '#FF453A' : 'var(--accent-cyan)' }} />
            Alert Center
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {activeCount > 0 ? `${activeCount} active alert${activeCount !== 1 ? 's' : ''} · sorted by severity` : 'No active alerts'}
          </p>
        </div>
      </div>

      {/* Severity summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {Object.entries(summaryBySev).map(([sev, count]) => {
          const col = riskCol(sev)
          return (
            <div key={sev} className="card hover-lift" style={{ padding: '0.875rem', textAlign: 'center', borderColor: count > 0 ? riskBorder(sev) : 'var(--border)', cursor: count > 0 ? 'pointer' : 'default' }}
              onClick={() => count > 0 && setFilterStatus('ACTIVE')}>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, color: col, lineHeight: 1, fontFamily: 'monospace' }}>{count}</div>
              <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sev}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckCircle size={28} style={{ color: '#45D483', margin: '0 auto 0.75rem', opacity: 0.7 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>No alerts found</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {filterStatus === 'ACTIVE' ? 'All clear — no active alerts.' : 'No alerts match your filters.'}
          </p>
        </div>
      )}

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(alert => {
          const col     = riskCol(alert.severity)
          const isActive = alert.status === 'ACTIVE'
          return (
            <div key={alert.id} className="alert-incident hover-lift"
              style={{ opacity: isActive ? 1 : 0.55, borderColor: isActive ? riskBorder(alert.severity) : 'var(--border-subtle)' }}>
              {/* Top accent bar */}
              <div className="alert-incident__accent" style={{ background: isActive ? col : 'var(--border)' }} />
              <div className="alert-incident__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: col, background: `${col}18`, border: `1px solid ${col}30`, borderRadius: 4, padding: '0.1rem 0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{alert.title}</span>
                      {!isActive && <span style={{ fontSize: '0.75rem', color: '#45D483' }}>✓ Resolved</span>}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.5rem' }}>{alert.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <button onClick={() => navigate(`/farms/${alert.farmId}`)}
                        style={{ fontWeight: 600, color: 'var(--accent-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {alert.farmName} <ChevronRight size={11} />
                      </button>
                      <span>·</span>
                      <span>{formatTime(alert.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isActive && (
                      <>
                        <button className="btn-ghost" style={{ fontSize: '0.8125rem', gap: '0.25rem' }}
                          onClick={() => navigate(`/farms/${alert.farmId}`)}>
                          <ChevronRight size={13} /> Investigate
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '0.8125rem' }}
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}>
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
