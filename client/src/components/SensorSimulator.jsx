import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Play, Square, Settings } from 'lucide-react'
import { api } from '../lib/api.js'

const SCENARIOS = {
  stable: {
    label: '🟢 Healthy / Stable',
    description: 'Values remain stable within safe ranges',
    base: { soilEC: 1.5, groundwaterEC: 1.0, tds: 600, soilPH: 6.8, moisture: 45, waterLevel: 8 },
    delta: { soilEC: 0.05, groundwaterEC: 0.03, tds: 20 },
    max: { soilEC: 2.2, groundwaterEC: 1.5, tds: 900 },
  },
  gradual: {
    label: '🟡 Gradual Salinity Increase',
    description: 'EC rises gradually: 5.2 → 5.5 → 5.9 → 6.4',
    base: { soilEC: 2.5, groundwaterEC: 1.8, tds: 1200, soilPH: 7.1, moisture: 38, waterLevel: 6 },
    delta: { soilEC: 0.35, groundwaterEC: 0.25, tds: 150 },
    max: { soilEC: 7.5, groundwaterEC: 5.5, tds: 4500 },
  },
  rapid: {
    label: '🔴 Rapid Salinity Ingress',
    description: 'EC spikes rapidly: 5.2 → 6.1 → 7.4 → 8.6 → 10.0',
    base: { soilEC: 4.0, groundwaterEC: 3.0, tds: 2000, soilPH: 7.5, moisture: 30, waterLevel: 4 },
    delta: { soilEC: 1.1, groundwaterEC: 0.9, tds: 500 },
    max: { soilEC: 14.0, groundwaterEC: 11.0, tds: 8000 },
  },
  recovery: {
    label: '🔵 Recovery / Improvement',
    description: 'Salinity decreasing: 8.2 → 7.7 → 7.1 → 6.6 → 6.0',
    base: { soilEC: 8.5, groundwaterEC: 7.0, tds: 4500, soilPH: 8.2, moisture: 22, waterLevel: 2.5 },
    delta: { soilEC: -0.55, groundwaterEC: -0.45, tds: -250 },
    min: { soilEC: 0.5, groundwaterEC: 0.3, tds: 100 },
  },
}

export function SensorSimulator({ farms = [] }) {
  const [farmId, setFarmId] = useState(farms[0]?.id || '')
  const [scenario, setScenario] = useState('gradual')
  const [interval, setInterval_] = useState(5)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [log, setLog] = useState([])
  const [currentValues, setCurrentValues] = useState(null)
  const timerRef = useRef(null)
  const stepRef = useRef(0)

  const mutation = useMutation({
    mutationFn: (data) => api.readings.create(data),
  })

  const addLog = (msg, type = 'info') => {
    setLog(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20))
  }

  const getNextValues = (scenarioKey, step) => {
    const s = SCENARIOS[scenarioKey]
    const jitter = () => (Math.random() - 0.5) * 0.05

    let soilEC = s.base.soilEC + (s.delta?.soilEC || 0) * step + jitter()
    let gwEC = s.base.groundwaterEC + (s.delta?.groundwaterEC || 0) * step + jitter()
    let tds = s.base.tds + (s.delta?.tds || 0) * step

    if (s.max) {
      soilEC = Math.min(soilEC, s.max.soilEC)
      gwEC = Math.min(gwEC, s.max.groundwaterEC)
      tds = Math.min(tds, s.max.tds)
    }
    if (s.min) {
      soilEC = Math.max(soilEC, s.min.soilEC)
      gwEC = Math.max(gwEC, s.min.groundwaterEC)
      tds = Math.max(tds, s.min.tds)
    }

    return {
      farmId,
      soilEC: Math.max(0.1, Math.round(soilEC * 100) / 100),
      groundwaterEC: Math.max(0.1, Math.round(gwEC * 100) / 100),
      tds: Math.max(50, Math.round(tds)),
      soilPH: Math.max(3, Math.min(11, s.base.soilPH + (Math.random() - 0.5) * 0.2)),
      moisture: Math.max(5, Math.min(95, s.base.moisture + (Math.random() - 0.5) * 3)),
      waterLevel: Math.max(0.1, s.base.waterLevel + (Math.random() - 0.5) * 0.2),
      source: 'SIMULATOR',
    }
  }

  const runStep = async () => {
    const stepN = stepRef.current
    const values = getNextValues(scenario, stepN)
    setCurrentValues(values)
    setStep(stepN)

    try {
      const result = await api.readings.create(values)
      addLog(
        `Step ${stepN + 1}: soilEC=${values.soilEC} → Risk: ${result.riskAssessment?.riskLevel} (${result.riskAssessment?.riskScore})`,
        result.riskAssessment?.riskLevel === 'CRITICAL' ? 'critical'
          : result.riskAssessment?.riskLevel === 'HIGH' ? 'danger'
          : result.riskAssessment?.riskLevel === 'MEDIUM' ? 'warning'
          : 'success'
      )
      stepRef.current++
    } catch (err) {
      addLog(`Error: ${err.message}`, 'danger')
    }
  }

  const start = () => {
    if (!farmId) { addLog('Select a farm first', 'danger'); return }
    stepRef.current = 0
    setStep(0)
    setRunning(true)
    addLog(`▶ Started: ${SCENARIOS[scenario].label}`, 'info')
    runStep()
    timerRef.current = setInterval(runStep, interval * 1000)
  }

  const stop = () => {
    clearInterval(timerRef.current)
    setRunning(false)
    addLog('⏹ Simulation stopped', 'info')
  }

  useEffect(() => {
    if (farms.length && !farmId) setFarmId(farms[0].id)
  }, [farms])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  const logColors = { info: 'text-blue-400', success: 'text-green-400', warning: 'text-amber-400', danger: 'text-red-400', critical: 'text-purple-400' }

  return (
    <div className="space-y-5">
      {/* Demo banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm">
        <span className="text-yellow-400 font-semibold">⚠ SIMULATED DATA</span>
        <span className="text-gray-400 ml-2">All simulator readings are clearly labeled as SIMULATOR source.</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Farm</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            value={farmId}
            onChange={e => setFarmId(e.target.value)}
            disabled={running}
          >
            {farms.map(f => (
              <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Interval (seconds)</label>
          <input
            type="number"
            min="2"
            max="60"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            value={interval}
            onChange={e => setInterval_(parseInt(e.target.value, 10))}
            disabled={running}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-2">Scenario</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => !running && setScenario(key)}
              disabled={running}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                scenario === key
                  ? 'border-blue-500 bg-blue-500/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-medium text-sm">{s.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current values preview */}
      {currentValues && running && (
        <div className="bg-gray-800 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Current Reading (Step {step + 1})</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Soil EC:</span> <span className="text-red-400 font-bold">{currentValues.soilEC}</span> dS/m</div>
            <div><span className="text-gray-500">GW EC:</span> <span className="text-blue-400 font-bold">{currentValues.groundwaterEC}</span> dS/m</div>
            <div><span className="text-gray-500">TDS:</span> <span className="text-amber-400 font-bold">{currentValues.tds}</span> ppm</div>
          </div>
        </div>
      )}

      {/* Start/Stop */}
      <div className="flex gap-3">
        {!running ? (
          <button onClick={start} className="btn-primary flex items-center gap-2">
            <Play size={16} /> Start Simulation
          </button>
        ) : (
          <button onClick={stop} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Square size={16} /> Stop Simulation
          </button>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Simulation Log</p>
          <div className="bg-gray-950 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 flex-shrink-0">{entry.ts}</span>
                <span className={logColors[entry.type] || 'text-gray-400'}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
