// Reusable badge components — coastal design system

export function RiskBadge({ level, size = 'sm' }) {
  const sizeStyle = size === 'lg'
    ? { fontSize: '0.75rem', padding: '0.25rem 0.7rem' }
    : { fontSize: '0.6875rem', padding: '0.15rem 0.55rem' }
  return (
    <span className={`risk-badge risk-badge-${level || 'UNKNOWN'}`} style={sizeStyle}>
      {level || '—'}
    </span>
  )
}

export function TrendBadge({ trend }) {
  const map = {
    IMPROVING:         { text: '↓ Improving',         color: 'var(--risk-low)' },
    STABLE:            { text: '→ Stable',             color: '#3A9AB5' },
    WORSENING:         { text: '↑ Worsening',          color: 'var(--risk-medium)' },
    RAPIDLY_WORSENING: { text: '⬆ Rapidly Worsening', color: 'var(--risk-high)' },
  }
  const cfg = map[trend] || { text: trend || '—', color: 'var(--text-muted)' }
  return (
    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: cfg.color }}>
      {cfg.text}
    </span>
  )
}

export function DemoBadge() {
  return <span className="demo-badge">⚠ Demo Data</span>
}

export function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--accent-green)' }}>
      <span className="live-dot" />
      LIVE
    </span>
  )
}

export function SeverityBadge({ level }) {
  const map = {
    LOW:      { label: 'Low',      cls: 'risk-badge-LOW' },
    MEDIUM:   { label: 'Medium',   cls: 'risk-badge-MEDIUM' },
    HIGH:     { label: 'High',     cls: 'risk-badge-HIGH' },
    CRITICAL: { label: 'Critical', cls: 'risk-badge-CRITICAL' },
  }
  const cfg = map[level] || { label: level || '—', cls: 'risk-badge-UNKNOWN' }
  return (
    <span className={`risk-badge ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
