import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Waves, MapPin, AlertTriangle, Plus, GitBranch, TrendingUp,
  FlaskConical, Map, ChevronRight, Activity, CheckCircle,
  AlertCircle, XCircle, Heart, Cpu, Radio, Zap, Eye, Shield,
  Leaf, Droplets, BarChart2, ArrowUpRight
} from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AddFarmModal } from '../components/AddFarmModal.jsx'
import { RiskBadge, TrendBadge, LiveBadge } from '../components/ui/Badges.jsx'
import LeafletRiskMap from '../components/LeafletRiskMap.jsx'
import { formatTime, formatSensor } from '../lib/utils.js'
import { api } from '../lib/api.js'

// ── Inline helpers ────────────────────────────────────────────────────────────

function riskColor(level) {
  return {
    LOW:      '#45D483',
    MEDIUM:   '#F5B942',
    HIGH:     '#FF554D',
    CRITICAL: '#FF2D78',
  }[level] || 'var(--text-muted)'
}

function riskBg(level) {
  return {
    LOW:      'rgba(69,212,131,0.08)',
    MEDIUM:   'rgba(245,185,66,0.08)',
    HIGH:     'rgba(255,85,77,0.08)',
    CRITICAL: 'rgba(255,45,120,0.08)',
  }[level] || 'var(--bg-elevated)'
}

function riskBorder(level) {
  return {
    LOW:      'rgba(69,212,131,0.25)',
    MEDIUM:   'rgba(245,185,66,0.25)',
    HIGH:     'rgba(255,85,77,0.25)',
    CRITICAL: 'rgba(255,45,120,0.3)',
  }[level] || 'var(--border)'
}

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// ── GraniteStatusBadge ────────────────────────────────────────────────────────

