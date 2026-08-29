/**
 * DataBadge — Clearly labels data provenance:
 *   LIVE DATA  •  SIMULATION  •  MODEL ESTIMATE
 *
 * Usage:
 *   <DataBadge type="live" />
 *   <DataBadge type="sim" />
 *   <DataBadge type="model" />
 */
export default function DataBadge({ type = 'live' }) {
  if (type === 'live') {
    return (
      <span className="data-badge-live">
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
        Live Data
      </span>
    )
  }
  if (type === 'sim') {
    return <span className="data-badge-sim">⚠ Simulation</span>
  }
  if (type === 'model') {
    return <span className="data-badge-model">◌ Model Estimate</span>
  }
  return null
}
