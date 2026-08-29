/**
 * Sensor Simulator â€” Clearly labeled simulation environment
 */
import { Radio, AlertTriangle } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { SensorSimulator } from '../components/SensorSimulator.jsx'

export default function SimulatorPage() {
  const { data: farms = [] } = useFarms()

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }} className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
          <Radio size={20} style={{ color: '#A78BFA' }} />
          Live Sensor Simulator
          <span className="sim-badge" style={{ marginLeft: '0.375rem' }}>SIMULATION</span>
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Simulate real sensor data through the full backend pipeline â€” validate â†’ PostgreSQL â†’ risk engine â†’ AI agents.
        </p>
      </div>

      {/* Simulation disclaimer */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem 1.125rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, marginBottom: '1.25rem' }}>
        <AlertTriangle size={16} style={{ color: '#A78BFA', flexShrink: 0, marginTop: '0.125rem' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#A78BFA', marginBottom: '0.25rem' }}>SIMULATION MODE</div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            All readings generated here are clearly labeled as <strong>SIMULATOR</strong> source in the database. They are not real sensor measurements. This uses the same backend API pipeline as physical sensors.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <SensorSimulator farms={farms} />
      </div>
    </div>
  )
}

