/**
 * Coastal Salinity Risk Heatmap — Feature 4
 * Leaflet + OpenStreetMap interactive map of Gujarat coastal farms
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Map, X, AlertTriangle, ExternalLink } from 'lucide-react'
import { api } from '../lib/api.js'
import { socket } from '../lib/socket.js'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime } from '../lib/utils.js'
import LeafletRiskMap from '../components/LeafletRiskMap.jsx'

const RISK_COLORS = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#7c3aed',
  UNKNOWN:  '#6b7280',
}

const RISK_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical', UNKNOWN: 'Unknown' }

function FarmDetailPanel({ farm, onClose, onViewDetails }) {
  if (!farm) return null
  return (
    <div className="card p-5 border-blue-500/30 bg-blue-500/5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white">{farm.farmName}</h3>
          <p className="text-xs text-gray-500">{farm.farmerName} · {farm.district}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-600">Risk Level</p>
          <RiskBadge level={farm.riskLevel} />
        </div>
        <div>
          <p className="text-xs text-gray-600">Risk Score</p>
          <p className="text-lg font-bold text-white">{farm.riskScore ?? '—'}<span className="text-xs text-gray-500">/100</span></p>
        </div>
        {farm.soilEC != null && (
          <div>
            <p className="text-xs text-gray-600">Soil EC</p>
            <p className="text-sm font-semibold text-white">{farm.soilEC} dS/m</p>
          </div>
        )}
        {farm.groundwaterEC != null && (
          <div>
            <p className="text-xs text-gray-600">Groundwater EC</p>
            <p className="text-sm font-semibold text-white">{farm.groundwaterEC} dS/m</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-600">Current Crop</p>
          <p className="text-sm text-gray-300">{farm.currentCrop}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Land Area</p>
          <p className="text-sm text-gray-300">{farm.landArea} ha</p>
        </div>
      </div>

      {farm.trend && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-600">Trend:</span>
          <TrendBadge trend={farm.trend} />
        </div>
      )}

      {farm.activeAlerts > 0 && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle size={12} />
          <span>{farm.activeAlerts} active alert{farm.activeAlerts > 1 ? 's' : ''}</span>
        </div>
      )}

      {farm.lastUpdated && (
        <p className="text-xs text-gray-600 mt-2">Updated: {formatTime(farm.lastUpdated)}</p>
      )}

      <button
        onClick={() => onViewDetails(farm.id)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
      >
        <ExternalLink size={12} />
        View Farm Details
      </button>
    </div>
  )
}

export default function HeatmapPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [filterDistrict, setFilterDistrict] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['map-risk'],
    queryFn: api.analytics.mapRisk,
    refetchInterval: 30000,
  })

  // Real-time: invalidate map data when risk, readings, or alerts change
  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['map-risk'] })
    socket.on('risk:assessed',  refresh)
    socket.on('reading:received', refresh)
    socket.on('alert:created',  refresh)
    return () => {
      socket.off('risk:assessed',  refresh)
      socket.off('reading:received', refresh)
      socket.off('alert:created',  refresh)
    }
  }, [queryClient])

  const features = data?.features ?? []
  const regional = data?.regionalSummary ?? []

  const filtered = features.filter(f => {
    if (filterDistrict !== 'all' && f.district !== filterDistrict) return false
    if (filterRisk !== 'all' && f.riskLevel !== filterRisk) return false
    return true
  })

  const districts = [...new Set(features.map(f => f.district))].sort()
  const totalFarms = features.length
  const summary = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  for (const f of features) { if (summary[f.riskLevel] !== undefined) summary[f.riskLevel]++ }

  // Keep selectedFarm in sync if its data updates after a refresh
  useEffect(() => {
    if (!selectedFarm) return
    const updated = features.find(f => f.id === selectedFarm.id)
    if (updated && updated !== selectedFarm) setSelectedFarm(updated)
  }, [features]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Map className="text-green-400" size={22} /> Coastal Salinity Risk Map
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gujarat coastal farmland — real-time risk visualization</p>
        </div>
      </div>

      {/* Regional summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalFarms}</p>
          <p className="text-xs text-gray-500">Farms Monitored</p>
        </div>
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(lvl => (
          <div key={lvl} className="card p-3 text-center">
            <p className={`text-2xl font-bold ${lvl === 'LOW' ? 'text-green-400' : lvl === 'MEDIUM' ? 'text-amber-400' : lvl === 'HIGH' ? 'text-red-400' : 'text-purple-400'}`}>
              {summary[lvl]}
            </p>
            <p className="text-xs text-gray-500">{RISK_LABELS[lvl]}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">District:</label>
          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
            value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Risk:</label>
          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
            value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            <option value="all">All Risk Levels</option>
            {['LOW','MEDIUM','HIGH','CRITICAL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Gujarat Coastal Region</p>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(RISK_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([level, color]) => (
                <div key={level} className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {RISK_LABELS[level]}
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-80 text-gray-600 text-sm rounded-lg bg-gray-900 border border-gray-800">
              Loading farm locations…
            </div>
          ) : filtered.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center h-80 text-gray-500 text-sm rounded-lg bg-gray-900 border border-gray-800">
              No farms available for the selected filters.
            </div>
          ) : (
            <LeafletRiskMap
              farms={filtered}
              selectedFarm={selectedFarm}
              onFarmSelect={setSelectedFarm}
              onViewDetails={(farmId) => navigate(`/farms/${farmId}`)}
            />
          )}
          <p className="text-xs text-gray-600 mt-2 text-center">Click a farm marker to see details</p>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {selectedFarm ? (
            <FarmDetailPanel
              farm={selectedFarm}
              onClose={() => setSelectedFarm(null)}
              onViewDetails={(farmId) => navigate(`/farms/${farmId}`)}
            />
          ) : (
            <div className="card p-4 text-center text-gray-600 text-sm">
              <Map size={24} className="mx-auto mb-2 opacity-30" />
              <p>Click a farm on the map to see details</p>
            </div>
          )}

          {/* Regional breakdown */}
          <div className="card p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">By District</h3>
            {regional.map(r => (
              <div key={r.district} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{r.district}</span>
                  <span className="text-gray-500">{r.total} farms</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden gap-px">
                  {r.LOW      > 0 && <div className="bg-green-500"  style={{ flex: r.LOW      }} />}
                  {r.MEDIUM   > 0 && <div className="bg-amber-500"  style={{ flex: r.MEDIUM   }} />}
                  {r.HIGH     > 0 && <div className="bg-red-500"    style={{ flex: r.HIGH     }} />}
                  {r.CRITICAL > 0 && <div className="bg-purple-500" style={{ flex: r.CRITICAL }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Farm list */}
          <div className="card p-4">
            <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Farms ({filtered.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filtered.map(f => (
                <button
                  key={f.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedFarm?.id === f.id ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-gray-800 hover:bg-gray-700'}`}
                  onClick={() => setSelectedFarm(f)}
                >
                  <div className="flex justify-between">
                    <span className="text-gray-300">{f.farmName}</span>
                    <RiskBadge level={f.riskLevel} />
                  </div>
                  <span className="text-gray-600">{f.district}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
