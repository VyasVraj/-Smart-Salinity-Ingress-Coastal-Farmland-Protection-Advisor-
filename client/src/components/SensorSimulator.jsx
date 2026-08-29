import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Play, Square } from 'lucide-react'
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

  const logColor = { info: 'var(--accent-seafoam)', success: 'var(--risk-low)', warning: 'var(--risk-medium)', danger: 'var(--risk-high)', critical: 'var(--risk-critical)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Demo banner */}
      <div style={{ background: 'rgba(230,162,60,0.08)', border: '1px solid rgba(230,162,60,0.25)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--risk-medium)', fontWeight: 600 }}>⚠ SIMULATED DATA</span>
        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>All simulator readings are clearly labeled as SIMULATOR source.</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Farm</label>
          <select
            className="form-input"
            style={{ width: '100%' }}
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
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Interval (seconds)</label>
          <input
            type="number"
            min="2"
            max="60"
            className="form-input"
            style={{ width: '100%' }}
            value={interval}
            onChange={e => setInterval_(parseInt(e.target.value, 10))}
            disabled={running}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Scenario</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => !running && setScenario(key)}
              disabled={running}
              style={{
                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 8,
                border: `1px solid ${scenario === key ? 'var(--accent-seafoam)' : 'var(--border)'}`,
                background: scenario === key ? 'rgba(45,212,191,0.06)' : 'var(--bg-elevated)',
                color: scenario === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: running ? 'not-allowed' : 'pointer',
                opacity: running ? 0.5 : 1,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current values preview */}
      {currentValues && running && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.75rem 1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Reading (Step {step + 1})</p>
          <div className="grid grid-cols-3 gap-3" style={{ fontSize: '0.875rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Soil EC:</span> <span style={{ color: 'var(--risk-high)', fontWeight: 700 }}>{currentValues.soilEC}</span> dS/m</div>
            <div><span style={{ color: 'var(--text-muted)' }}>GW EC:</span> <span style={{ color: 'var(--accent-seafoam)', fontWeight: 700 }}>{currentValues.groundwaterEC}</span> dS/m</div>
            <div><span style={{ color: 'var(--text-muted)' }}>TDS:</span> <span style={{ color: 'var(--risk-medium)', fontWeight: 700 }}>{currentValues.tds}</span> ppm</div>
          </div>
        </div>
      )}

      {/* Start/Stop */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {!running ? (
          <button onClick={start} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={16} /> Start Simulation
          </button>
        ) : (
          <button onClick={stop} style={{ background: 'var(--risk-high)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Square size={16} /> Stop Simulation
          </button>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Simulation Log</p>
          <div style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '0.75rem', maxHeight: 192, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{entry.ts}</span>
                <span style={{ color: logColor[entry.type] || 'var(--text-secondary)' }}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
