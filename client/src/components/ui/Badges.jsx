import { getRiskBg, getRiskColor, getTrendIcon, getTrendColor } from '../../lib/utils.js'

export function RiskBadge({ level, size = 'sm' }) {
  const textSize = size === 'lg' ? 'text-base font-bold' : 'text-xs font-semibold'
  const padding = size === 'lg' ? 'px-3 py-1.5' : 'px-2 py-0.5'
  return (
    <span className={`inline-flex items-center rounded-full border ${getRiskBg(level)} ${getRiskColor(level)} ${textSize} ${padding}`}>
      {level || '—'}
    </span>
  )
}

export function TrendBadge({ trend }) {
  return (
    <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
      {getTrendIcon(trend)}
    </span>
  )
}

export function DemoBadge() {
  return (
    <span className="demo-badge">
      ⚠ Demo Data
    </span>
  )
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      LIVE
    </span>
  )
}
