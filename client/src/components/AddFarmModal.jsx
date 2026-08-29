/**
 * AddFarmModal — complete Add New Farm workflow
 *
 * - Full inline validation matching the backend Zod schema
 * - Optional initial salinity reading (triggers risk assessment immediately)
 * - On success: invalidates farms query + calls onSuccess(newFarm)
 *   so the caller can navigate/select the new farm without a page refresh
 */

import { useState } from 'react'
import { X, MapPin, Leaf, Droplets, FlaskConical, ChevronDown, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useCreateFarm } from '../hooks/useFarm.js'

// ---- Dropdown option lists ----
const SOIL_TYPES = [
  'Clay', 'Clay Loam', 'Sandy Clay', 'Sandy Clay Loam', 'Sandy Loam',
  'Loamy Sand', 'Sand', 'Silty Clay', 'Silty Clay Loam', 'Silt Loam',
  'Black Cotton Soil', 'Laterite', 'Alluvial', 'Saline-Alkali Soil',
]

const IRRIGATION_SOURCES = [
  'Borewell', 'Canal', 'Drip Irrigation', 'River', 'Rainwater Harvesting',
  'Sprinkler', 'Pond / Tank', 'Groundwater', 'Mixed Sources',
]

const CROPS = [
  'Cotton', 'Wheat', 'Rice', 'Bajra (Pearl Millet)', 'Jowar (Sorghum)',
  'Groundnut', 'Sesame', 'Castor', 'Sunflower', 'Sugarcane',
  'Onion', 'Garlic', 'Potato', 'Tomato', 'Brinjal',
  'Barley', 'Lentils', 'Mustard', 'Cumin', 'Fennel',
  'Date Palm', 'Banana', 'Mango', 'Coconut', 'Pomegranate',
  'Salt-Tolerant Cotton', 'Grass / Fodder', 'Fallow / No Crop', 'Mixed Crops',
]

const GUJARAT_DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha',
  'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod',
  'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar',
  'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana',
  'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan',
  'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
  'Tapi', 'Vadodara', 'Valsad',
]

const EMPTY_FORM = {
  // Farm Info
  farmName: '',
  farmerName: '',
  district: '',
  location: '',
  landArea: '',
  // Crop / Soil
  currentCrop: '',
  soilType: '',
  irrigationSource: '',
  // Coordinates
  latitude: '',
  longitude: '',
  // Initial salinity (optional — enables immediate risk assessment)
  soilEC: '',
  groundwaterEC: '',
  tds: '',
  soilPH: '',
  moisture: '',
}

function validate(form) {
  const errors = {}
  if (!form.farmName.trim()) errors.farmName = 'Farm name is required'
  else if (form.farmName.trim().length < 2) errors.farmName = 'Must be at least 2 characters'
  else if (form.farmName.trim().length > 100) errors.farmName = 'Must be under 100 characters'

  if (!form.farmerName.trim()) errors.farmerName = 'Farmer / owner name is required'

  if (!form.district) errors.district = 'District is required'

  if (!form.location.trim()) errors.location = 'Location / village is required'

  const area = parseFloat(form.landArea)
  if (!form.landArea) errors.landArea = 'Farm area is required'
  else if (isNaN(area) || area <= 0) errors.landArea = 'Must be a positive number'

  if (!form.currentCrop) errors.currentCrop = 'Crop is required'
  if (!form.soilType) errors.soilType = 'Soil type is required'
  if (!form.irrigationSource) errors.irrigationSource = 'Irrigation source is required'

  const lat = parseFloat(form.latitude)
  if (!form.latitude) errors.latitude = 'Latitude is required'
  else if (isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Must be between -90 and 90'

  const lon = parseFloat(form.longitude)
  if (!form.longitude) errors.longitude = 'Longitude is required'
  else if (isNaN(lon) || lon < -180 || lon > 180) errors.longitude = 'Must be between -180 and 180'

  // Salinity fields — optional, but if entered they must be valid
  if (form.soilEC !== '') {
    const v = parseFloat(form.soilEC)
    if (isNaN(v) || v < 0 || v > 50) errors.soilEC = 'Must be 0 – 50 dS/m'
  }
  if (form.groundwaterEC !== '') {
    const v = parseFloat(form.groundwaterEC)
    if (isNaN(v) || v < 0 || v > 50) errors.groundwaterEC = 'Must be 0 – 50 dS/m'
  }
  if (form.tds !== '') {
    const v = parseFloat(form.tds)
    if (isNaN(v) || v < 0 || v > 50000) errors.tds = 'Must be 0 – 50000 ppm'
  }
  if (form.soilPH !== '') {
    const v = parseFloat(form.soilPH)
    if (isNaN(v) || v < 3 || v > 11) errors.soilPH = 'Must be 3 – 11'
  }
  if (form.moisture !== '') {
    const v = parseFloat(form.moisture)
    if (isNaN(v) || v < 0 || v > 100) errors.moisture = 'Must be 0 – 100%'
  }

  return errors
}

function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
        {label}
        {required && <span style={{ color: 'var(--risk-high)', marginLeft: 2 }}>*</span>}
        {hint && <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({hint})</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--risk-high)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, step, min, max, disabled }) {
  return (
    <input
      type={type}
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
        borderRadius: 8,
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)',
        outline: 'none',
        transition: 'border-color 0.15s',
        boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1,
      }}
    />
  )
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        disabled={disabled}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          appearance: 'none',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 8,
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
    </div>
  )
}

