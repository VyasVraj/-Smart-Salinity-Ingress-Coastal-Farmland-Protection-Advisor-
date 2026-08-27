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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-xs text-gray-400 mb-1">
              {f.label}{f.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={f.hint}
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              required={f.required}
            />
          </div>
        ))}
      </div>

      {mutation.error && (
        <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
          {mutation.error.message}
        </p>
      )}

      {mutation.data && (
        <p className="text-green-400 text-sm bg-green-500/10 rounded-lg px-3 py-2">
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
