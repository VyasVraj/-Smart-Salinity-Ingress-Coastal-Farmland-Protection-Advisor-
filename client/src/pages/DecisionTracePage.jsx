/**
 * AI Decision Trace Page — Feature 1
 * Shows the complete agent execution trace for a farm
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GitBranch, ChevronDown, ChevronRight, Cpu, Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/utils.js'
import { LiveBadge } from '../components/ui/Badges.jsx'

const TYPE_CONFIG = {
  READING: {
    icon: '📡',
    color: 'text-blue-400',
    border: 'border-blue-500/30 bg-blue-500/5',
    label: 'Sensor / Data Input',
  },
  RISK_ASSESSMENT: {
    icon: '⚖️',
    color: 'text-amber-400',
    border: 'border-amber-500/30 bg-amber-500/5',
    label: 'Risk Engine',
  },
  AGENT_RUN: {
    icon: '🤖',
    color: 'text-purple-400',
    border: 'border-purple-500/30 bg-purple-500/5',
    label: 'AI Agent',
  },
}

const AGENT_ICONS = {
  MonitoringAgent:     '🔬',
  CropAdvisoryAgent:   '🌾',
  IrrigationAgent:     '💧',
  LandReclamationAgent:'🌱',
  FarmerAlertAgent:    '🚨',
}

function TraceEvent({ event, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.AGENT_RUN
  const agentIcon = AGENT_ICONS[event.agent] || cfg.icon

  const statusColor = event.status === 'COMPLETED' ? 'text-green-400'
    : event.status === 'FAILED' ? 'text-red-400'
    : event.status === 'RUNNING' ? 'text-amber-400'
    : 'text-gray-400'

  const statusIcon = event.status === 'COMPLETED' ? '✓'
    : event.status === 'FAILED' ? '✗'
    : event.status === 'RUNNING' ? '⟳'
    : '○'

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-700/50" style={{ zIndex: 0 }} />
      )}

      <div className="relative flex gap-4" style={{ zIndex: 1 }}>
        {/* Icon bubble */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg border ${cfg.border} bg-gray-900`}>
          {agentIcon}
        </div>

        {/* Content */}
        <div className={`flex-1 mb-3 rounded-xl border ${cfg.border} overflow-hidden`}>
          <button
            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors"
            onClick={() => setExpanded(e => !e)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${cfg.color}`}>{event.agent}</span>
                <span className={`text-xs font-mono ${statusColor}`}>{statusIcon} {event.status}</span>
                {event.type === 'READING' && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">NEW DATA</span>}
                {event.type === 'RISK_ASSESSMENT' && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">RISK ENGINE</span>}
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{event.summary}</p>
              <p className="text-xs text-gray-600 mt-1">{formatTime(event.timestamp)}</p>
            </div>
            <div className="flex-shrink-0 mt-1 text-gray-600">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </button>

          {expanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-800/60 space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Why was this triggered?</p>
                <p className="text-xs text-gray-300">{event.trigger}</p>
              </div>
              {event.detail && Object.keys(event.detail).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Input Data</p>
                  <div className="bg-gray-950 rounded-lg p-3 text-xs font-mono text-gray-400 space-y-1">
                    {Object.entries(event.detail).filter(([k]) => k !== 'status' && k !== 'agentName').map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-gray-600 min-w-32">{k}:</span>
                        <span className="text-gray-300">{typeof v === 'object' ? JSON.stringify(v).slice(0, 120) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DecisionTracePage() {
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const farmId = selectedId || farms[0]?.id || ''

  const { data: trace, isLoading, refetch } = useQuery({
    queryKey: ['decision-trace', farmId],
    queryFn: () => api.analytics.decisionTrace(farmId),
    enabled: !!farmId,
    refetchInterval: 10000,
  })

  const events = trace?.events ?? []
  // Group by reading session (events near same time)
  const sessions = []
  let cur = []
  for (const e of events) {
    if (cur.length === 0) { cur.push(e); continue }
    const last = cur[cur.length - 1]
    const diff = Math.abs(new Date(e.timestamp) - new Date(last.timestamp))
    if (diff < 60000 * 5) { // within 5 minutes = same session
      cur.push(e)
    } else {
      sessions.push(cur)
      cur = [e]
    }
  }
  if (cur.length) sessions.push(cur)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitBranch className="text-purple-400" size={22} /> AI Decision Trace
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete agent execution history — from reading to advisory</p>
        </div>
        <LiveBadge />
      </div>

      {/* Farm selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Farm:</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white min-w-48"
          value={farmId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
        <button onClick={() => refetch()} className="text-xs text-blue-400 hover:text-blue-300">↻ Refresh</button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <div key={type} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${cfg.border}`}>
            <span>{cfg.icon}</span>
            <span className={cfg.color}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {isLoading && <div className="text-gray-600 text-sm py-8 text-center">Loading decision trace...</div>}

      {!isLoading && events.length === 0 && (
        <div className="card p-8 text-center text-gray-600">
          <GitBranch size={32} className="mx-auto mb-3 opacity-30" />
          <p>No agent activity recorded yet for this farm.</p>
          <p className="text-xs mt-2">Submit a reading to trigger the AI agent pipeline.</p>
        </div>
      )}

      {/* Sessions */}
      {sessions.slice().reverse().map((session, si) => {
        const sessionTime = session[0]?.timestamp
        const hasReading = session.some(e => e.type === 'READING')
        const riskEvent  = session.find(e => e.type === 'RISK_ASSESSMENT')
        const agentCount = session.filter(e => e.type === 'AGENT_RUN').length
        return (
          <div key={si} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">Agent Session — {formatTime(sessionTime)}</span>
                {riskEvent && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    riskEvent.detail?.riskLevel === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                    riskEvent.detail?.riskLevel === 'HIGH'     ? 'bg-red-500/20     text-red-400'    :
                    riskEvent.detail?.riskLevel === 'MEDIUM'   ? 'bg-amber-500/20   text-amber-400'  :
                                                                  'bg-green-500/20   text-green-400'
                  }`}>
                    {riskEvent.detail?.riskLevel}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600">{agentCount} agent{agentCount !== 1 ? 's' : ''} ran</span>
            </div>
            <div className="space-y-0">
              {session.map((event, ei) => (
                <TraceEvent key={event.id} event={event} isLast={ei === session.length - 1} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
