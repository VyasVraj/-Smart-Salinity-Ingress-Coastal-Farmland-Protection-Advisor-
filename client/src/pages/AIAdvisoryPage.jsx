import { useState } from 'react'
import { Cpu } from 'lucide-react'
import { useFarms } from '../hooks/useFarm.js'
import { AIChatAdvisor } from '../components/AIChatAdvisor.jsx'

export default function AIAdvisoryPage() {
  const { data: farms = [] } = useFarms()
  const [farmId, setFarmId] = useState('')
  const activeFarmId = farmId || farms[0]?.id || ''
  const activeFarm = farms.find(f => f.id === activeFarmId)

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
          <Cpu size={20} style={{ color: 'var(--accent-seafoam)' }} /> AI Farm Advisor
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Ask questions about your farm — answers use your actual data, risk levels, and AI advisories.
        </p>
      </div>

      {/* Farm selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Farm:</label>
        <select className="form-input" style={{ minWidth: 200 }} value={activeFarmId} onChange={e => setFarmId(e.target.value)}>
          {farms.map(f => <option key={f.id} value={f.id}>{f.farmName} ({f.district})</option>)}
        </select>
      </div>

      {/* Chat */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: '1rem' }}>
        {activeFarm ? (
          <AIChatAdvisor farmId={activeFarmId} farmName={activeFarm.farmName} />
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading farms…
          </div>
        )}
      </div>

      {/* IBM info */}
      <div style={{ background: 'rgba(25,118,210,0.05)', border: '1px solid rgba(25,118,210,0.15)', borderRadius: 9, padding: '0.875rem 1.125rem', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--accent-seafoam)' }}>IBM Granite AI</strong> — Chat responses are powered by IBM Granite LLM via watsonx.ai.
        When IBM credentials are configured, the AI uses your actual farm data, recent readings, risk assessments,
        and existing advisories to give contextual answers.
      </div>
    </div>
  )
}
