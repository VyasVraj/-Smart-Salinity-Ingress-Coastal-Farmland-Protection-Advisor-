import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { formatDate } from '../../lib/utils.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <span style={{ color: entry.color }}>●</span>
          <span className="text-gray-300">{entry.name}:</span>
          <span style={{ color: entry.color }} className="font-semibold">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Soil EC + Groundwater EC over time
 */
export function SalinityTrendChart({ readings }) {
  const data = (readings || []).slice(-60).map(r => ({
    date: new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    'Soil EC': r.soilEC,
    'GW EC': r.groundwaterEC,
    'TDS (÷100)': Math.round(r.tds / 100),
  }))

  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-gray-600">No reading data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="soilEC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gwEC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        <Area type="monotone" dataKey="Soil EC" stroke="#ef4444" fill="url(#soilEC)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="GW EC" stroke="#3b82f6" fill="url(#gwEC)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="TDS (÷100)" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/**
 * Risk Score over time
 */
export function RiskScoreChart({ riskAssessments }) {
  const data = (riskAssessments || []).slice(-30).reverse().map(r => ({
    date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    'Risk Score': r.riskScore,
    level: r.riskLevel,
  }))

  if (!data.length) return (
    <div className="flex items-center justify-center h-40 text-gray-600">No assessment data yet</div>
  )

  const getColor = (score) => {
    if (score < 25) return '#22c55e'
    if (score < 50) return '#f59e0b'
    if (score < 75) return '#ef4444'
    return '#7c3aed'
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="riskScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="Risk Score" stroke="#f59e0b" fill="url(#riskScore)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
