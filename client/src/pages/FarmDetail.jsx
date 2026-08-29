import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, MapPin, AlertTriangle, Cpu, MessageSquare, TrendingUp, GitBranch, FlaskConical, Wheat } from 'lucide-react'
import { useFarm, useFarmReadings } from '../hooks/useFarm.js'
import { useActivityTimeline } from '../hooks/useActivityTimeline.js'
import { RiskBadge, TrendBadge, DemoBadge, LiveBadge } from '../components/ui/Badges.jsx'
import { MetricCard, getECStatus, getTDSStatus, getPHStatus } from '../components/ui/MetricCard.jsx'
import { SalinityTrendChart, RiskScoreChart } from '../components/charts/SalinityCharts.jsx'
import { ActivityTimeline } from '../components/ActivityTimeline.jsx'
import { ReadingForm } from '../components/ReadingForm.jsx'
import { AIChatAdvisor } from '../components/AIChatAdvisor.jsx'
import { ExplainableRiskScore } from '../components/ExplainableRiskScore.jsx'
import { formatTime } from '../lib/utils.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'

const TABS = ['Overview', 'Risk Explained', 'Charts', 'AI Advisory', 'Alerts', 'Agent Activity', 'Manual Entry', 'Chat']

function riskCol(level) {
  return { LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)' }[level] || 'var(--text-muted)'
}

