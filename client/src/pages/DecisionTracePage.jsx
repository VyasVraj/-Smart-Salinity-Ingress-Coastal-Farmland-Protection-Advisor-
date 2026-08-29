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

// TYPE_CONFIG uses inline-style objects instead of Tailwind classes so that
// colours resolve correctly in both dark and light themes via CSS variables.
const TYPE_CONFIG = {
  READING: {
    icon:       '📡',
    textColor:  'var(--accent-seafoam)',
    borderColor:'rgba(45,212,191,0.3)',
    bgColor:    'rgba(45,212,191,0.04)',
    label:      'Sensor / Data Input',
    filterKey:  'SENSOR',
    FilterIcon: Radio,
  },
  RISK_ASSESSMENT: {
    icon:       '⚖️',
    textColor:  'var(--risk-medium)',
    borderColor:'rgba(230,162,60,0.3)',
    bgColor:    'rgba(230,162,60,0.04)',
    label:      'Risk Engine',
    filterKey:  'RISK',
    FilterIcon: Scale,
  },
  AGENT_RUN: {
    icon:       '🤖',
    textColor:  'var(--accent-blue)',
    borderColor:'rgba(25,118,210,0.3)',
    bgColor:    'rgba(25,118,210,0.04)',
    label:      'AI Agent',
    filterKey:  'AI_AGENT',
    FilterIcon: Bot,
  },
}

