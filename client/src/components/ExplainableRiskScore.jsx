/**
 * Explainable Risk Score Component — Feature 3
 * Shows risk factor breakdown with a "Why?" panel
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HelpCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '../lib/api.js'
import { RiskBadge, TrendBadge } from './ui/Badges.jsx'

const DIRECTION_COLOR = {
  negative: 'var(--risk-high)',
  positive: 'var(--risk-low)',
  neutral:  'var(--text-muted)',
}

function FactorBar({ factor }) {
  const maxContrib = 50
  const pct = Math.min(100, Math.abs(factor.contribution) / maxContrib * 100)
  const color = DIRECTION_COLOR[factor.direction]

  return (
    <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }} className="last:border-0">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{factor.factor}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{factor.value}</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', width: 32, textAlign: 'right',
            color: factor.direction === 'negative' ? 'var(--risk-high)'
              : factor.direction === 'positive' ? 'var(--risk-low)'
              : 'var(--text-muted)',
          }}>
            {factor.contribution > 0 ? '+' : ''}{factor.contribution}
          </span>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function HistorySparkline({ values, label }) {
  if (!values || values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 200, H = 40, pad = 4

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const increasing = values[values.length - 1] > values[0]
  const lineColor = increasing ? 'var(--risk-high)' : 'var(--risk-low)'

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {values.map((v, i) => (
            <span key={i} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{v}</span>
          )).reduce((acc, el, i, arr) => i < arr.length - 1 ? [...acc, el, <span key={`a${i}`} style={{ color: 'var(--text-muted)' }}>→</span>] : [...acc, el], [])}
          {increasing
            ? <TrendingUp size={12} style={{ color: 'var(--risk-high)', marginLeft: 4 }} />
            : <TrendingDown size={12} style={{ color: 'var(--risk-low)', marginLeft: 4 }} />}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 40 }}>
        <polyline points={points} fill="none" stroke={lineColor} strokeWidth={2} />
        {values.map((v, i) => {
          const x = pad + (i / (values.length - 1)) * (W - pad * 2)
          const y = H - pad - ((v - min) / range) * (H - pad * 2)
          return <circle key={i} cx={x} cy={y} r={3} fill={lineColor} />
        })}
      </svg>
    </div>
  )
}

export function ExplainableRiskScore({ farmId }) {
  const [showWhy, setShowWhy] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['risk-explanation', farmId],
    queryFn: () => api.analytics.riskExplanation(farmId),
    enabled: !!farmId,
    refetchInterval: 30000,
  })

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '1rem 0', textAlign: 'center' }}>Loading risk analysis...</div>
  if (!data) return null

  const ringColor = data.riskLevel === 'CRITICAL' ? 'var(--risk-critical)'
    : data.riskLevel === 'HIGH' ? 'var(--risk-high)'
    : data.riskLevel === 'MEDIUM' ? 'var(--risk-medium)'
    : 'var(--risk-low)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Score display */}
      <div className="card p-5">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Coastal Risk Score</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{data.riskScore}</span>
              <span style={{ color: 'var(--text-muted)', marginBottom: 4 }}>/ 100</span>
              <RiskBadge level={data.riskLevel} size="lg" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <TrendBadge trend={data.trend} />
              {data.trendChangePercent !== 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({data.trendChangePercent > 0 ? '+' : ''}{data.trendChangePercent}% from baseline)</span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-elevated)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={ringColor}
                strokeWidth="3"
                strokeDasharray={`${data.riskScore} ${100 - data.riskScore}`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.riskScore}%</span>
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div style={{ marginTop: '1rem' }}>
          {data.factors.map((f, i) => <FactorBar key={i} factor={f} />)}
        </div>

        {/* Why button */}
        <button
          onClick={() => setShowWhy(w => !w)}
          style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-seafoam)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <HelpCircle size={14} />
          {showWhy ? 'Hide' : 'Why is my farm at risk?'}
          {showWhy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Why panel */}
      {showWhy && (
        <div className="card p-5" style={{ border: '1px solid rgba(45,212,191,0.2)', background: 'rgba(45,212,191,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-seafoam)', margin: 0 }}>Evidence — What's driving the risk?</h3>

          {data.historyData && (
            <div>
              <HistorySparkline values={data.historyData.soilEC}       label="Soil EC (dS/m) — recent readings" />
              <HistorySparkline values={data.historyData.groundwaterEC} label="Groundwater EC (dS/m) — recent readings" />
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Factor Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.factors.map((f, i) => (
                <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.factor}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{f.threshold}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{f.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {data.graniteExplanation && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🧠 AI Summary</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{data.graniteExplanation}</p>
            </div>
          )}

          {!data.graniteExplanation && data.reasoningSummary && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Risk Summary</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{data.reasoningSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
