import { Droplets, Waves, FlaskConical, Thermometer, CloudRain, ArrowDown } from 'lucide-react'

export function MetricCard({ label, value, unit, icon: Icon, status }) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    critical: 'text-purple-400',
    neutral: 'text-gray-400',
  }
  const color = statusColors[status] || 'text-blue-400'

  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-gray-800 ${color}`}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-xl font-bold ${color}`}>{value ?? '—'}</span>
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

export function getECStatus(value) {
  if (value < 2) return 'good'
  if (value < 4) return 'warning'
  if (value < 8) return 'danger'
  return 'critical'
}

export function getTDSStatus(value) {
  if (value < 1000) return 'good'
  if (value < 2000) return 'warning'
  if (value < 4000) return 'danger'
  return 'critical'
}

export function getPHStatus(value) {
  if (value >= 5.5 && value <= 7.5) return 'good'
  if (value >= 4.5 && value <= 8.5) return 'warning'
  return 'danger'
}