const AGENT_ICONS = {
  MonitoringAgent:              '🔬',
  CropAdvisoryAgent:            '🌾',
  IrrigationAgent:              '💧',
  LandReclamationAgent:         '🌱',
  FarmerAlertAgent:             '🚨',
  CoastalFarmlandHealthAgent:   '🏝️',
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

  const statusColor = event.status === 'COMPLETED' ? 'var(--risk-low)'
    : event.status === 'FAILED'  ? 'var(--risk-high)'
    : event.status === 'RUNNING' ? 'var(--risk-medium)'
    : 'var(--text-muted)'

  const statusIcon  = event.status === 'COMPLETED' ? '✓'
    : event.status === 'FAILED'  ? '✗'
    : event.status === 'RUNNING' ? '⟳'
    : '○'

  return (
    <div style={{ position: 'relative' }}>
      {/* Connector line */}
      {!isLast && (
        <div style={{ position: 'absolute', left: 24, top: 48, bottom: 0, width: 1, zIndex: 0, background: 'var(--border)' }} />
      )}

      <div style={{ position: 'relative', display: 'flex', gap: '1rem', zIndex: 1 }}>
        {/* Icon bubble */}
        <div style={{
          flexShrink: 0, width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.125rem',
          background: 'var(--bg-card)',
          border: `1px solid ${cfg.borderColor}`,
        }}>
          {agentIcon}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, marginBottom: '0.75rem', borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${cfg.borderColor}`,
          background: cfg.bgColor,
        }}>
          <button
            style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => setExpanded(e => !e)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: cfg.textColor }}>{event.agent}</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: statusColor }}>{statusIcon} {event.status}</span>
                {event.type === 'READING' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(45,212,191,0.12)', color: 'var(--accent-seafoam)', padding: '0.125rem 0.5rem', borderRadius: 4, border: '1px solid rgba(45,212,191,0.25)' }}>NEW DATA</span>
                )}
                {event.type === 'RISK_ASSESSMENT' && (
                  <span style={{ fontSize: '0.75rem', background: 'rgba(230,162,60,0.12)', color: 'var(--risk-medium)', padding: '0.125rem 0.5rem', borderRadius: 4, border: '1px solid rgba(230,162,60,0.25)' }}>RISK ENGINE</span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{event.summary}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{formatTime(event.timestamp)}</p>
            </div>
            <div style={{ flexShrink: 0, marginTop: 4, color: 'var(--text-muted)' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </button>

          {expanded && (
            <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Why was this triggered?</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{event.trigger}</p>
              </div>
              {event.detail && Object.keys(event.detail).length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Input Data</p>
                  <div style={{ background: 'var(--bg-base)', borderRadius: 6, padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }} className="space-y-1">
                    {Object.entries(event.detail)
                      .filter(([k]) => k !== 'status' && k !== 'agentName')
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span style={{ color: 'var(--text-muted)', minWidth: 128 }}>{k}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>
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

const PIPELINE_OVERVIEW_STAGES = [
  { label: 'Data Input',    icon: '📡', key: 'SENSOR' },
  { label: 'Monitoring',   icon: '🔬', key: 'SENSOR' },
  { label: 'Risk Engine',  icon: '⚖️', key: 'RISK' },
  { label: 'Forecast',     icon: '📈', key: 'RISK' },
  { label: 'AI Advisory',  icon: '🤖', key: 'AI_AGENT' },
  { label: 'Alert',        icon: '🚨', key: 'AI_AGENT' },
]

function PipelineOverview({ counts }) {
  const stageActive = [
    counts.SENSOR > 0,
    counts.SENSOR > 0,
    counts.RISK > 0,
    counts.RISK > 0,
    counts.AI_AGENT > 0,
    counts.AI_AGENT > 0,
  ]
  return (
    <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <GitBranch size={13} style={{ color: 'var(--accent-cyan)' }} />
        <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>MULTI-AGENT EXECUTION PIPELINE</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }}>
        {PIPELINE_OVERVIEW_STAGES.map((stage, i) => (
          <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', minWidth: 72 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto 0.375rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
                background: stageActive[i] ? 'rgba(25,230,210,0.12)' : 'var(--bg-elevated)',
                border: stageActive[i] ? '1.5px solid rgba(25,230,210,0.4)' : '1.5px solid var(--border)',
                boxShadow: stageActive[i] ? '0 0 10px rgba(25,230,210,0.2)' : 'none',
              }}>
                {stage.icon}
              </div>
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: stageActive[i] ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.05em' }}>{stage.label}</div>
              <div style={{ fontSize: '0.5rem', color: stageActive[i] ? 'var(--accent-cyan)' : 'var(--text-disabled)', marginTop: 2, fontWeight: 700 }}>
                {stageActive[i] ? '✓ ACTIVE' : '○ READY'}
              </div>
            </div>
            {i < PIPELINE_OVERVIEW_STAGES.length - 1 && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
                <div style={{ width: 12, height: 1, background: stageActive[i] ? 'var(--accent-cyan)' : 'var(--border)', opacity: 0.5 }} />
                <ChevronRight size={10} style={{ color: stageActive[i] ? 'var(--accent-cyan)' : 'var(--border)', opacity: 0.5 }} />
              </div>
            )}
          </div>
        ))}
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <GitBranch style={{ color: 'var(--accent-seafoam)' }} size={22} /> AI Decision Trace
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Complete agent execution history — from reading to advisory</p>
        </div>
        <LiveBadge />
      </div>

      {/* ── Farm selector + refresh ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Farm:</label>
        <select
          className="form-input"
          style={{ minWidth: 192 }}
          value={farmId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {farms.map(f => (
            <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          style={{ fontSize: '0.75rem', color: 'var(--accent-seafoam)', cursor: 'pointer', background: 'none', border: 'none' }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label, Icon }) => {
          const isActive  = activeFilter === key
          const count     = counts[key]

          // Active filter colours use the risk/accent system vars so they
          // remain readable in both dark and light themes.
          const btnStyle = isActive
            ? key === 'ALL'
              ? { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
              : key === 'SENSOR'
                ? { background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.4)', color: 'var(--accent-seafoam)' }
                : key === 'RISK'
                  ? { background: 'rgba(230,162,60,0.12)', border: '1px solid rgba(230,162,60,0.4)', color: 'var(--risk-medium)' }
                  : { background: 'rgba(25,118,210,0.12)', border: '1px solid rgba(25,118,210,0.4)', color: 'var(--accent-blue)' }
            : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }

          const badgeStyle = isActive
            ? key === 'ALL'
              ? { background: 'var(--bg-base)', color: 'var(--text-secondary)' }
              : key === 'SENSOR'
                ? { background: 'rgba(45,212,191,0.15)', color: 'var(--accent-seafoam)' }
                : key === 'RISK'
                  ? { background: 'rgba(230,162,60,0.15)', color: 'var(--risk-medium)' }
                  : { background: 'rgba(25,118,210,0.15)', color: 'var(--accent-blue)' }
            : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.75rem', borderRadius: 8,
                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.15s',
                ...btnStyle,
              }}
            >
              <Icon size={13} />
              <span>{label}</span>
              <span style={{
                marginLeft: 2, padding: '0.125rem 0.375rem', borderRadius: 999,
                fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: 1,
                ...badgeStyle,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Pipeline overview */}
      {!isLoading && allEvents.length > 0 && (
        <PipelineOverview counts={counts} />
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem 0', textAlign: 'center' }}>Loading decision trace…</div>
      )}

      {/* ── No events at all ───────────────────────────────────────────────── */}
      {!isLoading && allEvents.length === 0 && (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <GitBranch size={32} className="mx-auto mb-3 opacity-30" />
          <p>No agent activity recorded yet for this farm.</p>
          <p className="text-xs mt-2">Submit a reading to trigger the AI agent pipeline.</p>
        </div>
      )}

      {/* ── Filtered empty state (events exist, but none match filter) ─────── */}
      {!isLoading && allEvents.length > 0 && filteredEvents.length === 0 && (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <activeFilterDef.Icon size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{activeFilterDef.emptyMsg}</p>
          <button
            onClick={() => setActiveFilter('ALL')}
            style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-seafoam)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
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
                  <Zap size={14} style={{ color: 'var(--risk-medium)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Agent Session — {formatTime(sessionTime)}
                  </span>
                  {riskDetail?.riskLevel && (
                    <span style={{
                      fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: 999, fontWeight: 500,
                      ...(riskDetail.riskLevel === 'CRITICAL' ? { background: 'rgba(200,62,77,0.15)',  color: 'var(--risk-critical)' }
                        : riskDetail.riskLevel === 'HIGH'   ? { background: 'rgba(228,87,86,0.15)',  color: 'var(--risk-high)' }
                        : riskDetail.riskLevel === 'MEDIUM' ? { background: 'rgba(230,162,60,0.15)', color: 'var(--risk-medium)' }
                        :                                     { background: 'rgba(63,174,90,0.15)',  color: 'var(--risk-low)' })
                    }}>
                      {riskDetail.riskLevel}
                    </span>
                  )}
                  {/* Active filter label when a sub-filter is selected */}
                  {activeFilter !== 'ALL' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      ({activeFilterDef.label} only)
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
