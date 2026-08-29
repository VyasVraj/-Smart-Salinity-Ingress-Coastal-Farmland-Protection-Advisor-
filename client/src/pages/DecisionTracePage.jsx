/**
 * AI Decision Trace Page — Feature 1
 * Shows the complete agent execution trace for a farm,
 * with a real filter system for pipeline stage categories.
 */
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { GitBranch, ChevronDown, ChevronRight, Layers, Radio, Scale, Bot, Zap } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { socket } from '../lib/socket.js'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/utils.js'
import { LiveBadge } from '../components/ui/Badges.jsx'

// ── Event type configuration (single source of truth) ────────────────────────

const TYPE_CONFIG = {
  READING: {
    icon: '📡',
    color:  'text-blue-400',
    border: 'border-blue-500/30 bg-blue-500/5',
    label:  'Sensor / Data Input',
    filterKey: 'SENSOR',
    FilterIcon: Radio,
  },
  RISK_ASSESSMENT: {
    icon: '⚖️',
    color:  'text-amber-400',
    border: 'border-amber-500/30 bg-amber-500/5',
    label:  'Risk Engine',
    filterKey: 'RISK',
    FilterIcon: Scale,
  },
  AGENT_RUN: {
    icon: '🤖',
    color:  'text-purple-400',
    border: 'border-purple-500/30 bg-purple-500/5',
    label:  'AI Agent',
    filterKey: 'AI_AGENT',
    FilterIcon: Bot,
  },
}

const AGENT_ICONS = {
  MonitoringAgent:      '🔬',
  CropAdvisoryAgent:    '🌾',
  IrrigationAgent:      '💧',
  LandReclamationAgent: '🌱',
  FarmerAlertAgent:     '🚨',
}

// ── Filter definitions (ordered) ─────────────────────────────────────────────

const FILTERS = [
  { key: 'ALL',      label: 'All',                Icon: Layers, emptyMsg: null },
  { key: 'SENSOR',   label: 'Sensor / Data Input', Icon: Radio,  emptyMsg: 'No sensor / data input events found.' },
  { key: 'RISK',     label: 'Risk Engine',         Icon: Scale,  emptyMsg: 'No risk engine events found.' },
  { key: 'AI_AGENT', label: 'AI Agent',            Icon: Bot,    emptyMsg: 'No AI agent events found.' },
]

/** Classify an event into one of the four filter keys */
function classifyEvent(event) {
  const cfg = TYPE_CONFIG[event.type]
  return cfg ? cfg.filterKey : 'AI_AGENT'
}

// ── TraceEvent component (unchanged from original except isLast handling) ─────

