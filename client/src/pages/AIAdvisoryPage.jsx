/**
 * AI Farm Advisor — Salinity Shield Copilot (ENHANCED)
 */
import { useState } from 'react'
import { Cpu, Sparkles } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AIChatAdvisor } from '../components/AIChatAdvisor.jsx'
import { RiskBadge, TrendBadge } from '../components/ui/Badges.jsx'
import { formatSensor } from '../lib/utils.js'

function riskColor(level) {
  return { LOW: '#45D483', MEDIUM: '#F59E0B', HIGH: '#FF453A', CRITICAL: '#FF007A' }[level] || 'var(--text-muted)'
}

export default function AIAdvisoryPage() {
  const { data: farms = [] } = useFarms()
  const [farmId, setFarmId] = useState('')
  const activeFarmId = farmId || farms[0]?.id || ''
  const activeFarm   = farms.find(f => f.id === activeFarmId)
  const risk    = activeFarm?.riskAssessments?.[0]
  const reading = activeFarm?.readings?.[0]
  const level   = risk?.riskLevel || 'UNKNOWN'
  const col     = riskColor(level)

  const SUGGESTED_QUESTIONS = [
    'Can I continue my current crop?',
    'Why is my farm risk increasing?',
    'What should I do first?',
    'Show me the irrigation strategy',
    'How do I reduce soil salinity?',
  ]

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }} className="page-enter">
      {/* Copilot Header */}
      <div className="copilot-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(32,217,197,0.12)', border: '1px solid rgba(32,217,197,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>✦ SALINITY SHIELD COPILOT</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#45D483', background: 'rgba(69,212,131,0.1)', border: '1px solid rgba(69,212,131,0.2)', borderRadius: 999, padding: '2px 10px', letterSpacing: '0.05em' }}>● ONLINE</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.125rem 0 0', lineHeight: 1.5 }}>
                AI Farm Advisor · Powered by IBM Granite · Context-aware responses using your farm data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Chat panel */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Farm selector */}
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</span>
            <select className="form-input" style={{ minWidth: 200, width: 'auto' }} value={activeFarmId} onChange={e => setFarmId(e.target.value)}>
              {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
            </select>
          </div>
          {activeFarm ? (
            <AIChatAdvisor farmId={activeFarmId} farmName={activeFarm.farmName} />
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Cpu size={24} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              Loading farms…
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Farm context */}
          {activeFarm && (
            <div className="ai-panel" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <Sparkles size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>FARM CONTEXT</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{activeFarm.farmName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>{activeFarm.district}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Level</span>
                  <RiskBadge level={level} />
                </div>
                {risk && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk Score</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: col }}>{risk.riskScore}/100</span>
                  </div>
                )}
                {risk && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trend</span>
                    <TrendBadge trend={risk.trend} />
                  </div>
                )}
                {reading && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Soil EC</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.875rem' }}>{formatSensor('soilEC', reading.soilEC)} dS/m</span>
                  </div>
                )}
                {reading && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GW EC</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{formatSensor('groundwaterEC', reading.groundwaterEC)} dS/m</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IBM Granite info */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <span className="ai-dot" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>IBM Granite AI</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Powered by IBM Granite LLM via watsonx.ai. When credentials are configured, AI uses your actual farm data, sensor readings, and risk history for contextual responses.
            </p>
          </div>

          {/* Suggested questions */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={12} style={{ color: 'var(--accent-cyan)' }} />
              <span className="section-label" style={{ color: 'var(--accent-cyan)' }}>SUGGESTED QUESTIONS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  className="suggestion-btn"
                  style={{ justifyContent: 'flex-start', borderRadius: 8, fontSize: '0.75rem', padding: '0.5rem 0.75rem', whiteSpace: 'normal', textAlign: 'left' }}
                  onClick={() => {
                    const event = new CustomEvent('advisory-question', { detail: q })
                    window.dispatchEvent(event)
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