function SectionHeader({ icon: Icon, label, color = 'var(--accent-seafoam)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color, paddingTop: '0.5rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--border)' }}>
      <Icon size={13} />
      {label}
    </div>
  )
}

export function AddFarmModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const createFarm = useCreateFarm()

  if (!isOpen) return null

  const set = (key) => (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, [key]: val }))
    if (touched[key]) {
      // Re-validate only the touched field
      const newErrors = validate({ ...form, [key]: val })
      setErrors(prev => ({ ...prev, [key]: newErrors[key] }))
    }
  }

  const blur = (key) => () => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const newErrors = validate(form)
    setErrors(prev => ({ ...prev, [key]: newErrors[key] }))
  }

  const hasInitialReading =
    form.soilEC !== '' || form.groundwaterEC !== '' || form.tds !== ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    // Mark all fields touched
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])))

    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload = {
      farmName:         form.farmName.trim(),
      farmerName:       form.farmerName.trim(),
      district:         form.district,
      location:         form.location.trim(),
      landArea:         parseFloat(form.landArea),
      currentCrop:      form.currentCrop,
      soilType:         form.soilType,
      irrigationSource: form.irrigationSource,
      latitude:         parseFloat(form.latitude),
      longitude:        parseFloat(form.longitude),
    }

    // Include initial salinity reading if at least the 3 required fields are filled
    if (
      form.soilEC !== '' &&
      form.groundwaterEC !== '' &&
      form.tds !== ''
    ) {
      payload.initialReading = {
        soilEC:        parseFloat(form.soilEC),
        groundwaterEC: parseFloat(form.groundwaterEC),
        tds:           parseFloat(form.tds),
        ...(form.soilPH   !== '' && { soilPH:   parseFloat(form.soilPH) }),
        ...(form.moisture !== '' && { moisture: parseFloat(form.moisture) }),
      }
    }

    try {
      const newFarm = await createFarm.mutateAsync(payload)
      setSubmitSuccess(true)

      // Brief success flash then hand off to caller
      setTimeout(() => {
        setForm(EMPTY_FORM)
        setErrors({})
        setTouched({})
        setSubmitSuccess(false)
        onSuccess?.(newFarm)
        onClose?.()
      }, 1200)
    } catch (err) {
      // Surface the backend error message to the user
      const msg = err?.message || 'Failed to create farm. Please try again.'
      setSubmitError(msg)
    }
  }

  const handleClose = () => {
    if (createFarm.isPending) return
    setForm(EMPTY_FORM)
    setErrors({})
    setTouched({})
    setSubmitError(null)
    setSubmitSuccess(false)
    onClose?.()
  }

  const isPending = createFarm.isPending

  return (
    // Backdrop
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Modal */}
      <div style={{ width: '100%', maxWidth: 672, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(45,212,191,0.1)', borderRadius: 8 }}>
              <MapPin size={18} style={{ color: 'var(--accent-seafoam)' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>Add New Farm</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Enter farm details — the new farm will be immediately available across the application</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: isPending ? 0.4 : 1, padding: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* ---- Farm Identity ---- */}
          <SectionHeader icon={MapPin} label="Farm Information" color="var(--accent-seafoam)" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Farm Name" required error={errors.farmName}>
              <Input
                value={form.farmName}
                onChange={set('farmName')}
                onBlur={blur('farmName')}
                placeholder="e.g. Green Valley Farm"
                disabled={isPending}
              />
            </Field>
            <Field label="Farmer / Owner Name" required error={errors.farmerName}>
              <Input
                value={form.farmerName}
                onChange={set('farmerName')}
                onBlur={blur('farmerName')}
                placeholder="e.g. Ramesh Patel"
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="District" required error={errors.district}>
              <Select
                value={form.district}
                onChange={set('district')}
                options={GUJARAT_DISTRICTS}
                placeholder="Select district…"
                disabled={isPending}
              />
            </Field>
            <Field label="Village / Location" required error={errors.location}>
              <Input
                value={form.location}
                onChange={set('location')}
                onBlur={blur('location')}
                placeholder="e.g. Mahuva, near NH-51"
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Farm Area" required hint="in acres" error={errors.landArea}>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={form.landArea}
                onChange={set('landArea')}
                onBlur={blur('landArea')}
                placeholder="e.g. 5"
                disabled={isPending}
              />
            </Field>
            <div />
          </div>

          {/* ---- Crop / Soil / Irrigation ---- */}
          <SectionHeader icon={Leaf} label="Agriculture Details" color="var(--accent-green)" />

          <div className="grid grid-cols-3 gap-4">
            <Field label="Current Crop" required error={errors.currentCrop}>
              <Select
                value={form.currentCrop}
                onChange={set('currentCrop')}
                options={CROPS}
                placeholder="Select crop…"
                disabled={isPending}
              />
            </Field>
            <Field label="Soil Type" required error={errors.soilType}>
              <Select
                value={form.soilType}
                onChange={set('soilType')}
                options={SOIL_TYPES}
                placeholder="Select soil…"
                disabled={isPending}
              />
            </Field>
            <Field label="Irrigation Source" required error={errors.irrigationSource}>
              <Select
                value={form.irrigationSource}
                onChange={set('irrigationSource')}
                options={IRRIGATION_SOURCES}
                placeholder="Select source…"
                disabled={isPending}
              />
            </Field>
          </div>

          {/* ---- GPS Coordinates ---- */}
          <SectionHeader icon={MapPin} label="GPS Coordinates" color="var(--accent-seafoam)" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" required hint="–90 to 90" error={errors.latitude}>
              <Input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={form.latitude}
                onChange={set('latitude')}
                onBlur={blur('latitude')}
                placeholder="e.g. 21.7645"
                disabled={isPending}
              />
            </Field>
            <Field label="Longitude" required hint="–180 to 180" error={errors.longitude}>
              <Input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={form.longitude}
                onChange={set('longitude')}
                onBlur={blur('longitude')}
                placeholder="e.g. 71.9784"
                disabled={isPending}
              />
            </Field>
          </div>

          {/* ---- Initial Salinity (optional) ---- */}
          <SectionHeader icon={FlaskConical} label="Initial Salinity Reading (optional)" color="var(--risk-medium)" />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: -12 }}>
            If you provide Soil EC, Groundwater EC, and TDS, an initial risk assessment will be calculated immediately.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Soil EC" hint="dS/m" error={errors.soilEC}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={form.soilEC}
                onChange={set('soilEC')}
                onBlur={blur('soilEC')}
                placeholder="e.g. 1.8"
                disabled={isPending}
              />
            </Field>
            <Field label="Groundwater EC" hint="dS/m" error={errors.groundwaterEC}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={form.groundwaterEC}
                onChange={set('groundwaterEC')}
                onBlur={blur('groundwaterEC')}
                placeholder="e.g. 1.2"
                disabled={isPending}
              />
            </Field>
            <Field label="TDS" hint="ppm" error={errors.tds}>
              <Input
                type="number"
                step="1"
                min="0"
                max="50000"
                value={form.tds}
                onChange={set('tds')}
                onBlur={blur('tds')}
                placeholder="e.g. 800"
                disabled={isPending}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Soil pH" hint="3 – 11, optional" error={errors.soilPH}>
              <Input
                type="number"
                step="0.1"
                min="3"
                max="11"
                value={form.soilPH}
                onChange={set('soilPH')}
                onBlur={blur('soilPH')}
                placeholder="e.g. 7.2"
                disabled={isPending}
              />
            </Field>
            <Field label="Soil Moisture" hint="%, optional" error={errors.moisture}>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={form.moisture}
                onChange={set('moisture')}
                onBlur={blur('moisture')}
                placeholder="e.g. 40"
                disabled={isPending}
              />
            </Field>
          </div>

          {/* Salinity hint */}
          {hasInitialReading && !errors.soilEC && !errors.groundwaterEC && !errors.tds && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--risk-low)', background: 'rgba(63,174,90,0.06)', border: '1px solid rgba(63,174,90,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
              <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              Initial salinity data provided — risk assessment will be calculated on creation.
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--risk-high)', background: 'rgba(228,87,86,0.08)', border: '1px solid rgba(228,87,86,0.25)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              {submitError}
            </div>
          )}

          {/* Submit success */}
          {submitSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--risk-low)', background: 'rgba(63,174,90,0.08)', border: '1px solid rgba(63,174,90,0.2)', borderRadius: 8, padding: '0.75rem' }}>
              <CheckCircle size={16} />
              Farm added successfully! Loading your new farm…
            </div>
          )}
        </form>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fields marked <span style={{ color: 'var(--risk-high)' }}>*</span> are required
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              style={{
                padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)',
                background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                cursor: 'pointer', transition: 'border-color 0.15s', opacity: isPending ? 0.4 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-farm-form"
              onClick={handleSubmit}
              disabled={isPending || submitSuccess}
              style={{
                padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 500,
                background: 'var(--accent-blue)', color: '#ffffff', border: 'none', borderRadius: 8,
                cursor: 'pointer', transition: 'background 0.15s',
                opacity: (isPending || submitSuccess) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? 'Saving…' : submitSuccess ? 'Saved!' : 'Add Farm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
