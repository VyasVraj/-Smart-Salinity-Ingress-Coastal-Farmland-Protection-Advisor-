/**
 * What-If Scenario Simulator — Feature 2
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FlaskConical, ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { api } from '../lib/api.js'
import { RiskBadge } from '../components/ui/Badges.jsx'

const SCENARIOS = [
  { id: 'CONTINUE_CURRENT',    label: 'Continue Current Practice',      icon: '📌', desc: 'No change — observe current trajectory.' },
  { id: 'SWITCH_CROP',         label: 'Switch to Salt-Tolerant Crop',   icon: '🌾', desc: 'Adopt barley, date palm, or salt-tolerant cotton.' },
  { id: 'IMPROVE_IRRIGATION',  label: 'Improve Irrigation Management',  icon: '💧', desc: 'Drip irrigation + leaching fraction + water quality testing.' },
  { id: 'IMPROVE_DRAINAGE',    label: 'Improve Drainage',               icon: '🚰', desc: 'Sub-surface drainage + drainage channels.' },
  { id: 'COMBINED',            label: 'Combined Intervention',          icon: '⚡', desc: 'Crop switch + irrigation + drainage. Most effective.' },
]

function DeltaBadge({ current, simulated, unit = '' }) {
  const diff = simulated - current
  if (Math.abs(diff) < 0.5) return <span className="text-gray-500 text-xs">≈ no change</span>
  const positive = diff > 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-red-400' : 'text-green-400'}`}>
      {positive ? '▲' : '▼'} {Math.abs(Math.round(diff * 10) / 10)}{unit}
    </span>
  )
}

function CompareRow({ label, current, simulated, unit = '', invertGood = false }) {
  const improved = invertGood ? simulated > current : simulated < current
  const changed  = Math.abs(simulated - current) > 0.5
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/50 text-sm">
      <span className="text-gray-400 w-40">{label}</span>
      <div className="flex items-center gap-3 flex-1 justify-end">
        <span className="text-gray-300 font-mono">{typeof current === 'number' ? (current % 1 === 0 ? current : current.toFixed(2)) : current}{unit}</span>
        <ArrowRight size={14} className="text-gray-600" />
        <span className={`font-mono font-semibold ${changed ? (improved ? 'text-green-400' : 'text-red-400') : 'text-gray-400'}`}>
          {typeof simulated === 'number' ? (simulated % 1 === 0 ? simulated : simulated.toFixed(2)) : simulated}{unit}
        </span>
        {changed && (
          improved
            ? <TrendingDown size={14} className="text-green-400" />
            : <TrendingUp size={14} className="text-red-400" />
        )}
      </div>
    </div>
  )
}

export default function WhatIfPage() {
  const { data: farms = [] } = useFarms()
  const [selectedFarmId, setSelectedFarmId] = useState('')
  const [selectedScenario, setSelectedScenario] = useState('IMPROVE_IRRIGATION')
  const [language, setLanguage] = useState('en')
  const farmId = selectedFarmId || farms[0]?.id || ''

  const mutation = useMutation({
    mutationFn: () => api.analytics.whatIf(farmId, selectedScenario, language),
  })

  const result = mutation.data

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="text-cyan-400" size={22} /> What-If Scenario Simulator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Model the estimated impact of farm interventions. <span className="text-yellow-400">All results are simulation estimates — not guaranteed outcomes.</span>
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Select Farm</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            value={farmId}
            onChange={e => setSelectedFarmId(e.target.value)}
          >
            {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Language</label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
        </div>
      </div>

      {/* Scenario selection */}
      <div>
        <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Select Scenario</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedScenario === s.id
                  ? 'border-cyan-500 bg-cyan-500/10 text-white'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={!farmId || mutation.isPending}
        className="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        <FlaskConical size={16} />
        {mutation.isPending ? 'Running simulation...' : 'Run Scenario Simulation'}
      </button>

      {mutation.isError && (
        <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          {mutation.error?.message || 'Simulation failed'}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="card p-4 bg-cyan-500/5 border-cyan-500/20">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={16} className="text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Model Simulation / Estimated Outcome</span>
            </div>
            <p className="text-xs text-gray-500">
              Scenario: <strong className="text-gray-300">{result.scenario?.label}</strong> · 
              Estimated timeframe: {result.scenario?.timeframeWeeks} weeks
            </p>
          </div>

          {/* Risk comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 text-center">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Current State</p>
              <RiskBadge level={result.current?.riskLevel} size="lg" />
              <p className="text-2xl font-bold text-white mt-2">{result.current?.riskScore}<span className="text-xs text-gray-500">/100</span></p>
              <p className="text-xs text-gray-500 mt-1">Farm Health: {result.current?.farmHealth}/100</p>
            </div>
            <div className="card p-5 text-center border-cyan-500/30 bg-cyan-500/5">
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Simulated State*</p>
              <RiskBadge level={result.simulated?.riskLevel} size="lg" />
              <p className="text-2xl font-bold text-white mt-2">{result.simulated?.riskScore}<span className="text-xs text-gray-500">/100</span></p>
              <p className="text-xs text-gray-500 mt-1">Farm Health: {result.simulated?.farmHealth}/100</p>
            </div>
          </div>

          {/* Detailed comparison */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Estimated Impact</h3>
            <CompareRow label="Risk Score"       current={result.current?.riskScore}     simulated={result.simulated?.riskScore} />
            <CompareRow label="Farm Health"      current={result.current?.farmHealth}    simulated={result.simulated?.farmHealth} invertGood />
            <CompareRow label="Soil EC"          current={result.current?.soilEC}        simulated={result.simulated?.soilEC}    unit=" dS/m" />
            <CompareRow label="Groundwater EC"   current={result.current?.groundwaterEC} simulated={result.simulated?.groundwaterEC} unit=" dS/m" />
            <CompareRow label="Crop Risk"        current={result.current?.cropVulnerability} simulated={result.simulated?.cropVulnerability} />
            <CompareRow label="Water Stress"     current={result.current?.waterStress}   simulated={result.simulated?.waterStress} />
          </div>

          {/* Granite explanation */}
          {result.graniteExplanation && (
            <div className="card p-5 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400 text-sm font-semibold">🧠 AI Analysis</span>
                {!result.graniteExplanation.includes('mModel') && <span className="text-xs text-gray-600">IBM Granite</span>}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result.graniteExplanation}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-xs text-gray-600 bg-gray-900 rounded-lg p-3 border border-gray-800">
            * {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
