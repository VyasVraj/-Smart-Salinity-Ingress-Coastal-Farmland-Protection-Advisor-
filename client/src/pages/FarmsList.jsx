import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, ChevronRight } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime } from '../lib/utils.js'

export default function FarmsList() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading } = useFarms()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Farms</h1>
        <span className="text-xs text-gray-500">{farms.length} farms registered</span>
      </div>

      {isLoading && <p className="text-gray-600">Loading...</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Farm</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">District</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Crop</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Risk</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Trend</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Last Update</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {farms.map((farm, i) => {
              const risk = farm.riskAssessments?.[0]
              const reading = farm.readings?.[0]
              return (
                <tr
                  key={farm.id}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/farms/${farm.id}`)}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{farm.farmName}</p>
                    <p className="text-xs text-gray-500">{farm.farmerName}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{farm.district}</td>
                  <td className="px-5 py-4 text-gray-400">{farm.currentCrop}</td>
                  <td className="px-5 py-4">
                    <RiskBadge level={risk?.riskLevel} />
                  </td>
                  <td className="px-5 py-4">
                    {risk ? <TrendBadge trend={risk.trend} /> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {reading ? formatTime(reading.timestamp) : '—'}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
