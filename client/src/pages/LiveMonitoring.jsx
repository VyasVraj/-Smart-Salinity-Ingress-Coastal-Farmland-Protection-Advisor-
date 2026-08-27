import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, RefreshCw } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { useFarmReadings, useAgentRuns } from '../hooks/useFarm.js'
import { RiskBadge, TrendBadge, LiveBadge, DemoBadge } from '../components/ui/Badges.jsx'
import { SalinityTrendChart } from '../components/charts/SalinityCharts.jsx'
import { MetricCard, getECStatus, getTDSStatus } from '../components/ui/MetricCard.jsx'
import { ActivityTimeline } from '../components/ActivityTimeline.jsx'
import { useActivityTimeline } from '../hooks/useActivityTimeline.js'
import { formatTime } from '../lib/utils.js'

export default function LiveMonitoring() {
  const navigate = useNavigate()
  const { data: farms = [] } = useFarms()
  const [selectedId, setSelectedId] = useState('')
  const farmId = selectedId || farms[0]?.id || ''

  const { data: readings = [] } = useFarmReadings(farmId, 50)
  const { events } = useActivityTimeline(farmId)

  const selectedFarm = farms.find(f => f.id === farmId)
  const latestReading = readings[readings.length - 1]
  const latestRisk = selectedFarm?.riskAssessments?.[0]

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-green-400" size={22} /> Live Monitoring
        </h1>
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
        {selectedFarm && (
          <button
            onClick={() => navigate(`/farms/${farmId}`)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View Full Detail →
          </button>
        )}
      </div>

      {selectedFarm && latestRisk && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Risk Level</p>
            <RiskBadge level={latestRisk.riskLevel} size="lg" />
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Risk Score</p>
            <p className="text-2xl font-bold text-white">{latestRisk.riskScore}<span className="text-xs text-gray-500">/100</span></p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Trend</p>
            <TrendBadge trend={latestRisk.trend} />
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">EC Change</p>
            <p className={`text-xl font-bold ${latestRisk.trendChangePercent > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {latestRisk.trendChangePercent > 0 ? '+' : ''}{latestRisk.trendChangePercent}%
            </p>
          </div>
        </div>
      )}

      {latestReading && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Latest Reading</h3>
            <span className="text-xs text-gray-600">{formatTime(latestReading.timestamp)}</span>
            {latestReading.source === 'SIMULATOR' && <DemoBadge />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <MetricCard label="Soil EC" value={latestReading.soilEC} unit="dS/m" status={getECStatus(latestReading.soilEC)} />
            <MetricCard label="Groundwater EC" value={latestReading.groundwaterEC} unit="dS/m" status={getECStatus(latestReading.groundwaterEC)} />
            <MetricCard label="TDS" value={latestReading.tds} unit="ppm" status={getTDSStatus(latestReading.tds)} />
          </div>
        </div>
      )}

      {farmId && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">Salinity Trend</h3>
          <SalinityTrendChart readings={readings} />
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Agent Activity Timeline</h3>
          <LiveBadge />
        </div>
        <ActivityTimeline events={events} />
      </div>
    </div>
  )
}
