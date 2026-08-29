import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api.js'

/**
 * Manual reading entry form
 */
export function ReadingForm({ farmId, onSuccess }) {
  const [form, setForm] = useState({
    soilEC: '',
    groundwaterEC: '',
    tds: '',
    soilPH: '7.0',
    moisture: '40',
    waterLevel: '5',
    source: 'MANUAL',
  })

  const mutation = useMutation({
    mutationFn: (data) => api.readings.create({ ...data, farmId }),
    onSuccess: (data) => {
      onSuccess && onSuccess(data)
      setForm(f => ({ ...f, soilEC: '', groundwaterEC: '', tds: '' }))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      soilEC: parseFloat(form.soilEC),
      groundwaterEC: parseFloat(form.groundwaterEC),
      tds: parseFloat(form.tds),
      soilPH: parseFloat(form.soilPH),
      moisture: parseFloat(form.moisture),
      waterLevel: parseFloat(form.waterLevel),
      source: 'MANUAL',
    })
  }

  const fields = [
    { key: 'soilEC', label: 'Soil EC (dS/m)', hint: '0 – 20', required: true },
    { key: 'groundwaterEC', label: 'Groundwater EC (dS/m)', hint: '0 – 20', required: true },
    { key: 'tds', label: 'TDS (ppm)', hint: '0 – 10000', required: true },
    { key: 'soilPH', label: 'Soil pH', hint: '3 – 11', required: false },
    { key: 'moisture', label: 'Moisture (%)', hint: '0 – 100', required: false },
    { key: 'waterLevel', label: 'Water Level (m)', hint: '0 – 50', required: false },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              {f.label}{f.required && <span style={{ color: 'var(--risk-high)', marginLeft: 4 }}>*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              style={{ width: '100%' }}
              placeholder={f.hint}
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              required={f.required}
            />
          </div>
        ))}
      </div>

      {mutation.error && (
        <p style={{ color: 'var(--risk-high)', fontSize: '0.875rem', background: 'rgba(228,87,86,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
          {mutation.error.message}
        </p>
      )}

      {mutation.data && (
        <p style={{ color: 'var(--risk-low)', fontSize: '0.875rem', background: 'rgba(63,174,90,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
          ✓ Reading submitted — Risk: {mutation.data.riskAssessment?.riskLevel} | 
          Score: {mutation.data.riskAssessment?.riskScore} | 
          Trend: {mutation.data.riskAssessment?.trend}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="btn-primary w-full disabled:opacity-50"
      >
        {mutation.isPending ? 'Submitting...' : 'Submit Reading'}
      </button>
    </form>
  )
}
