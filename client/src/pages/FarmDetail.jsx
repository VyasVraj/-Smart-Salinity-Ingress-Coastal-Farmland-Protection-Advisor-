import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, MapPin, Droplets, Waves, FlaskConical, Activity, AlertTriangle, Cpu, MessageSquare, TrendingUp, GitBranch } from 'lucide-react'
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
import { useNavigate as useNav } from 'react-router-dom'

const TABS = ['Overview', 'Risk Explained', 'Charts', 'Forecast', 'AI Advisory', 'Alerts', 'Agent Activity', 'What-If', 'Manual Entry', 'Chat']

function AdvisoryCard({ advisory }) {
  let content
  try { content = JSON.parse(advisory.content) } catch { content = { message: advisory.content } }

  const isDemo = JSON.stringify(content).includes('[DEMO]') || JSON.stringify(content).includes('[SAMPLE')

  const titles = {
    MONITORING: '🔬 Monitoring Analysis',
    CROP: '🌾 Crop Advisory',
    IRRIGATION: '💧 Irrigation Guidance',
    RECLAMATION: '🌱 Land Reclamation Plan',
    ALERT: '🚨 Farmer Alert',
    CHAT: '💬 Chat Response',
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white text-sm">{titles[advisory.type] || advisory.type}</h4>
        <div className="flex items-center gap-2">
          {isDemo && <DemoBadge />}
          <span className="text-xs text-gray-600">{formatTime(advisory.createdAt)}</span>
        </div>
      </div>

      {/* Render different advisory structures */}
      {content.conditionSummary && (
        <p className="text-sm text-gray-400">{content.conditionSummary}</p>
      )}
      {content.keyFindings && (
        <ul className="space-y-1">
          {content.keyFindings.map((f, i) => (
            <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>{f}
            </li>
          ))}
        </ul>
      )}
      {content.recommendations && (
        <div className="space-y-2">
          {content.recommendations.slice(0, 3).map((r, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{r.crop}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  r.suitability === 'HIGH' ? 'bg-green-500/20 text-green-400' :
                  r.suitability === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{r.suitability}</span>
              </div>
              <p className="text-gray-500">{r.reason}</p>
            </div>
          ))}
        </div>
      )}
      {content.irrigationGuidance && (
        <ul className="space-y-1">
          {content.irrigationGuidance.slice(0, 4).map((g, i) => (
            <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>{g}
            </li>
          ))}
        </ul>
      )}
      {content.immediateActions && (
        <div>
          <p className="text-xs text-amber-400 font-medium mb-1">Immediate Actions:</p>
          <ul className="space-y-1">
            {content.immediateActions.slice(0, 3).map((a, i) => (
              <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">{i + 1}.</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.alertTitle && (
        <div className="space-y-2">
          <p className="font-medium text-amber-400">{content.alertTitle}</p>
          {content.situationExplained && <p className="text-sm text-gray-400">{content.situationExplained}</p>}
          {content.topThreeActions && (
            <ul className="space-y-1">
              {content.topThreeActions.map((a, i) => (
                <li key={i} className="text-xs text-gray-500 flex gap-2">
                  <span className="text-amber-400">{i + 1}.</span>{a}
                </li>
              ))}
            </ul>
          )}
          {content.encouragingClose && <p className="text-xs text-green-400 italic">{content.encouragingClose}</p>}
        </div>
      )}
      {content.question && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 italic">Q: {content.question}</p>
          <p className="text-sm text-gray-400">{content.answer}</p>
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

  if (isLoading) return <div className="p-6 text-gray-600">Loading farm data...</div>
  if (!farm) return <div className="p-6 text-red-400">Farm not found</div>

  const latestReading = farm.readings?.[0]
  const latestRisk = farm.riskAssessments?.[0]
  const activeAlerts = farm.alerts?.filter(a => a.status === 'ACTIVE') || []

  return (
    <div className="p-6 space-y-5">
      {/* Back + header */}
      <div>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-3">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{farm.farmName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={13} />{farm.farmerName} · {farm.district}</span>
              <span>{farm.currentCrop} · {farm.landArea} ha</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LiveBadge />
            {latestRisk && <RiskBadge level={latestRisk.riskLevel} size="lg" />}
          </div>
        </div>
      </div>

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="font-semibold text-red-400 text-sm">{activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}</h3>
          </div>
          {activeAlerts.slice(0, 2).map(alert => (
            <div key={alert.id} className="text-xs text-gray-400 mb-1">{alert.title}</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        <div className="space-y-5">
          {latestRisk && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Current Risk Assessment</h3>
              <div className="flex items-center gap-4 mb-3">
                <RiskBadge level={latestRisk.riskLevel} size="lg" />
                <TrendBadge trend={latestRisk.trend} />
                <span className="text-sm text-gray-500">Score: {latestRisk.riskScore}/100</span>
                <span className="text-sm text-gray-500">Change: {latestRisk.trendChangePercent}%</span>
              </div>
              <p className="text-sm text-gray-400">{latestRisk.reasoningSummary}</p>
            </div>
          )}

          {latestReading && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Latest Reading — {formatTime(latestReading.timestamp)}
                {latestReading.source === 'SIMULATOR' && <DemoBadge />}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard label="Soil EC" value={latestReading.soilEC} unit="dS/m" status={getECStatus(latestReading.soilEC)} />
                <MetricCard label="Groundwater EC" value={latestReading.groundwaterEC} unit="dS/m" status={getECStatus(latestReading.groundwaterEC)} />
                <MetricCard label="TDS" value={latestReading.tds} unit="ppm" status={getTDSStatus(latestReading.tds)} />
                <MetricCard label="Soil pH" value={latestReading.soilPH} status={getPHStatus(latestReading.soilPH)} />
                <MetricCard label="Moisture" value={latestReading.moisture} unit="%" status="neutral" />
                <MetricCard label="Water Level" value={latestReading.waterLevel} unit="m" status="neutral" />
              </div>
            </div>
          )}

          {/* Farm info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Farm Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Location', farm.location],
                ['Soil Type', farm.soilType],
                ['Irrigation Source', farm.irrigationSource],
                ['Land Area', `${farm.landArea} hectares`],
                ['Coordinates', `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-600">{k}</p>
                  <p className="text-gray-300">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Explained tab */}
      {tab === 'Risk Explained' && (
        <ExplainableRiskScore farmId={id} />
      )}

      {/* Charts tab */}
      {tab === 'Charts' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Salinity Trend (last 60 readings)</h3>
            <SalinityTrendChart readings={readings} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Risk Score Over Time</h3>
            <RiskScoreChart riskAssessments={farm.riskAssessments} />
          </div>
        </div>
      )}

      {/* Forecast tab */}
      {tab === 'Forecast' && (
        <div className="card p-5 text-center text-gray-500 text-sm py-8">
          <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
          <p>Open the full Forecast page for this farm.</p>
          <button
            onClick={() => { window.location.href = '/forecast' }}
            className="btn-primary mt-3 text-xs"
          >
            Open Forecast →
          </button>
        </div>
      )}

      {/* AI Advisory tab */}
      {tab === 'AI Advisory' && (
        <div className="space-y-4">
          {farm.advisories?.length === 0 && (
            <div className="card p-6 text-center text-gray-600 text-sm">
              No advisories yet. Submit a reading to trigger AI agents.
            </div>
          )}
          {farm.advisories?.filter(a => a.type !== 'CHAT').map(advisory => (
            <AdvisoryCard key={advisory.id} advisory={advisory} />
          ))}
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'Alerts' && (
        <div className="space-y-3">
          {farm.alerts?.length === 0 && (
            <div className="card p-6 text-center text-gray-600 text-sm">No alerts for this farm.</div>
          )}
          {farm.alerts?.map(alert => (
            <div key={alert.id} className={`card p-4 border ${
              alert.status === 'RESOLVED' ? 'border-gray-700 opacity-60' : 
              alert.severity === 'CRITICAL' ? 'border-purple-500/30' : 'border-red-500/30'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={alert.status === 'RESOLVED' ? 'text-gray-500' : 'text-red-400'} />
                  <div>
                    <p className="font-medium text-white text-sm">{alert.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-600 mt-2">{formatTime(alert.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.severity === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                    alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{alert.severity}</span>
                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => resolveMutation.mutate(alert.id)}
                      className="text-xs text-gray-500 hover:text-green-400 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                  {alert.status === 'RESOLVED' && <span className="text-xs text-green-500">✓ Resolved</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* What-If tab */}
      {tab === 'What-If' && (
        <div className="card p-5 text-center text-gray-500 text-sm py-8">
          <FlaskConical size={28} className="mx-auto mb-2 opacity-30" />
          <p>Open the full What-If Simulator for this farm.</p>
          <button
            onClick={() => { window.location.href = '/what-if' }}
            className="btn-primary mt-3 text-xs"
          >
            Open What-If Simulator →
          </button>
        </div>
      )}

      {/* Agent Activity tab */}
      {tab === 'Agent Activity' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Real-Time Agent Activity</h3>
            <LiveBadge />
          </div>
          <ActivityTimeline events={events} />
          {events.length === 0 && farm.agentRuns?.length > 0 && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-600 mb-3">Historical agent runs:</p>
              <div className="space-y-2">
                {farm.agentRuns.slice(0, 15).map(run => (
                  <div key={run.id} className="flex items-start gap-3 text-xs bg-gray-800 rounded-lg px-3 py-2">
                    <span className={`font-medium ${run.status === 'COMPLETED' ? 'text-green-400' : run.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'}`}>
                      {run.status === 'COMPLETED' ? '✓' : run.status === 'FAILED' ? '✗' : '⟳'} {run.agentName}
                    </span>
                    <span className="text-gray-500">{run.triggerReason}</span>
                    <span className="text-gray-700 ml-auto">{formatTime(run.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry tab */}
      {tab === 'Manual Entry' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Submit Manual Reading</h3>
          <p className="text-xs text-gray-600 mb-4">
            Submitting a reading triggers the full pipeline: validation → PostgreSQL → risk engine → AI agent orchestration → real-time dashboard update.
          </p>
          <ReadingForm farmId={id} onSuccess={() => {}} />
        </div>
      )}

      {/* Chat tab */}
      {tab === 'Chat' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">AI Farm Advisor Chat</h3>
            <span className="text-xs text-gray-500">— contextual answers based on your farm data</span>
          </div>
          <AIChatAdvisor farmId={id} farmName={farm.farmName} />
        </div>
      )}
    </div>
  )
}