function GraniteStatusBadge() {
  const { data } = useQuery({
    queryKey: ['ai-health'],
    queryFn: api.health.granite,
    refetchInterval: 30000,
    retry: false,
  })
  const online = data?.status === 'ok' || data?.granite === true
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase',
      padding: '0.2rem 0.6rem', borderRadius: 999,
      background: online ? 'rgba(69,212,131,0.1)' : 'rgba(245,185,66,0.1)',
      color: online ? '#45D483' : '#F5B942',
      border: `1px solid ${online ? 'rgba(69,212,131,0.3)' : 'rgba(245,185,66,0.3)'}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {online ? 'IBM Granite Online' : 'AI Connecting…'}
    </span>
  )
}

// ── Situation Hero — most critical farm ────────────────────────────────────────

function SituationHero({ farms, onNavigate }) {
  const mostCritical = farms
    .filter(f => f.riskAssessments?.length > 0)
    .sort((a, b) => {
      const la = SEV_ORDER[a.riskAssessments[0]?.riskLevel] ?? 5
      const lb = SEV_ORDER[b.riskAssessments[0]?.riskLevel] ?? 5
      if (la !== lb) return la - lb
      return (b.riskAssessments[0]?.riskScore ?? 0) - (a.riskAssessments[0]?.riskScore ?? 0)
    })[0]

  if (!mostCritical) {
    return (
      <div className="card-hero" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CheckCircle size={28} style={{ color: '#45D483', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>All farms are healthy</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>No farms require immediate attention</div>
        </div>
      </div>
    )
  }

  const risk = mostCritical.riskAssessments[0]
  const reading = mostCritical.readings?.[0]
  const level = risk.riskLevel
  const col = riskColor(level)
  const attentionCount = farms.filter(f => ['HIGH','CRITICAL'].includes(f.riskAssessments?.[0]?.riskLevel)).length

  return (
    <div className="card-hero" style={{ padding: '1.375rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${col}15`, border: `1.5px solid ${col}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={20} style={{ color: col }} />
          </div>
          {/* Text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: col }}>⚡ AI SITUATION</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '1px 8px' }}>
                {attentionCount} farm{attentionCount !== 1 ? 's' : ''} require{attentionCount === 1 ? 's' : ''} attention
              </span>
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {mostCritical.farmName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{mostCritical.district} · {mostCritical.currentCrop || 'Unknown crop'} · {mostCritical.landArea} ha</div>
          </div>
        </div>

        {/* Risk score + metrics */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Risk score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: col, lineHeight: 1, letterSpacing: '-0.04em', fontFamily: 'monospace' }}>
              {risk.riskScore}
            </div>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Risk Score</div>
            <RiskBadge level={level} />
          </div>

          {/* Metric pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {reading?.soilEC != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil EC</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: col }}>{formatSensor('soilEC', reading.soilEC)} dS/m</span>
              </div>
            )}
            {risk.trendChangePercent != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EC Change</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: risk.trendChangePercent > 0 ? '#FF554D' : '#45D483' }}>
                  {risk.trendChangePercent > 0 ? '+' : ''}{risk.trendChangePercent}%
                </span>
              </div>
            )}
            {risk.trend && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trend</span>
                <TrendBadge trend={risk.trend} />
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => onNavigate(`/farms/${mostCritical.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: col, color: level === 'LOW' ? '#06110E' : '#ffffff',
              padding: '0.625rem 1.25rem', borderRadius: 10,
              fontWeight: 700, fontSize: '0.8125rem', border: 'none', cursor: 'pointer',
              letterSpacing: '0.02em', whiteSpace: 'nowrap',
              boxShadow: `0 4px 16px ${col}30`,
              transition: 'transform 0.1s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${col}45` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${col}30` }}
          >
            <ArrowUpRight size={15} />
            View Farm Intelligence
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Farm Health Panel ──────────────────────────────────────────────────────────

function FarmHealthPanel({ farms }) {
  const assessed = farms.filter(f => f.riskAssessments?.length > 0)
  if (!assessed.length) return null

  const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  assessed.forEach(f => { const l = f.riskAssessments[0].riskLevel; if (counts[l] !== undefined) counts[l]++ })
  const total = assessed.length
  const avgScore = Math.round(assessed.reduce((s, f) => s + (f.riskAssessments[0].riskScore || 0), 0) / total)
  const overallLevel = counts.CRITICAL > 0 ? 'CRITICAL' : counts.HIGH > 0 ? 'HIGH' : counts.MEDIUM > 0 ? 'MEDIUM' : 'LOW'
  const healthScore = Math.max(0, 100 - avgScore)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Heart size={13} style={{ color: '#45D483' }} />
        <span className="section-label" style={{ color: '#45D483' }}>FARM HEALTH</span>
      </div>

      {/* Health score */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, color: riskColor(overallLevel), lineHeight: 1, fontFamily: 'monospace' }}>
          {healthScore}
        </div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>/100</div>
          <RiskBadge level={overallLevel} />
        </div>
      </div>

      {/* Distribution bar */}
      <div className="health-bar-wrap">
        {Object.entries(counts).map(([lvl, cnt]) => cnt > 0 && (
          <div key={lvl} className="health-bar-seg"
            style={{ flex: cnt, background: riskColor(lvl), opacity: 0.85 }}
            title={`${lvl}: ${cnt} farm${cnt !== 1 ? 's' : ''}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {Object.entries(counts).map(([lvl, cnt]) => (
          <div key={lvl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: riskColor(lvl), display: 'inline-block' }} />
              <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.05em' }}>{lvl}</span>
            </div>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: cnt > 0 ? riskColor(lvl) : 'var(--text-disabled)' }}>{cnt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Insight Panel ──────────────────────────────────────────────────────────

function CoastalHealthCard({ farmId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['coastal-health', farmId],
    queryFn: () => api.analytics.health(farmId),
    enabled: !!farmId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return (
    <div className="ai-insight-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <span style={{ color: '#20D9C5', fontSize: '0.875rem' }}>✦</span>
        <span className="section-label" style={{ color: '#20D9C5' }}>AI INSIGHT</span>
      </div>
      {isLoading && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Generating insight…</div>
      )}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.summary && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {data.summary}
            </p>
          )}
          {data.recommendation && (
            <div style={{ padding: '0.625rem 0.75rem', background: 'rgba(69,212,131,0.06)', border: '1px solid rgba(69,212,131,0.15)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#45D483', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recommended Action</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{data.recommendation}</p>
            </div>
          )}
          {data.confidence != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>AI Confidence</span>
              <div style={{ flex: 1, height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#20D9C5', width: `${data.confidence}%`, borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#20D9C5', fontWeight: 700 }}>{data.confidence}%</span>
            </div>
          )}
        </div>
      )}
      {!isLoading && !data && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Select a farm to generate an AI coastal health insight using IBM Granite.
        </p>
      )}
    </div>
  )
}

// ── FarmCard for bottom grid ──────────────────────────────────────────────────

function FarmCard({ farm, onNavigate }) {
  const risk = farm.riskAssessments?.[0]
  const reading = farm.readings?.[0]
  const level = risk?.riskLevel || 'UNKNOWN'
  const col = riskColor(level)

  return (
    <div
      className="card hover-lift"
      style={{
        padding: '1.125rem',
        cursor: 'pointer',
        borderTop: `2px solid ${col}`,
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onClick={() => onNavigate(`/farms/${farm.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{farm.farmName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{farm.district} · {farm.currentCrop || '—'} · {farm.landArea} ha</div>
        </div>
        <RiskBadge level={level} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Risk Score</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: col, fontFamily: 'monospace', lineHeight: 1.2 }}>{risk?.riskScore ?? '—'}</div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.5rem 0.625rem' }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Soil EC</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1.2 }}>
            {reading?.soilEC != null ? `${formatSensor('soilEC', reading.soilEC)}` : '—'}
          </div>
        </div>
      </div>
      {risk && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.625rem' }}>
          <TrendBadge trend={risk.trend} />
          <span style={{ fontSize: '0.625rem', color: 'var(--accent-cyan)' }}>
            {reading ? formatTime(reading.timestamp) : 'No readings'}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Agent Pipeline ────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: 'SENSOR',    icon: Radio,       color: '#20D9C5', desc: 'Data ingest' },
  { label: 'DETECT',    icon: Eye,         color: '#45D483', desc: 'Anomaly scan' },
  { label: 'ASSESS',    icon: Shield,      color: '#F5B942', desc: 'Risk engine' },
  { label: 'FORECAST',  icon: TrendingUp,  color: '#A78BFA', desc: 'Projection' },
  { label: 'RECOMMEND', icon: Cpu,         color: '#45D483', desc: 'IBM Granite' },
  { label: 'ALERT',     icon: AlertTriangle, color: '#FF554D', desc: 'Notification' },
]

function AgentPipeline({ farms }) {
  const hasReadings   = farms.some(f => f.readings?.length > 0)
  const hasRisk       = farms.some(f => f.riskAssessments?.length > 0)
  const hasAdvisories = farms.some(f => f.advisories?.length > 0)
  const hasAlerts     = farms.some(f => f.alerts?.some(a => a.status === 'ACTIVE'))
  const stageActive   = [hasReadings, hasReadings, hasRisk, hasRisk, hasAdvisories, hasAlerts]

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Zap size={13} style={{ color: '#45D483' }} />
        <span className="section-label" style={{ color: '#45D483' }}>AI AGENT PIPELINE</span>
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', marginLeft: 'auto', letterSpacing: '0.05em' }}>MULTI-AGENT ORCHESTRATION</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon
          const active = stageActive[i]
          return (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', minWidth: 76 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: `1.5px solid ${active ? stage.color : stage.color + '30'}`,
                  background: active ? `${stage.color}15` : `${stage.color}06`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.375rem',
                  boxShadow: active ? `0 0 10px ${stage.color}30` : 'none',
                  transition: 'box-shadow 0.3s',
                }}>
                  <Icon size={14} style={{ color: active ? stage.color : stage.color + '50' }} />
                </div>
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: active ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.06em' }}>{stage.label}</div>
                <div style={{ fontSize: '0.5rem', color: active ? 'var(--text-muted)' : 'var(--text-disabled)', marginTop: 1 }}>{stage.desc}</div>
                <span style={{ fontSize: '0.5rem', color: active ? stage.color : 'var(--text-disabled)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {active ? '● ACTIVE' : '○ READY'}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', margin: '0 2px', marginBottom: 28 }}>
                  <div style={{ width: 12, height: 1, background: stageActive[i] ? '#45D483' : 'var(--border)', opacity: stageActive[i] ? 0.6 : 0.3 }} />
                  <ChevronRight size={10} style={{ color: stageActive[i] ? '#45D483' : 'var(--border)', opacity: stageActive[i] ? 0.6 : 0.3, flexShrink: 0 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading } = useFarms()
  const [addOpen, setAddOpen]           = useState(false)
  const [selectedFarmId, setSelectedFarmId] = useState(null)

  // most critical farm for AI insight
  const mostCritical = farms
    .filter(f => f.riskAssessments?.length > 0)
    .sort((a, b) => {
      const la = SEV_ORDER[a.riskAssessments[0]?.riskLevel] ?? 5
      const lb = SEV_ORDER[b.riskAssessments[0]?.riskLevel] ?? 5
      return la !== lb ? la - lb : (b.riskAssessments[0]?.riskScore ?? 0) - (a.riskAssessments[0]?.riskScore ?? 0)
    })[0]

  const activeAlerts = farms.reduce((n, f) => n + (f.alerts?.filter(a => a.status === 'ACTIVE').length || 0), 0)

  const insightFarmId = selectedFarmId || mostCritical?.id

  return (
    <div
      style={{
        padding: '1.5rem',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 15% 40%, rgba(69,212,131,0.035) 0%, transparent 55%), radial-gradient(ellipse at 85% 10%, rgba(32,217,197,0.025) 0%, transparent 45%)',
      }}
      className="page-enter"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(69,212,131,0.1)', border: '1px solid rgba(69,212,131,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Waves size={20} style={{ color: '#45D483' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em' }}>Salinity Shield AI</h1>
              <GraniteStatusBadge />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>Coastal Farmland Intelligence Center · Gujarat</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <LiveBadge />
          <button className="btn-primary" style={{ gap: '0.375rem', fontSize: '0.8125rem' }} onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Farm
          </button>
        </div>
      </div>

      {/* ── Situation Hero ──────────────────────────────────────────────────── */}
      {!isLoading && (
        <div style={{ marginBottom: '1.25rem' }}>
          <SituationHero farms={farms} onNavigate={navigate} />
        </div>
      )}

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Farms', value: farms.length, color: '#45D483', icon: MapPin },
          { label: 'At Risk', value: farms.filter(f => ['HIGH','CRITICAL'].includes(f.riskAssessments?.[0]?.riskLevel)).length, color: '#FF554D', icon: AlertTriangle },
          { label: 'Active Alerts', value: activeAlerts, color: '#FF2D78', icon: AlertCircle },
          { label: 'AI Readings', value: farms.reduce((n, f) => n + (f.readings?.length || 0), 0), color: '#20D9C5', icon: Activity },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-strip-item">
              <Icon size={14} style={{ color: s.color, marginBottom: 2 }} />
              <div className="stat-strip-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-strip-label">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* ── Map + Right Sidebar ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem', marginBottom: '1.25rem', alignItems: 'start' }}>
        {/* Map */}
        <div className="card" style={{ height: 420, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#45D483', background: 'rgba(9,26,21,0.85)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(69,212,131,0.2)', backdropFilter: 'blur(4px)' }}>◈ LIVE RISK MAP</span>
          </div>
          <LeafletRiskMap
            farms={farms}
            selectedFarm={selectedFarmId}
            onFarmSelect={(id) => setSelectedFarmId(id)}
            onViewDetails={(id) => navigate(`/farms/${id}`)}
            style={{ height: '100%', width: '100%', borderRadius: 12 }}
          />
        </div>

        {/* Right sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* AI Insight */}
          {insightFarmId && <CoastalHealthCard farmId={insightFarmId} />}

          {/* Farm Health */}
          <div className="card" style={{ padding: '1.125rem' }}>
            <FarmHealthPanel farms={farms} />
          </div>

          {/* Quick nav */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <BarChart2 size={13} style={{ color: '#45D483' }} />
              <span className="section-label" style={{ color: '#45D483' }}>QUICK ACCESS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { icon: TrendingUp,   label: 'Salinity Forecast', path: '/forecast',       color: '#A78BFA' },
                { icon: FlaskConical, label: 'What-If Simulator',  path: '/what-if',        color: '#20D9C5' },
                { icon: Cpu,         label: 'AI Farm Advisor',    path: '/advisory',       color: '#45D483' },
                { icon: Map,         label: 'Risk Heatmap',       path: '/heatmap',        color: '#F5B942' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <button key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.375rem', borderRadius: 7, textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <Icon size={13} style={{ color: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <ChevronRight size={11} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Farm cards grid ─────────────────────────────────────────────────── */}
      {farms.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Leaf size={13} style={{ color: '#45D483' }} />
              <span className="section-label" style={{ color: '#45D483' }}>FARM INTELLIGENCE</span>
            </div>
            <button className="btn-ghost" onClick={() => navigate('/farms')} style={{ gap: '0.25rem', fontSize: '0.8125rem' }}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
            {farms.slice(0, 4).map(farm => (
              <FarmCard key={farm.id} farm={farm} onNavigate={navigate} />
            ))}
          </div>
        </div>
      )}

      {/* ── Agent Pipeline ──────────────────────────────────────────────────── */}
      <AgentPipeline farms={farms} />

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={24} style={{ margin: '0 auto 0.75rem', opacity: 0.4, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.875rem' }}>Loading farm intelligence…</div>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!isLoading && farms.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Leaf size={32} style={{ color: '#45D483', margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>No farms registered</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Add your first farm to start monitoring coastal salinity.</p>
          <button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Your First Farm</button>
        </div>
      )}

      {addOpen && <AddFarmModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}