function TraceEvent({ event, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const cfg       = TYPE_CONFIG[event.type] || TYPE_CONFIG.AGENT_RUN
  const agentIcon = AGENT_ICONS[event.agent] || cfg.icon

  const statusColor = event.status === 'COMPLETED' ? 'text-green-400'
    : event.status === 'FAILED'  ? 'text-red-400'
    : event.status === 'RUNNING' ? 'text-amber-400'
    : 'text-gray-400'

  const statusIcon  = event.status === 'COMPLETED' ? '✓'
    : event.status === 'FAILED'  ? '✗'
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
                {event.type === 'READING' && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">NEW DATA</span>
                )}
                {event.type === 'RISK_ASSESSMENT' && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">RISK ENGINE</span>
                )}
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
                    {Object.entries(event.detail)
                      .filter(([k]) => k !== 'status' && k !== 'agentName')
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-600 min-w-32">{k}:</span>
                          <span className="text-gray-300">
                            {typeof v === 'object' ? JSON.stringify(v).slice(0, 120) : String(v)}
                          </span>
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DecisionTracePage() {
  const queryClient        = useQueryClient()
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')   // ← filter state

  const farmId = selectedId || farms[0]?.id || ''

  const { data: trace, isLoading, refetch } = useQuery({
    queryKey: ['decision-trace', farmId],
    queryFn: () => api.analytics.decisionTrace(farmId),
    enabled: !!farmId,
    refetchInterval: 10000,
  })

  // Real-time: invalidate when new pipeline events arrive for this farm
  useEffect(() => {
    if (!farmId) return
    const refresh = (data) => {
      if (!data?.farmId || data.farmId === farmId) {
        queryClient.invalidateQueries({ queryKey: ['decision-trace', farmId] })
      }
    }
    socket.on('reading:received',       refresh)
    socket.on('risk:assessed',          refresh)
    socket.on('agent:completed',        refresh)
    socket.on('orchestrator:completed', refresh)
    return () => {
      socket.off('reading:received',       refresh)
      socket.off('risk:assessed',          refresh)
      socket.off('agent:completed',        refresh)
      socket.off('orchestrator:completed', refresh)
    }
  }, [farmId, queryClient])

  const allEvents = trace?.events ?? []

  // ── Per-category counts (derived, never hard-coded) ──────────────────────
  const counts = useMemo(() => {
    const c = { ALL: allEvents.length, SENSOR: 0, RISK: 0, AI_AGENT: 0 }
    for (const e of allEvents) c[classifyEvent(e)]++
    return c
  }, [allEvents])

  // ── Apply active filter ──────────────────────────────────────────────────
  const filteredEvents = useMemo(() =>
    activeFilter === 'ALL'
      ? allEvents
      : allEvents.filter(e => classifyEvent(e) === activeFilter),
    [allEvents, activeFilter]
  )

  // ── Group filtered events into sessions (within 5-minute windows) ─────────
  const sessions = useMemo(() => {
    const result = []
    let cur = []
    for (const e of filteredEvents) {
      if (cur.length === 0) { cur.push(e); continue }
      const diff = Math.abs(new Date(e.timestamp) - new Date(cur[cur.length - 1].timestamp))
      if (diff < 60000 * 5) {
        cur.push(e)
      } else {
        result.push(cur)
        cur = [e]
      }
    }
    if (cur.length) result.push(cur)
    return result
  }, [filteredEvents])

  // Metadata used by session headers (from the full allEvents pool for each session,
  // so risk-level badge remains visible even when filter = SENSOR or AI_AGENT)
  const sessionRiskMap = useMemo(() => {
    // Build a map: first-event-id → risk detail from the same time window in allEvents
    const map = {}
    for (const session of sessions) {
      const anchor = session[0]?.timestamp
      if (!anchor) continue
      const riskEvent = allEvents.find(
        e => e.type === 'RISK_ASSESSMENT' &&
             Math.abs(new Date(e.timestamp) - new Date(anchor)) < 60000 * 5
      )
      map[session[0].id] = riskEvent?.detail ?? null
    }
    return map
  }, [sessions, allEvents])

  const activeFilterDef = FILTERS.find(f => f.key === activeFilter) ?? FILTERS[0]

  return (
    <div className="p-6 space-y-5">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitBranch className="text-purple-400" size={22} /> AI Decision Trace
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete agent execution history — from reading to advisory</p>
        </div>
        <LiveBadge />
      </div>

      {/* ── Farm selector + refresh ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-500">Farm:</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white min-w-48"
          value={farmId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {farms.map(f => (
            <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, Icon }) => {
          const isActive  = activeFilter === key
          const count     = counts[key]

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                border transition-colors
                ${isActive
                  ? key === 'ALL'
                    ? 'bg-gray-700/60 border-gray-500 text-white'
                    : key === 'SENSOR'
                      ? 'bg-blue-500/20   border-blue-500/60   text-blue-300'
                      : key === 'RISK'
                        ? 'bg-amber-500/20  border-amber-500/60  text-amber-300'
                        : 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-300 hover:bg-gray-700/60 hover:border-gray-600'
                }
              `}
            >
              <Icon size={13} />
              <span>{label}</span>
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-mono leading-none
                ${isActive
                  ? key === 'ALL'
                    ? 'bg-gray-600 text-gray-200'
                    : key === 'SENSOR'
                      ? 'bg-blue-500/30   text-blue-200'
                      : key === 'RISK'
                        ? 'bg-amber-500/30  text-amber-200'
                        : 'bg-purple-500/30 text-purple-200'
                  : 'bg-gray-700 text-gray-500'
                }
              `}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="text-gray-600 text-sm py-8 text-center">Loading decision trace…</div>
      )}

      {/* ── No events at all ───────────────────────────────────────────────── */}
      {!isLoading && allEvents.length === 0 && (
        <div className="card p-8 text-center text-gray-600">
          <GitBranch size={32} className="mx-auto mb-3 opacity-30" />
          <p>No agent activity recorded yet for this farm.</p>
          <p className="text-xs mt-2">Submit a reading to trigger the AI agent pipeline.</p>
        </div>
      )}

      {/* ── Filtered empty state (events exist, but none match filter) ─────── */}
      {!isLoading && allEvents.length > 0 && filteredEvents.length === 0 && (
        <div className="card p-8 text-center text-gray-600">
          <activeFilterDef.Icon size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{activeFilterDef.emptyMsg}</p>
          <button
            onClick={() => setActiveFilter('ALL')}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
          >
            Show all events
          </button>
        </div>
      )}

      {/* ── Session timeline ───────────────────────────────────────────────── */}
      {sessions.slice().reverse().map((session, si) => {
        const sessionTime = session[0]?.timestamp
        const riskDetail  = sessionRiskMap[session[0]?.id]
        const agentCount  = session.filter(e => e.type === 'AGENT_RUN').length

        return (
          <div key={si} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap size={14} className="text-amber-400" />
                <span className="text-sm font-semibold text-white">
                  Agent Session — {formatTime(sessionTime)}
                </span>
                {riskDetail?.riskLevel && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    riskDetail.riskLevel === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                    riskDetail.riskLevel === 'HIGH'     ? 'bg-red-500/20     text-red-400'    :
                    riskDetail.riskLevel === 'MEDIUM'   ? 'bg-amber-500/20   text-amber-400'  :
                                                          'bg-green-500/20   text-green-400'
                  }`}>
                    {riskDetail.riskLevel}
                  </span>
                )}
                {/* Active filter label when a sub-filter is selected */}
                {activeFilter !== 'ALL' && (
                  <span className="text-xs text-gray-600 italic">
                    ({activeFilterDef.label} only)
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600">
                {agentCount} agent{agentCount !== 1 ? 's' : ''} ran
              </span>
            </div>

            <div className="space-y-0">
              {session.map((event, ei) => (
                <TraceEvent
                  key={event.id}
                  event={event}
                  isLast={ei === session.length - 1}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
