import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, ChevronRight } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AddFarmModal } from '../components/AddFarmModal.jsx'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatTime } from '../lib/utils.js'

export default function FarmsList() {
  const navigate = useNavigate()
  const { data: farms = [], isLoading } = useFarms()
  const [modalOpen, setModalOpen] = useState(false)

  const handleFarmCreated = (newFarm) => {
    // Navigate directly to the new farm's detail page
    navigate(`/farms/${newFarm.id}`)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Farms</h1>
          <p className="text-xs text-gray-500 mt-0.5">{farms.length} farm{farms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add New Farm
        </button>
      </div>

      {isLoading && <p className="text-gray-600 text-sm">Loading farms…</p>}

      {!isLoading && farms.length === 0 && (
        <div className="card p-10 text-center space-y-4">
          <MapPin size={32} className="text-gray-700 mx-auto" />
          <p className="text-gray-500 text-sm">No farms registered yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add Your First Farm
          </button>
        </div>
      )}

      {!isLoading && farms.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Farm</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">District</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Crop</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Area</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Risk</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Trend</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Last Update</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {farms.map((farm) => {
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
                      <p className="text-xs text-gray-500">{farm.farmerName} · {farm.location}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{farm.district}</td>
                    <td className="px-5 py-4 text-gray-400">{farm.currentCrop}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{farm.landArea} ac</td>
                    <td className="px-5 py-4">
                      <RiskBadge level={risk?.riskLevel} />
                    </td>
                    <td className="px-5 py-4">
                      {risk ? <TrendBadge trend={risk.trend} /> : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {reading ? formatTime(reading.timestamp) : <span className="text-gray-700">No readings yet</span>}
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
      )}

      <AddFarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleFarmCreated}
      />
    </div>
  )
}
