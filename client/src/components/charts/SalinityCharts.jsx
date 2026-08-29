import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { formatDate } from '../../lib/utils.js'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{label}</p>
      {payload.map(entry => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: entry.color }}>●</span>
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span style={{ color: entry.color, fontWeight: 600 }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SalinityTrendChart({ readings }) {
  const data = (readings || []).slice(-60).map(r => ({
    date: new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    'Soil EC':     r.soilEC,
    'GW EC':       r.groundwaterEC,
    'TDS (÷100)':  Math.round(r.tds / 100),
  }))

  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No reading data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="soilEC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--risk-high)"      stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--risk-high)"      stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gwEC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent-seafoam)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--accent-seafoam)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
          label={{ value: 'dS/m', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
        <Area type="monotone" dataKey="Soil EC" stroke="var(--risk-high)"      fill="url(#soilEC)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="GW EC"   stroke="var(--accent-seafoam)" fill="url(#gwEC)"   strokeWidth={2} dot={false} />
        <Line  type="monotone" dataKey="TDS (÷100)" stroke="var(--risk-medium)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RiskScoreChart({ riskAssessments }) {
  const data = (riskAssessments || []).slice(-30).reverse().map(r => ({
    date: new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    'Risk Score': r.riskScore,
    level: r.riskLevel,
  }))

  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assessment data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="riskScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--risk-medium)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--risk-medium)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="Risk Score" stroke="var(--risk-medium)" fill="url(#riskScore)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
