/**
 * Salinity Forecast + Time-to-Critical — Feature 5
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, ResponsiveContainer } from 'recharts'
import { useFarms } from '../hooks/useFarm.js'
import { api } from '../lib/api.js'
import { RiskBadge } from '../components/ui/Badges.jsx'

const RISK_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed' }

function ProgressBar({ value, max = 100, color = '#3b82f6', label }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{label}</span><span>{value}</span></div>}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function TimeToCriticalCard({ timeToCriticalDays, currentRiskLevel, alreadyCritical, projection30 }) {
  if (alreadyCritical) {
    return (
      <div className="card p-5 border-purple-500/40 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-purple-400" />
          <h3 className="font-semibold text-purple-400">Already Critical</h3>
        </div>
        <p className="text-sm text-gray-400">Farm is at CRITICAL risk. Immediate intervention is required.</p>
      </div>
    )
  }

  if (timeToCriticalDays === null) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={18} className="text-green-400" />
          <h3 className="font-semibold text-gray-300">Time to Critical</h3>
        </div>
        <p className="text-sm text-gray-500">
          {currentRiskLevel === 'LOW'
            ? 'Farm is at low risk. No critical trajectory detected under current trend.'
            : 'Trend is stable or improving. No critical trajectory detected.'}
        </p>
        <p className="text-xs text-gray-600 mt-2">Model estimate based on current trend.</p>
      </div>
    )
  }

  const urgency = timeToCriticalDays <= 14 ? 'red' : timeToCriticalDays <= 30 ? 'amber' : 'blue'
  const barPct = Math.max(5, Math.min(100, (1 - timeToCriticalDays / 90) * 100))

  return (
    <div className={`card p-5 border-${urgency}-500/30 bg-${urgency}-500/5`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} className={`text-${urgency}-400`} />
        <h3 className={`font-semibold text-${urgency}-400`}>Estimated Time to Critical</h3>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-bold text-${urgency}-400`}>≈{timeToCriticalDays}</span>
        <span className="text-gray-400 mb-1">days*</span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full bg-${urgency}-500`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 mb-3">
        <span>Now ({currentRiskLevel})</span>
        <span>→ CRITICAL</span>
      </div>
      <p className="text-xs text-gray-600">
        * Simulation/model estimate if current trend persists. 
        {projection30 && ` 30-day forecast: ${projection30.riskLevel} (${projection30.riskScore}/100).`}
      </p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map(e => (
        <div key={e.name} className="flex items-center gap-2">
          <span style={{ color: e.color }}>●</span>
          <span className="text-gray-300">{e.name}:</span>
          <span style={{ color: e.color }} className="font-semibold">{typeof e.value === 'number' ? e.value.toFixed(2) : e.value}</span>
          {e.payload?.type === 'forecast' && <span className="text-gray-600">(forecast)</span>}
        </div>
      ))}
    </div>
  )
}

export default function ForecastPage() {
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const farmId = selectedId || farms[0]?.id || ''

  const { data: forecast, isLoading } = useQuery({
    queryKey: ['forecast', farmId],
    queryFn: () => api.analytics.forecast(farmId),
    enabled: !!farmId,
  })

  const chartData = [
    ...(forecast?.chartHistory ?? []),
    ...(forecast?.forecastPoints ?? []),
  ]

  const projection30 = forecast?.projections?.find(p => p.days === 30)
  const projection7  = forecast?.projections?.find(p => p.days === 7)
  const projection90 = forecast?.projections?.find(p => p.days === 90)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={22} /> Salinity Forecast
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Linear trend projection based on historical readings.{' '}
          <span className="text-yellow-400">Model estimates — not guaranteed outcomes.</span>
        </p>
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
      </div>

      {isLoading && <div className="text-gray-600 text-center py-12">Loading forecast...</div>}

      {forecast && !forecast.sufficient && (
        <div className="card p-6 text-center border-amber-500/30 bg-amber-500/5">
          <AlertTriangle size={28} className="text-amber-400 mx-auto mb-2" />
          <p className="text-amber-400 font-medium">Insufficient Data</p>
          <p className="text-sm text-gray-400 mt-1">{forecast.message}</p>
          <p className="text-xs text-gray-600 mt-1">Readings available: {forecast.readings}. At least 5 required.</p>
        </div>
      )}

      {forecast?.sufficient && (
        <>
          {/* Current + projections */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Current</p>
              <RiskBadge level={forecast.currentRiskLevel} size="lg" />
              <p className="text-lg font-bold text-white mt-1">{forecast.currentRiskScore}<span className="text-xs text-gray-500">/100</span></p>
            </div>
            {[projection7, projection30, projection90].filter(Boolean).map(p => (
              <div key={p.days} className="card p-4 text-center border-blue-500/20 bg-blue-500/5">
                <p className="text-xs text-gray-500 mb-1">+{p.days} days*</p>
                <RiskBadge level={p.riskLevel} size="lg" />
                <p className="text-lg font-bold text-white mt-1">{p.riskScore}<span className="text-xs text-gray-500">/100</span></p>
              </div>
            ))}
          </div>

          {/* Time to critical */}
          <TimeToCriticalCard
            timeToCriticalDays={forecast.timeToCriticalDays}
            currentRiskLevel={forecast.currentRiskLevel}
            alreadyCritical={forecast.alreadyCritical}
            projection30={projection30}
          />

          {/* Chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Salinity Trend & Forecast</h3>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>━ Historical</span>
                <span className="text-blue-400">╌ Forecast</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'EC (dS/m)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <ReferenceLine x={chartData.find(d => d.type === 'forecast')?.date} stroke="#374151" strokeDasharray="4 2" label={{ value: 'Today', fill: '#6b7280', fontSize: 10 }} />
                <Area type="monotone" dataKey="soilEC"       name="Soil EC"       stroke="#ef4444" fill="url(#soilGrad)" strokeWidth={2} dot={false}
                  strokeDasharray={undefined}
                  connectNulls
                />
                <Area type="monotone" dataKey="groundwaterEC" name="GW EC"         stroke="#3b82f6" fill="url(#gwGrad)"   strokeWidth={2} dot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trend stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Trend Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Soil EC slope</span>
                  <span className={`font-mono ${forecast.trend?.soilECSlope > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {forecast.trend?.soilECSlope > 0 ? '▲' : '▼'} {Math.abs(forecast.trend?.soilECSlope)} dS/m per reading
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">GW EC slope</span>
                  <span className={`font-mono ${forecast.trend?.groundwaterECSlope > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {forecast.trend?.groundwaterECSlope > 0 ? '▲' : '▼'} {Math.abs(forecast.trend?.groundwaterECSlope)} dS/m per reading
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Model confidence</span>
                  <span className="text-gray-300">{forecast.confidence}% ({forecast.confidenceLabel})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Readings used</span>
                  <span className="text-gray-300">{forecast.readingsUsed}</span>
                </div>
              </div>
            </div>

            <div className="card p-4 bg-gray-900/50">
              <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">30-Day Projection</h3>
              {projection30 && (
                <div className="space-y-2">
                  <ProgressBar value={projection30.riskScore} color={RISK_COLOR[projection30.riskLevel] || '#3b82f6'} label="Projected Risk Score" />
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div><p className="text-gray-600">Soil EC</p><p className="text-white font-mono">{projection30.soilEC} dS/m</p></div>
                    <div><p className="text-gray-600">GW EC</p><p className="text-white font-mono">{projection30.groundwaterEC} dS/m</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-600 bg-gray-900 rounded-lg p-3 border border-gray-800">
            {forecast.disclaimer}
          </p>
        </>
      )}
    </div>
  )
}
