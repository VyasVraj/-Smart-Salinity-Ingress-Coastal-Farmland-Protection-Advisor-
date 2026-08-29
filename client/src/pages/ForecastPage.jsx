/**
 * Salinity Forecast + Time-to-Critical — redesigned for coastal theme
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend, ResponsiveContainer } from 'recharts'
import { useFarms } from '../hooks/useFarm.js'
import { api } from '../lib/api.js'
import { RiskBadge } from '../components/ui/Badges.jsx'
import { formatSensor } from '../lib/utils.js'

const RISK_COLOR = { LOW: '#45D483', MEDIUM: '#F5B942', HIGH: '#FF554D', CRITICAL: '#FF2D78' }

function riskCol(level) {
  return RISK_COLOR[level] || 'var(--accent-seafoam)'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{label}</p>
      {payload.map(e => (
        <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: e.color }}>●</span>
          <span style={{ color: 'var(--text-secondary)' }}>{e.name}:</span>
          <span style={{ color: e.color, fontWeight: 600 }}>{typeof e.value === 'number' ? e.value.toFixed(2) : e.value}</span>
          {e.payload?.type === 'forecast' && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(forecast)</span>}
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

  const chartData = [...(forecast?.chartHistory ?? []), ...(forecast?.forecastPoints ?? [])]
  const projection7  = forecast?.projections?.find(p => p.days === 7)
  const projection30 = forecast?.projections?.find(p => p.days === 30)
  const projection90 = forecast?.projections?.find(p => p.days === 90)

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-seafoam)' }} /> Salinity Forecast
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Linear trend projection based on historical readings.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0.15rem 0.55rem', borderRadius: 4, background: 'rgba(69,212,131,0.1)', color: '#45D483', border: '1px solid rgba(69,212,131,0.25)' }}>◌ Model Estimate</span>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0.15rem 0.55rem', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: 'var(--risk-medium)', border: '1px solid rgba(245,158,11,0.25)' }}>⚠ Not Guaranteed</span>
        </div>
      </div>

      {/* Farm selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</label>
        <select className="form-input" style={{ minWidth: 200 }} value={farmId} onChange={e => setSelectedId(e.target.value)}>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading forecast…</div>}

      {forecast && !forecast.sufficient && (
        <div style={{ background: 'rgba(230,162,60,0.08)', border: '1px solid rgba(230,162,60,0.2)', borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
          <AlertTriangle size={24} style={{ color: 'var(--risk-medium)', margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 600, color: 'var(--risk-medium)' }}>Insufficient Data</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{forecast.message}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Readings: {forecast.readings}. At least 5 required.</p>
        </div>
      )}

      {forecast?.sufficient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Current + projections - more visual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
            {/* Current */}
            <div className="card" style={{
              padding: '1rem', textAlign: 'center',
              background: `linear-gradient(135deg, ${riskCol(forecast.currentRiskLevel)}10 0%, var(--bg-card) 100%)`,
              borderColor: `${riskCol(forecast.currentRiskLevel)}30`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: riskCol(forecast.currentRiskLevel), borderRadius: '12px 12px 0 0' }} />
              <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current</div>
              <RiskBadge level={forecast.currentRiskLevel} size="lg" />
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: riskCol(forecast.currentRiskLevel), marginTop: '0.5rem', lineHeight: 1, fontFamily: 'monospace' }}>
                {forecast.currentRiskScore}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>/100</div>
            </div>
            {[projection7, projection30, projection90].filter(Boolean).map(p => (
              <div key={p.days} style={{
                background: `linear-gradient(135deg, ${riskCol(p.riskLevel)}08 0%, var(--bg-card) 100%)`,
                border: `1px solid ${riskCol(p.riskLevel)}25`,
                borderRadius: 12, padding: '1rem', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: riskCol(p.riskLevel), opacity: 0.6 }} />
                <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>+{p.days} Days</div>
                <RiskBadge level={p.riskLevel} size="lg" />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: riskCol(p.riskLevel), marginTop: '0.5rem', lineHeight: 1, fontFamily: 'monospace' }}>
                  {p.riskScore}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>/100</div>
                {/* Mini progress bar */}
                <div style={{ marginTop: '0.5rem', height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: riskCol(p.riskLevel), borderRadius: 99, width: `${p.riskScore}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Time to critical */}
          {forecast.alreadyCritical ? (
            <div style={{ background: 'rgba(200,62,77,0.08)', border: '1px solid rgba(200,62,77,0.25)', borderRadius: 10, padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--risk-critical)' }} />
                <span style={{ fontWeight: 600, color: 'var(--risk-critical)', fontSize: '0.875rem' }}>Already Critical</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Farm is at CRITICAL risk. Immediate intervention is required.</p>
            </div>
          ) : forecast.timeToCriticalDays ? (
            <div style={{ background: forecast.timeToCriticalDays <= 14 ? 'rgba(228,87,86,0.07)' : 'rgba(230,162,60,0.07)', border: `1px solid ${forecast.timeToCriticalDays <= 14 ? 'rgba(228,87,86,0.25)' : 'rgba(230,162,60,0.25)'}`, borderRadius: 10, padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Clock size={16} style={{ color: forecast.timeToCriticalDays <= 14 ? 'var(--risk-high)' : 'var(--risk-medium)' }} />
                <span style={{ fontWeight: 600, color: forecast.timeToCriticalDays <= 14 ? 'var(--risk-high)' : 'var(--risk-medium)', fontSize: '0.875rem' }}>
                  Estimated Time to Critical
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: forecast.timeToCriticalDays <= 14 ? 'var(--risk-high)' : 'var(--risk-medium)', lineHeight: 1 }}>
                  ≈{forecast.timeToCriticalDays}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>days*</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', background: forecast.timeToCriticalDays <= 14 ? 'var(--risk-high)' : 'var(--risk-medium)', borderRadius: 99, width: `${Math.max(5, Math.min(100, (1 - forecast.timeToCriticalDays / 90) * 100))}%` }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Model estimate if current trend persists. {projection30 && `30-day forecast: ${projection30.riskLevel} (${projection30.riskScore}/100).`}
              </p>
            </div>
          ) : (
            <div style={{ background: 'rgba(63,174,90,0.06)', border: '1px solid rgba(63,174,90,0.2)', borderRadius: 10, padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} style={{ color: 'var(--risk-low)' }} />
                <span style={{ fontWeight: 600, color: 'var(--risk-low)', fontSize: '0.875rem' }}>No Critical Trajectory Detected</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>Trend is stable or improving under current conditions.</p>
            </div>
          )}

          {/* Chart */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-label">Salinity Trend &amp; Forecast</div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>━ Historical</span>
                <span style={{ color: 'var(--accent-seafoam)' }}>╌ Forecast</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--risk-high)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--risk-high)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-seafoam)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--accent-seafoam)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
                  label={{ value: 'EC (dS/m)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                <ReferenceLine x={chartData.find(d => d.type === 'forecast')?.date} stroke="var(--border)" strokeDasharray="4 2"
                  label={{ value: 'Today', fill: 'var(--text-muted)', fontSize: 10 }} />
                <Area type="monotone" dataKey="soilEC" name="Soil EC" stroke="var(--risk-high)" fill="url(#soilGrad)" strokeWidth={2} dot={false} connectNulls />
                <Area type="monotone" dataKey="groundwaterEC" name="GW EC" stroke="var(--accent-seafoam)" fill="url(#gwGrad)" strokeWidth={2} dot={false} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Trend Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                {[
                  { label: 'Soil EC slope', val: forecast.trend?.soilECSlope, unit: 'dS/m per reading' },
                  { label: 'GW EC slope',   val: forecast.trend?.groundwaterECSlope, unit: 'dS/m per reading' },
                  { label: 'Confidence',    val: `${forecast.confidence}%`, unit: `(${forecast.confidenceLabel})`, raw: true },
                  { label: 'Readings used', val: forecast.readingsUsed, raw: true },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.375rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ color: r.raw ? 'var(--text-secondary)' : (r.val > 0 ? 'var(--risk-high)' : 'var(--risk-low)'), fontFamily: 'monospace' }}>
                      {r.raw ? r.val : `${r.val > 0 ? '▲' : '▼'} ${Math.abs(r.val)}`} {r.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {projection30 && (
              <div className="card" style={{ padding: '1rem' }}>
                <div className="section-label" style={{ marginBottom: '0.75rem' }}>30-Day Projection</div>
                <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden', marginBottom: '0.75rem' }}>
                  <div style={{ height: '100%', background: riskCol(projection30.riskLevel), borderRadius: 99, width: `${projection30.riskScore}%`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Projected risk</span>
                  <span style={{ fontWeight: 700, color: riskCol(projection30.riskLevel), fontFamily: 'monospace' }}>{projection30.riskScore}/100</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Soil EC</div><div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatSensor('soilEC', projection30.soilEC)} dS/m</div></div>
                  <div><div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>GW EC</div><div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatSensor('groundwaterEC', projection30.groundwaterEC)} dS/m</div></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {forecast.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
