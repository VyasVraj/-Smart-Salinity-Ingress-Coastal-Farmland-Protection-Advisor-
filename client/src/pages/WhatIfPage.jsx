import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ChevronRight } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { api } from '../lib/api.js'
import { RiskBadge } from '../components/ui/Badges.jsx'
import { useMutation } from '@tanstack/react-query'

const SCENARIOS = [
  { id: 'CONTINUE_CURRENT',   label: 'Continue Current Practice',      icon: '📌', desc: 'No change — observe current trajectory.' },
  { id: 'SWITCH_CROP',        label: 'Switch to Salt-Tolerant Crop',   icon: '🌾', desc: 'Adopt barley, date palm, or salt-tolerant cotton.' },
  { id: 'IMPROVE_IRRIGATION', label: 'Improve Irrigation Management',  icon: '💧', desc: 'Drip irrigation + leaching fraction + water quality testing.' },
  { id: 'IMPROVE_DRAINAGE',   label: 'Improve Drainage',               icon: '🚰', desc: 'Sub-surface drainage + drainage channels.' },
  { id: 'COMBINED',           label: 'Combined Intervention',          icon: '⚡', desc: 'Crop switch + irrigation + drainage. Most effective.' },
]

function riskCol(level) {
  return { LOW: 'var(--risk-low)', MEDIUM: 'var(--risk-medium)', HIGH: 'var(--risk-high)', CRITICAL: 'var(--risk-critical)' }[level] || 'var(--text-muted)'
}

function CompareRow({ label, current, simulated, unit = '', invertGood = false }) {
  const improved = typeof current === 'number' && typeof simulated === 'number'
    ? (invertGood ? simulated > current : simulated < current) : false
  const changed = typeof current === 'number' && typeof simulated === 'number' && Math.abs(simulated - current) > 0.5
  const fmt = v => typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: 140 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{fmt(current)}{unit}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: changed ? (improved ? 'var(--risk-low)' : 'var(--risk-high)') : 'var(--text-muted)' }}>
          {fmt(simulated)}{unit}
        </span>
        {changed && <span style={{ fontSize: '0.75rem', color: improved ? 'var(--risk-low)' : 'var(--risk-high)' }}>{improved ? '↓' : '↑'}</span>}
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
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
          What-If Scenario Simulator
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Model estimated impact of farm interventions.{' '}
          <span style={{ color: 'var(--risk-medium)' }}>All results are simulation estimates — not guaranteed outcomes.</span>
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Select Farm</label>
          <select className="form-input" value={farmId} onChange={e => setSelectedFarmId(e.target.value)}>
            {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>Language</label>
          <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
        </div>
      </div>

      {/* Scenarios */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="section-label" style={{ marginBottom: '0.625rem' }}>Select Scenario</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedScenario(s.id)}
              style={{
                textAlign: 'left', padding: '0.875rem', borderRadius: 9,
                border: `1px solid ${selectedScenario === s.id ? 'rgba(45,212,191,0.4)' : 'var(--border)'}`,
                background: selectedScenario === s.id ? 'rgba(45,212,191,0.06)' : 'var(--bg-elevated)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>{s.icon}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.label}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" style={{ gap: '0.4rem', marginBottom: '1.25rem' }}
        onClick={() => mutation.mutate()} disabled={!farmId || mutation.isPending}>
        {mutation.isPending ? 'Running simulation…' : 'Run Scenario Simulation'}
      </button>

      {mutation.isError && (
        <div style={{ background: 'rgba(228,87,86,0.08)', border: '1px solid rgba(228,87,86,0.2)', borderRadius: 9, padding: '0.875rem', color: 'var(--risk-high)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {mutation.error?.message || 'Simulation failed'}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Scenario label */}
          <div style={{ background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 9, padding: '0.875rem 1.125rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-seafoam)', marginBottom: '0.25rem' }}>Simulation Estimate</div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              Scenario: <strong style={{ color: 'var(--text-secondary)' }}>{result.scenario?.label}</strong> · Timeframe: {result.scenario?.timeframeWeeks} weeks
            </p>
          </div>

          {/* Current vs Simulated */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '1.125rem', textAlign: 'center' }}>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Current State</div>
              <RiskBadge level={result.current?.riskLevel} size="lg" />
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: riskCol(result.current?.riskLevel), marginTop: '0.5rem', lineHeight: 1 }}>
                {result.current?.riskScore}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>Health: {result.current?.farmHealth}/100</div>
            </div>
            <div style={{ background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 10, padding: '1.125rem', textAlign: 'center' }}>
              <div className="section-label" style={{ marginBottom: '0.75rem' }}>Simulated State *</div>
              <RiskBadge level={result.simulated?.riskLevel} size="lg" />
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: riskCol(result.simulated?.riskLevel), marginTop: '0.5rem', lineHeight: 1 }}>
                {result.simulated?.riskScore}<span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>Health: {result.simulated?.farmHealth}/100</div>
            </div>
          </div>

          {/* Impact */}
          <div className="card" style={{ padding: '1.125rem' }}>
            <div className="section-label" style={{ marginBottom: '0.75rem' }}>Estimated Impact</div>
            <CompareRow label="Risk Score"     current={result.current?.riskScore}     simulated={result.simulated?.riskScore} />
            <CompareRow label="Farm Health"    current={result.current?.farmHealth}    simulated={result.simulated?.farmHealth} invertGood />
            <CompareRow label="Soil EC"        current={result.current?.soilEC}        simulated={result.simulated?.soilEC}    unit=" dS/m" />
            <CompareRow label="Groundwater EC" current={result.current?.groundwaterEC} simulated={result.simulated?.groundwaterEC} unit=" dS/m" />
            <CompareRow label="Crop Risk"      current={result.current?.cropVulnerability} simulated={result.simulated?.cropVulnerability} />
            <CompareRow label="Water Stress"   current={result.current?.waterStress}   simulated={result.simulated?.waterStress} />
          </div>

          {/* AI Explanation */}
          {result.graniteExplanation && (
            <div style={{ background: 'rgba(25,118,210,0.06)', border: '1px solid rgba(25,118,210,0.2)', borderRadius: 9, padding: '1.125rem' }}>
              <div className="section-label" style={{ marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>AI Analysis — IBM Granite</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result.graniteExplanation}</p>
            </div>
          )}

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            * {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
