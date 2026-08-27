import { useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { formatTime } from '../lib/utils.js'

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const { data: farms = [] } = useFarms()
  const [selectedFarmId, setSelectedFarmId] = useState('all')

  // Load alerts for all farms
  const allAlerts = farms.flatMap(f => (f.alerts || []).map(a => ({ ...a, farmName: f.farmName })))
  const filtered = selectedFarmId === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.farmId === selectedFarmId)

  const sortedAlerts = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const resolveMutation = useMutation({
    mutationFn: (id) => api.alerts.resolve(id),
    onSuccess: () => queryClient.invalidateQueries(['farms']),
  })

  const severityIcon = {
    LOW: <CheckCircle size={16} className="text-green-400" />,
    MEDIUM: <AlertTriangle size={16} className="text-amber-400" />,
    HIGH: <AlertTriangle size={16} className="text-red-400" />,
    CRITICAL: <AlertOctagon size={16} className="text-purple-400" />,
  }

  const severityBg = {
    LOW: 'border-green-500/20 bg-green-500/5',
    MEDIUM: 'border-amber-500/20 bg-amber-500/5',
    HIGH: 'border-red-500/20 bg-red-500/5',
    CRITICAL: 'border-purple-500/30 bg-purple-500/5',
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell className="text-amber-400" size={22} /> Alert Center
        </h1>
        <span className="text-xs text-gray-500">{sortedAlerts.filter(a => a.status === 'ACTIVE').length} active alerts</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Farm:</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          value={selectedFarmId}
          onChange={e => setSelectedFarmId(e.target.value)}
        >
          <option value="all">All Farms</option>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName}</option>)}
        </select>
      </div>

      {sortedAlerts.length === 0 && (
        <div className="card p-8 text-center text-gray-600">
          <Bell size={32} className="mx-auto mb-3 opacity-30" />
          <p>No alerts found.</p>
        </div>
      )}

      <div className="space-y-3">
        {sortedAlerts.map(alert => (
          <div key={alert.id} className={`card p-4 border ${severityBg[alert.severity] || ''} ${alert.status === 'RESOLVED' ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{severityIcon[alert.severity]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-white text-sm">{alert.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    alert.severity === 'CRITICAL' ? 'bg-purple-500/20 text-purple-400' :
                    alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>{alert.severity}</span>
                  {alert.status === 'RESOLVED' && <span className="text-xs text-green-500">✓ Resolved</span>}
                </div>
                <p className="text-sm text-gray-400">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span>{alert.farmName}</span>
                  <span>·</span>
                  <span>{formatTime(alert.createdAt)}</span>
                </div>
              </div>
              {alert.status === 'ACTIVE' && (
                <button
                  onClick={() => resolveMutation.mutate(alert.id)}
                  className="text-xs text-gray-500 hover:text-green-400 transition-colors whitespace-nowrap"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
