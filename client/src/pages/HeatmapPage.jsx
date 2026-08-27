/**
 * Coastal Salinity Risk Heatmap — Feature 4
 * SVG-based interactive map of Gujarat coastal farms
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Map, X, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { api } from '../lib/api.js'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime } from '../lib/utils.js'

// Approximate Gujarat coastal bounding box for normalizing coordinates
// Lat: 20.5 – 24.0, Lon: 68.0 – 73.5
const MAP_BOUNDS = { minLat: 20.5, maxLat: 24.0, minLon: 68.0, maxLon: 73.5 }
const MAP_W = 700, MAP_H = 440

function latLonToXY(lat, lon) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * MAP_W
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * MAP_H
  return { x, y }
}

const RISK_COLORS = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#7c3aed',
  UNKNOWN:  '#6b7280',
}

const RISK_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical', UNKNOWN: 'Unknown' }

// Simplified Gujarat coastal outline points (approximate SVG path)
const GUJARAT_COAST_PATH = `
  M 420,10 L 450,30 L 480,40 L 510,60 L 530,90 L 540,120 L 520,150 L 490,180
  L 460,200 L 430,230 L 400,260 L 370,290 L 340,310 L 310,330 L 280,360
  L 250,390 L 220,410 L 190,420 L 160,415 L 130,400 L 100,380 L 80,350
  L 70,320 L 80,290 L 100,270 L 130,250 L 160,230 L 180,200 L 170,170
  L 150,140 L 160,110 L 190,90 L 220,80 L 250,70 L 280,60 L 310,50 L 340,35 L 370,20 Z
`

// District label positions (approximate)
const DISTRICT_LABELS = [
  { name: 'Kutch',      x: 130, y: 120 },
  { name: 'Jamnagar',   x: 250, y: 210 },
  { name: 'Rajkot',     x: 340, y: 200 },
  { name: 'Bhavnagar',  x: 400, y: 290 },
  { name: 'Amreli',     x: 360, y: 340 },
  { name: 'Surat',      x: 500, y: 370 },
]

function FarmMarker({ farm, onClick, isSelected }) {
  const { x, y } = latLonToXY(farm.latitude, farm.longitude)
  const color = RISK_COLORS[farm.riskLevel] || RISK_COLORS.UNKNOWN
  const r = isSelected ? 10 : 7

  return (
    <g className="cursor-pointer" onClick={() => onClick(farm)}>
      {isSelected && (
        <circle cx={x} cy={y} r={r + 6} fill={color} fillOpacity={0.2} />
      )}
      <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.85} stroke="#1f2328" strokeWidth={1.5} />
      {farm.riskLevel === 'CRITICAL' && (
        <circle cx={x} cy={y} r={r + 3} fill="none" stroke={color} strokeWidth={1} strokeDasharray="2,2" />
      )}
      <text x={x} y={y - r - 3} textAnchor="middle" fontSize="9" fill="#e5e7eb" fontFamily="system-ui">
        {farm.farmName.split(' ')[0]}
      </text>
    </g>
  )
}

function FarmDetailPanel({ farm, onClose }) {
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
    </div>
  )
}

export default function HeatmapPage() {
  const [selectedFarm, setSelectedFarm] = useState(null)
  const [filterDistrict, setFilterDistrict] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['map-risk'],
    queryFn: api.analytics.mapRisk,
    refetchInterval: 30000,
  })

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
            <div className="flex gap-3">
              {Object.entries(RISK_COLORS).filter(([k]) => k !== 'UNKNOWN').map(([level, color]) => (
                <div key={level} className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {RISK_LABELS[level]}
                </div>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-600 text-sm">Loading map data...</div>
          ) : (
            <div className="overflow-auto">
              <svg
                viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                className="w-full bg-gray-950 rounded-lg"
                style={{ minHeight: 300 }}
              >
                {/* Ocean background */}
                <rect width={MAP_W} height={MAP_H} fill="#0c1a2e" rx={8} />

                {/* Gujarat coastal region (simplified) */}
                <path d={GUJARAT_COAST_PATH} fill="#1a2f1a" stroke="#2d4a2d" strokeWidth={1} fillOpacity={0.6} />

                {/* District labels */}
                {DISTRICT_LABELS.map(d => (
                  <text key={d.name} x={d.x} y={d.y} fontSize="10" fill="#4b5563" fontFamily="system-ui" textAnchor="middle">
                    {d.name}
                  </text>
                ))}

                {/* Compass */}
                <text x={MAP_W - 20} y={20} fontSize="12" fill="#374151" textAnchor="middle">N</text>
                <line x1={MAP_W - 20} y1={22} x2={MAP_W - 20} y2={35} stroke="#374151" strokeWidth={1} />

                {/* Farm markers */}
                {filtered.map(farm => (
                  <FarmMarker
                    key={farm.id}
                    farm={farm}
                    onClick={setSelectedFarm}
                    isSelected={selectedFarm?.id === farm.id}
                  />
                ))}
              </svg>
            </div>
          )}
          <p className="text-xs text-gray-600 mt-2 text-center">Click a farm marker to see details</p>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {selectedFarm ? (
            <FarmDetailPanel farm={selectedFarm} onClose={() => setSelectedFarm(null)} />
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
