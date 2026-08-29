/**
 * Risk display helpers
 */

// ── Sensor value formatting ────────────────────────────────────────────────────

/**
 * Per-metric display precision.
 * Change here to update every component that calls formatSensor().
 */
const SENSOR_DECIMALS = {
  soilEC:        2,
  groundwaterEC: 2,
  tds:           0,
  soilPH:        2,
  moisture:      1,
  waterLevel:    2,
}

/**
 * Format a raw sensor value for display.
 *
 * @param {string}        metric  - key from SENSOR_DECIMALS (e.g. 'soilEC')
 * @param {number|null}   value   - raw numeric value from the API / database
 * @returns {string}              - formatted string, or '—' if value is unavailable
 *
 * Examples:
 *   formatSensor('soilPH',    6.7196440286) → '6.72'
 *   formatSensor('moisture',  45.147091656) → '45.1'
 *   formatSensor('tds',       660.89)       → '661'
 *   formatSensor('soilEC',    null)         → '—'
 */
export function formatSensor(metric, value) {
  if (value == null || value === '' || typeof value === 'undefined') return '—'
  const n = Number(value)
  if (!isFinite(n) || isNaN(n)) return '—'
  const decimals = SENSOR_DECIMALS[metric] ?? 2
  return n.toFixed(decimals)
}


export function getRiskColor(level) {
  const colors = {
    LOW: 'text-green-400',
    MEDIUM: 'text-amber-400',
    HIGH: 'text-red-400',
    CRITICAL: 'text-purple-400',
  }
  return colors[level] || 'text-gray-400'
}

export function getRiskBg(level) {
  const colors = {
    LOW: 'bg-green-500/20 border-green-500/30',
    MEDIUM: 'bg-amber-500/20 border-amber-500/30',
    HIGH: 'bg-red-500/20 border-red-500/30',
    CRITICAL: 'bg-purple-500/20 border-purple-500/30',
  }
  return colors[level] || 'bg-gray-500/20 border-gray-500/30'
}

export function getTrendIcon(trend) {
  const icons = {
    IMPROVING: '↓ Improving',
    STABLE: '→ Stable',
    WORSENING: '↑ Worsening',
    RAPIDLY_WORSENING: '⬆ Rapidly Worsening',
  }
  return icons[trend] || trend
}

export function getTrendColor(trend) {
  const colors = {
    IMPROVING: 'text-green-400',
    STABLE: 'text-blue-400',
    WORSENING: 'text-amber-400',
    RAPIDLY_WORSENING: 'text-red-400',
  }
  return colors[trend] || 'text-gray-400'
}

export function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
