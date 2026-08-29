import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Waves, MapPin, TrendingUp, AlertTriangle, Activity, Cpu, GitBranch, FlaskConical, Map, Clock, Plus, Heart, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AddFarmModal } from '../components/AddFarmModal.jsx'
import { RiskBadge, TrendBadge, LiveBadge } from '../components/ui/Badges.jsx'
import { formatTime } from '../lib/utils.js'
import { api } from '../lib/api.js'

function FarmCard({ farm, onClick }) {
  const latestRisk    = farm.riskAssessments?.[0]
  const latestReading = farm.readings?.[0]
  const activeAlerts  = farm.alerts?.length || 0

  const riskColor = {
    LOW:      'border-green-500/20',
    MEDIUM:   'border-amber-500/30',
    HIGH:     'border-red-500/30',
    CRITICAL: 'border-purple-500/40',
  }[latestRisk?.riskLevel] || 'border-gray-800'

  return (
    <div
      onClick={onClick}
      className={`card p-5 cursor-pointer hover:border-gray-700 transition-all hover:bg-gray-800/50 border ${riskColor}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{farm.farmName}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <MapPin size={11} />
            <span>{farm.farmerName} · {farm.district}</span>
          </div>
        </div>
        <RiskBadge level={latestRisk?.riskLevel || 'UNKNOWN'} />
      </div>

      {latestRisk && (
        <div className="flex items-center gap-3 mb-3">
          <TrendBadge trend={latestRisk.trend} />
          <span className="text-xs text-gray-600">Score: {latestRisk.riskScore}/100</span>
        </div>
      )}

      {latestReading && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Soil EC</p>
            <p className="text-sm font-semibold text-white">{latestReading.soilEC}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">GW EC</p>
            <p className="text-sm font-semibold text-white">{latestReading.groundwaterEC}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">TDS</p>
            <p className="text-sm font-semibold text-white">{latestReading.tds}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{farm.currentCrop} · {farm.landArea} ha</span>
        {activeAlerts > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle size={11} /> {activeAlerts} alert{activeAlerts > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {latestReading && (
        <p className="text-xs text-gray-700 mt-2">Updated {formatTime(latestReading.timestamp)}</p>
      )}
    </div>
  )
}

function IntelCard({ icon: Icon, label, value, sub, color = 'text-blue-400', onClick, href }) {
  const content = (
    <div className={`card p-4 flex items-start gap-3 transition-colors ${onClick ? 'cursor-pointer hover:bg-gray-800/50' : ''}`} onClick={onClick}>
      <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return content
}

// ---- CoastalFarmHealthCard ----
function CoastalFarmHealthCard({ farmId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health-summary', farmId],
    queryFn: () => api.analytics.healthSummary(farmId),
    enabled: !!farmId,
    staleTime: 60_000,
    retry: false,
  })

  const healthColor = {
    GOOD:     'text-green-400  border-green-500/30  bg-green-500/5',
    WATCH:    'text-amber-400  border-amber-500/30  bg-amber-500/5',
    AT_RISK:  'text-orange-400 border-orange-500/30 bg-orange-500/5',
    CRITICAL: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  }

  const urgencyColor = {
    LOW:      'bg-green-500/20  text-green-400',
    MEDIUM:   'bg-amber-500/20  text-amber-400',
    HIGH:     'bg-orange-500/20 text-orange-400',
    CRITICAL: 'bg-purple-500/20 text-purple-400',
  }

  if (isLoading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-800 rounded w-full mb-2" />
        <div className="h-3 bg-gray-800 rounded w-4/5" />
      </div>
    )
  }

  // 404 = no health summary yet
  if (error || !data) {
    return (
      <div className="card p-5 text-center text-gray-600 text-sm border-dashed border-gray-700">
        <Heart size={22} className="mx-auto mb-2 text-gray-700" />
        No health summary yet — submit a reading to trigger the AI pipeline.
      </div>
    )
  }

  // content may be an object (already parsed by the server route) or a string
  const content = typeof data.content === 'object' ? data.content : (() => {
    try { return JSON.parse(data.content) } catch { return {} }
  })()

  const { overallHealth, healthScore, salinityStatus, mainRisk, topActions = [], urgency, confidenceNote, disclaimer } = content
  const colorClass = healthColor[overallHealth] || healthColor.WATCH

  return (
    <div className={`card p-5 border ${colorClass} space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Heart size={16} className={colorClass.split(' ')[0]} />
          <h3 className="text-sm font-semibold text-white">Coastal Farm Health</h3>
        </div>
        <div className="flex items-center gap-2">
          {urgency && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyColor[urgency] || urgencyColor.MEDIUM}`}>
              {urgency}
            </span>
          )}
          {overallHealth && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass.split(' ').slice(0,2).join(' ')} border`}>
              {overallHealth}
            </span>
          )}
        </div>
      </div>

      {/* Health score bar */}
      {typeof healthScore === 'number' && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Health Score</span>
            <span className={colorClass.split(' ')[0]}>{healthScore}/100</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                overallHealth === 'GOOD' ? 'bg-green-500' :
                overallHealth === 'WATCH' ? 'bg-amber-500' :
                overallHealth === 'AT_RISK' ? 'bg-orange-500' : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, healthScore))}%` }}
            />
          </div>
        </div>
      )}

      {salinityStatus && <p className="text-xs text-gray-400">{salinityStatus}</p>}

      {mainRisk && (
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Main Risk</p>
          <p className="text-xs text-gray-300">{mainRisk}</p>
        </div>
      )}

      {topActions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Top Actions</p>
          <ul className="space-y-0.5">
            {topActions.slice(0, 3).map((a, i) => (
              <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                <span className="text-gray-600 shrink-0">{i + 1}.</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(confidenceNote || disclaimer) && (
        <p className="text-xs text-gray-600 italic border-t border-gray-800 pt-2">
          {confidenceNote || disclaimer}
        </p>
      )}

      <p className="text-xs text-gray-700 text-right">✦ AI-powered · IBM Granite</p>
    </div>
  )
}

// ---- GraniteStatusIndicator ----
function GraniteStatusIndicator() {
  const { data } = useQuery({
    queryKey: ['ai-health'],
    queryFn: api.analytics.aiHealth,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  })

  if (!data) return null

  if (data.status === 'connected') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
        <CheckCircle size={11} /> IBM Granite
      </span>
    )
  }
  if (data.status === 'unavailable') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
        <XCircle size={11} /> Granite Unavailable
      </span>
    )
  }
  // unconfigured / default
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
      <AlertCircle size={11} /> Demo Mode
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading, error } = useFarms()
  const [modalOpen, setModalOpen] = useState(false)

  const stats = {
    total:    farms.length,
    critical: farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'CRITICAL').length,
    high:     farms.filter(f => f.riskAssessments?.[0]?.riskLevel === 'HIGH').length,
    alerts:   farms.reduce((sum, f) => sum + (f.alerts?.length || 0), 0),
  }

  const worstFarm = farms.reduce((worst, f) => {
    const score = f.riskAssessments?.[0]?.riskScore ?? 0
    return score > (worst?.riskAssessments?.[0]?.riskScore ?? 0) ? f : worst
  }, null)

  const worseningFarms = farms.filter(f => {
    const t = f.riskAssessments?.[0]?.trend
    return t === 'WORSENING' || t === 'RAPIDLY_WORSENING'
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Waves className="text-blue-400" size={28} />
            Salinity Shield AI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Smart Salinity Ingress & Coastal Farmland Protection Advisor</p>
        </div>
        <div className="flex items-center gap-3">
          <GraniteStatusIndicator />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Farm
          </button>
          <LiveBadge />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Monitored Farms</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{stats.critical}</p>
          <p className="text-xs text-gray-500 mt-1">Critical Risk</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.high}</p>
          <p className="text-xs text-gray-500 mt-1">High Risk</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{stats.alerts}</p>
          <p className="text-xs text-gray-500 mt-1">Active Alerts</p>
        </div>
      </div>

      {/* Intelligence shortcuts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Intelligence Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <IntelCard icon={GitBranch}   label="AI Decision Trace"  value="Agent history"     sub="View full pipeline"           color="text-purple-400" onClick={() => navigate('/decision-trace')} />
          <IntelCard icon={TrendingUp}  label="Salinity Forecast"  value="30-day outlook"    sub="Time-to-critical"             color="text-blue-400"   onClick={() => navigate('/forecast')} />
          <IntelCard icon={FlaskConical} label="What-If Simulator" value="Run scenarios"     sub="Model interventions"          color="text-cyan-400"   onClick={() => navigate('/what-if')} />
          <IntelCard icon={Map}          label="Risk Heatmap"      value="Regional view"     sub="Gujarat coastal map"          color="text-green-400"  onClick={() => navigate('/heatmap')} />
        </div>
      </div>

      {/* IBM Granite context */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Cpu size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-400">IBM Granite AI — Multi-Agent Architecture</h3>
            <p className="text-xs text-gray-500 mt-1">
              Monitor → Detect → Explain → Predict → Simulate → Recommend → Act.
              New readings trigger the Agent Orchestrator which activates IBM Granite-powered agents:
              Monitoring · Crop Advisory · Irrigation · Land Reclamation · Farmer Alert · Coastal Farm Health.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts / Worsening */}
      {worstFarm && stats.critical + stats.high > 0 && (
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Attention Required</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {stats.critical > 0 && <span>{stats.critical} farm{stats.critical > 1 ? 's' : ''} at CRITICAL risk</span>}
            {stats.high > 0     && <span>{stats.high} farm{stats.high > 1 ? 's' : ''} at HIGH risk</span>}
            {worseningFarms.length > 0 && <span>{worseningFarms.length} farm{worseningFarms.length > 1 ? 's' : ''} worsening</span>}
          </div>
          {worstFarm && (
            <button onClick={() => navigate(`/farms/${worstFarm.id}`)} className="text-xs text-red-400 hover:text-red-300 mt-2">
              View {worstFarm.farmName} → 
            </button>
          )}
        </div>
      )}

      {/* Farm cards */}
      {isLoading && <div className="text-center py-12 text-gray-600">Loading farms...</div>}
      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          Failed to load farms: {error.message}. Make sure the backend is running.
        </div>
      )}

      {!isLoading && farms.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-300">Farm Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {farms.map(farm => (
              <FarmCard
                key={farm.id}
                farm={farm}
                onClick={() => navigate(`/farms/${farm.id}`)}
              />
            ))}
          </div>

          {/* Coastal Farm Health for the highest-risk farm */}
          {worstFarm && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-2">
                Coastal Farm Health — {worstFarm.farmName}
              </h2>
              <CoastalFarmHealthCard farmId={worstFarm.id} />
            </div>
          )}
        </>
      )}

      {!isLoading && farms.length === 0 && !error && (
        <div className="card p-10 text-center space-y-4">
          <Waves size={36} className="text-gray-700 mx-auto" />
          <p className="text-gray-500">No farms registered yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add Your First Farm
          </button>
        </div>
      )}

      <AddFarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newFarm) => navigate(`/farms/${newFarm.id}`)}
      />
    </div>
  )
}
