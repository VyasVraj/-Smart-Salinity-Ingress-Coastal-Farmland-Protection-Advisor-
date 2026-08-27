import { Radio } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { SensorSimulator } from '../components/SensorSimulator.jsx'

export default function SimulatorPage() {
  const { data: farms = [] } = useFarms()

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="text-purple-400" size={22} /> Live Sensor Simulator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Simulate real sensor data through the same backend API pipeline that physical sensors use.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wide">How It Works</h2>
        <div className="text-xs text-gray-500 space-y-1">
          <p>1. Select a farm and scenario</p>
          <p>2. Start simulation — each reading goes to the <strong className="text-gray-400">real backend API</strong></p>
          <p>3. Backend validates → saves to PostgreSQL → calculates risk → triggers IBM Granite agents</p>
          <p>4. Dashboard updates <strong className="text-gray-400">in real time via Socket.IO</strong></p>
          <p className="text-yellow-400">⚠ All data is labeled SIMULATOR source — not real sensor data</p>
        </div>
      </div>

      <div className="card p-5">
        <SensorSimulator farms={farms} />
      </div>
    </div>
  )
}