function AdvisoryCard({ advisory }) {
  let content
  try { content = JSON.parse(advisory.content) } catch { content = { message: advisory.content } }
  const isDemo = JSON.stringify(content).includes('[DEMO]') || JSON.stringify(content).includes('[SAMPLE')
  const titles = {
    MONITORING: 'Monitoring Analysis', CROP: 'Crop Advisory',
    IRRIGATION: 'Irrigation Guidance', RECLAMATION: 'Land Reclamation Plan',
    ALERT: 'Farmer Alert', CHAT: 'Chat Response',
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{titles[advisory.type] || advisory.type}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isDemo && <DemoBadge />}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(advisory.createdAt)}</span>
        </div>
      </div>
      {content.conditionSummary && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{content.conditionSummary}</p>}
      {content.recommendations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
          {content.recommendations.slice(0, 3).map((r, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 7, padding: '0.625rem 0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.crop}</span>
                <span style={{ fontSize: '0.75rem', color: r.suitability === 'HIGH' ? 'var(--risk-low)' : r.suitability === 'MODERATE' ? 'var(--risk-medium)' : 'var(--text-muted)' }}>{r.suitability}</span>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>{r.reason}</p>
            </div>
          ))}
        </div>
      )}
      {content.irrigationGuidance && (
        <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none' }}>
          {content.irrigationGuidance.slice(0, 4).map((g, i) => (
            <li key={i} style={{ display: 'flex', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--accent-seafoam)', flexShrink: 0 }}>·</span>{g}
            </li>
          ))}
        </ul>
      )}
      {content.immediateActions && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className="section-label" style={{ marginBottom: '0.375rem', color: 'var(--risk-medium)' }}>Immediate Actions</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {content.immediateActions.slice(0, 3).map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--risk-medium)', flexShrink: 0 }}>{i + 1}.</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.alertTitle && (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--risk-medium)', marginBottom: '0.375rem' }}>{content.alertTitle}</p>
          {content.situationExplained && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{content.situationExplained}</p>}
          {content.topThreeActions && (
            <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none' }}>
              {content.topThreeActions.map((a, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--risk-medium)', flexShrink: 0 }}>{i + 1}.</span>{a}
                </li>
              ))}
            </ul>
          )}
          {content.encouragingClose && <p style={{ fontSize: '0.8125rem', color: 'var(--risk-low)', fontStyle: 'italic', marginTop: '0.5rem' }}>{content.encouragingClose}</p>}
        </div>
      )}
      {content.question && (
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.25rem' }}>Q: {content.question}</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{content.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function FarmDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('Overview')

  const { data: farm, isLoading } = useFarm(id)
  const { data: readings = [] } = useFarmReadings(id)
  const { events } = useActivityTimeline(id)

  const resolveMutation = useMutation({
    mutationFn: (alertId) => api.alerts.resolve(alertId),
    onSuccess: () => queryClient.invalidateQueries(['farm', id]),
  })

  if (isLoading) return (
    <div style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading farm data…</div>
  )
  if (!farm) return (
    <div style={{ padding: '1.5rem', color: 'var(--risk-high)', fontSize: '0.875rem' }}>Farm not found</div>
  )

  const latestReading = farm.readings?.[0]
  const latestRisk = farm.riskAssessments?.[0]
  const activeAlerts = farm.alerts?.filter(a => a.status === 'ACTIVE') || []
  const level = latestRisk?.riskLevel || 'UNKNOWN'

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className="btn-ghost"
          style={{ padding: '0.375rem 0.5rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          onClick={() => navigate('/farms')}
        >
          <ArrowLeft size={14} /> Back to My Farms
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem' }}>
              {farm.farmName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                <MapPin size={12} /> {farm.farmerName} · {farm.district}
              </span>
              {farm.currentCrop && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <Wheat size={12} /> {farm.currentCrop} · {farm.landArea} ha
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LiveBadge />
            {latestRisk && <RiskBadge level={level} size="lg" />}
          </div>
        </div>

        {/* Risk score hero */}
        {latestRisk && (
          <div style={{
            marginTop: '1rem',
            background: `linear-gradient(135deg, ${riskCol(level)}14, transparent)`,
            border: `1px solid ${riskCol(level)}30`,
            borderRadius: 10,
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Farm Health Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: riskCol(level), lineHeight: 1 }}>
                {100 - latestRisk.riskScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Risk Score</div>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: riskCol(level) }}>{latestRisk.riskScore}/100</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Trend</div>
              <TrendBadge trend={latestRisk.trend} />
            </div>
            {activeAlerts.length > 0 && (
              <>
                <div style={{ width: 1, height: 48, background: 'var(--border)', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--risk-high)' }}>
                  <AlertTriangle size={15} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''}</span>
                </div>
              </>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={() => navigate('/what-if')}>Run What-If</button>
              <button className="btn-ghost" onClick={() => navigate('/advisory')}>AI Advisor</button>
            </div>
          </div>
        )}
      </div>

      {/* Alerts banner */}
      {activeAlerts.length > 0 && (
        <div style={{ background: 'rgba(228,87,86,0.07)', border: '1px solid rgba(228,87,86,0.2)', borderRadius: 10, padding: '0.875rem 1.125rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <AlertTriangle size={15} style={{ color: 'var(--risk-high)' }} />
            <span style={{ fontWeight: 600, color: 'var(--risk-high)', fontSize: '0.875rem' }}>{activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}</span>
          </div>
          {activeAlerts.slice(0, 2).map(alert => (
            <div key={alert.id} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.125rem' }}>{alert.title}</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {latestReading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="section-label">Latest Reading</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(latestReading.timestamp)}</span>
                {latestReading.source === 'SIMULATOR' && <DemoBadge />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <MetricCard label="Soil EC"        value={latestReading.soilEC}        unit="dS/m" status={getECStatus(latestReading.soilEC)} />
                <MetricCard label="Groundwater EC" value={latestReading.groundwaterEC} unit="dS/m" status={getECStatus(latestReading.groundwaterEC)} />
                <MetricCard label="TDS"            value={latestReading.tds}           unit="ppm"  status={getTDSStatus(latestReading.tds)} />
                <MetricCard label="Soil pH"        value={latestReading.soilPH}                    status={getPHStatus(latestReading.soilPH)} />
                <MetricCard label="Moisture"       value={latestReading.moisture}      unit="%"    status="neutral" />
                <MetricCard label="Water Level"    value={latestReading.waterLevel}    unit="m"    status="neutral" />
              </div>
            </div>
          )}

          {latestRisk && (
            <div className="card" style={{ padding: '1rem 1.25rem' }}>
              <div className="section-label" style={{ marginBottom: '0.625rem' }}>Risk Assessment</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{latestRisk.reasoningSummary}</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Change: {latestRisk.trendChangePercent}% · Score: {latestRisk.riskScore}/100
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Farm Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem 1.25rem' }}>
              {[
                ['Location', farm.location], ['Soil Type', farm.soilType],
                ['Irrigation', farm.irrigationSource], ['Area', `${farm.landArea} hectares`],
                ['Coordinates', `${farm.latitude?.toFixed(4)}, ${farm.longitude?.toFixed(4)}`],
              ].map(([k, v]) => v && (
                <div key={k}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>{k}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Risk Explained' && <ExplainableRiskScore farmId={id} />}

      {tab === 'Charts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Salinity Trend (last 60 readings)</div>
            <SalinityTrendChart readings={readings} />
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="section-label" style={{ marginBottom: '1rem' }}>Risk Score Over Time</div>
            <RiskScoreChart riskAssessments={farm.riskAssessments} />
          </div>
        </div>
      )}

      {tab === 'AI Advisory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(farm.advisories?.filter(a => a.type !== 'CHAT')?.length ?? 0) === 0 && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No advisories yet. Submit a reading to trigger AI agents.
            </div>
          )}
          {farm.advisories?.filter(a => a.type !== 'CHAT').map(advisory => (
            <AdvisoryCard key={advisory.id} advisory={advisory} />
          ))}
        </div>
      )}

      {tab === 'Alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {(farm.alerts?.length ?? 0) === 0 && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No alerts for this farm.</div>
          )}
          {farm.alerts?.map(alert => {
            const col = riskCol(alert.severity)
            return (
              <div key={alert.id} className="card" style={{ padding: '1rem', opacity: alert.status === 'RESOLVED' ? 0.55 : 1, borderColor: col + '30' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <AlertTriangle size={14} style={{ color: col, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{alert.title}</span>
                      <span style={{ fontSize: '0.6875rem', color: col, background: col + '18', border: `1px solid ${col}30`, borderRadius: 4, padding: '0.1rem 0.4rem' }}>{alert.severity}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{formatTime(alert.createdAt)}</p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {alert.status === 'ACTIVE' && (
                      <button className="btn-ghost" style={{ fontSize: '0.8125rem' }} onClick={() => resolveMutation.mutate(alert.id)}>Resolve</button>
                    )}
                    {alert.status === 'RESOLVED' && <span style={{ fontSize: '0.75rem', color: 'var(--risk-low)' }}>✓ Resolved</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'Agent Activity' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="section-label">Real-Time Agent Activity</div>
            <LiveBadge />
          </div>
          <ActivityTimeline events={events} />
          {events.length === 0 && (farm.agentRuns?.length ?? 0) > 0 && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div className="section-label" style={{ marginBottom: '0.5rem' }}>Historical Agent Runs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {farm.agentRuns.slice(0, 15).map(run => (
                  <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem', background: 'var(--bg-elevated)', borderRadius: 7, padding: '0.5rem 0.75rem' }}>
                    <span style={{ fontWeight: 600, color: run.status === 'COMPLETED' ? 'var(--risk-low)' : run.status === 'FAILED' ? 'var(--risk-high)' : 'var(--risk-medium)' }}>
                      {run.status === 'COMPLETED' ? '✓' : run.status === 'FAILED' ? '✗' : '⟳'} {run.agentName}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flex: 1 }}>{run.triggerReason}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatTime(run.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Manual Entry' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="section-label" style={{ marginBottom: '0.5rem' }}>Submit Manual Reading</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Submitting a reading triggers the full pipeline: validation → PostgreSQL → risk engine → AI agent orchestration → real-time update.
          </p>
          <ReadingForm farmId={id} onSuccess={() => {}} />
        </div>
      )}

      {tab === 'Chat' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={15} style={{ color: 'var(--accent-seafoam)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>AI Farm Advisor Chat</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>— answers based on your farm data</span>
          </div>
          <AIChatAdvisor farmId={id} farmName={farm.farmName} />
        </div>
      )}
    </div>
  )
}
