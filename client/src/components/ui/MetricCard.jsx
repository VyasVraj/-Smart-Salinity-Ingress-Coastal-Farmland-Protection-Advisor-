// MetricCard — coastal design system
// Formats raw sensor values at render time so long decimals never escape the card.

import { formatSensor } from '../../lib/utils.js'

// Map of label → metric key used by formatSensor().
// When value is passed without a metricKey, the component falls back to
// displaying value.toString() truncated — but callers should always supply metricKey.
const LABEL_TO_METRIC = {
  'Soil EC':        'soilEC',
  'Groundwater EC': 'groundwaterEC',
  'TDS':            'tds',
  'Soil pH':        'soilPH',
  'Moisture':       'moisture',
  'Water Level':    'waterLevel',
}

export function MetricCard({ label, value, unit, status, metricKey }) {
  const colorMap = {
    good:     'var(--risk-low)',
    warning:  'var(--risk-medium)',
    danger:   'var(--risk-high)',
    critical: 'var(--risk-critical)',
    neutral:  'var(--text-secondary)',
  }
  const color = colorMap[status] || 'var(--accent-seafoam)'

  // Resolve which metric key to use for formatting
  const resolvedKey = metricKey || LABEL_TO_METRIC[label]

  // Format the value — if no known metricKey, display as-is (safe fallback)
  let displayValue
  if (resolvedKey && value != null && value !== '') {
    displayValue = formatSensor(resolvedKey, value)
  } else if (value == null || value === '') {
    displayValue = '—'
  } else {
    // Unknown metric — format to at most 4 significant digits as a safety net
    const n = Number(value)
    displayValue = isFinite(n) && !isNaN(n) ? parseFloat(n.toPrecision(4)).toString() : '—'
  }

  return (
    <div
      className="card"
      style={{
        padding: '0.875rem 1rem',
        minWidth: 0,          // allow grid cell to shrink below content width
        overflow: 'hidden',   // clip if something still overflows
      }}
    >
      <div style={{
        fontSize: '0.6875rem', fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: '0.375rem',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '0.25rem',
        minWidth: 0, overflow: 'hidden',
      }}>
        <span style={{
          fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
          fontWeight: 700, color, lineHeight: 1,
          letterSpacing: '-0.02em',
          // Hard safety — should never trigger with properly formatted values
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {displayValue}
        </span>
        {unit && (
          <span style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export function getECStatus(value) {
  if (value == null) return 'neutral'
  if (value < 2) return 'good'
  if (value < 4) return 'warning'
  if (value < 8) return 'danger'
  return 'critical'
}

export function getTDSStatus(value) {
  if (value == null) return 'neutral'
  if (value < 1000) return 'good'
  if (value < 2000) return 'warning'
  if (value < 4000) return 'danger'
  return 'critical'
}

export function getPHStatus(value) {
  if (value == null) return 'neutral'
  if (value >= 5.5 && value <= 7.5) return 'good'
  if (value >= 4.5 && value <= 8.5) return 'warning'
  return 'danger'
}
