/**
 * Explainable Risk Score Component — Feature 3
 * Shows risk factor breakdown with a "Why?" panel
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HelpCircle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { api } from '../lib/api.js'
import { RiskBadge, TrendBadge } from './ui/Badges.jsx'

const BAR_COLORS = {
  negative: '#ef4444',
  positive: '#22c55e',
  neutral:  '#6b7280',
}

function FactorBar({ factor }) {
  const maxContrib = 50
  const pct = Math.min(100, Math.abs(factor.contribution) / maxContrib * 100)
  const color = BAR_COLORS[factor.direction]

  return (
    <div className="py-2 border-b border-gray-800/50 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{factor.factor}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{factor.value}</span>
          <span className={`text-xs font-bold font-mono w-8 text-right ${
            factor.direction === 'negative' ? 'text-red-400' :
            factor.direction === 'positive' ? 'text-green-400' : 'text-gray-500'
          }`}>
            {factor.contribution > 0 ? '+' : ''}{factor.contribution}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
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

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          {values.map((v, i) => (
            <span key={i} className="text-xs font-mono text-gray-400">{v}</span>
          )).reduce((acc, el, i, arr) => i < arr.length - 1 ? [...acc, el, <span key={`a${i}`} className="text-gray-700">→</span>] : [...acc, el], [])}
          {increasing
            ? <TrendingUp size={12} className="text-red-400 ml-1" />
            : <TrendingDown size={12} className="text-green-400 ml-1" />}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 40 }}>
        <polyline points={points} fill="none" stroke={increasing ? '#ef4444' : '#22c55e'} strokeWidth={2} />
        {values.map((v, i) => {
          const x = pad + (i / (values.length - 1)) * (W - pad * 2)
          const y = H - pad - ((v - min) / range) * (H - pad * 2)
          return <circle key={i} cx={x} cy={y} r={3} fill={increasing ? '#ef4444' : '#22c55e'} />
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

  if (isLoading) return <div className="text-gray-600 text-xs py-4 text-center">Loading risk analysis...</div>
  if (!data) return null

  const totalPositive = data.factors.filter(f => f.direction === 'negative').reduce((s, f) => s + f.contribution, 0)

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Coastal Risk Score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold text-white">{data.riskScore}</span>
              <span className="text-gray-500 mb-1">/ 100</span>
              <RiskBadge level={data.riskLevel} size="lg" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendBadge trend={data.trend} />
              {data.trendChangePercent !== 0 && (
                <span className="text-xs text-gray-500">({data.trendChangePercent > 0 ? '+' : ''}{data.trendChangePercent}% from baseline)</span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={data.riskLevel === 'CRITICAL' ? '#7c3aed' : data.riskLevel === 'HIGH' ? '#ef4444' : data.riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e'}
                strokeWidth="3"
                strokeDasharray={`${data.riskScore} ${100 - data.riskScore}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{data.riskScore}%</span>
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="mt-4">
          {data.factors.map((f, i) => <FactorBar key={i} factor={f} />)}
        </div>

        {/* Why button */}
        <button
          onClick={() => setShowWhy(w => !w)}
          className="mt-4 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <HelpCircle size={14} />
          {showWhy ? 'Hide' : 'Why is my farm at risk?'}
          {showWhy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Why panel */}
      {showWhy && (
        <div className="card p-5 border-blue-500/20 bg-blue-500/5 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400">Evidence — What's driving the risk?</h3>

          {data.historyData && (
            <div>
              <HistorySparkline values={data.historyData.soilEC}       label="Soil EC (dS/m) — recent readings" />
              <HistorySparkline values={data.historyData.groundwaterEC} label="Groundwater EC (dS/m) — recent readings" />
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Factor Details</p>
            <div className="space-y-2">
              {data.factors.map((f, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-300">{f.factor}</span>
                    <span className="text-gray-500">{f.threshold}</span>
                  </div>
                  <p className="text-gray-400">{f.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {data.graniteExplanation && (
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">🧠 AI Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{data.graniteExplanation}</p>
            </div>
          )}

          {!data.graniteExplanation && data.reasoningSummary && (
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Risk Summary</p>
              <p className="text-sm text-gray-300">{data.reasoningSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
