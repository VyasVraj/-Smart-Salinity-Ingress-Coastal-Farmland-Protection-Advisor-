import { Radio } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { SensorSimulator } from '../components/SensorSimulator.jsx'

export default function SimulatorPage() {
  const { data: farms = [] } = useFarms()

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
          <Radio size={20} style={{ color: '#8B5CF6' }} /> Live Sensor Simulator
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Simulate real sensor data through the same backend API pipeline that physical sensors use.
        </p>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <SensorSimulator farms={farms} />
      </div>
    </div>
  )
}
