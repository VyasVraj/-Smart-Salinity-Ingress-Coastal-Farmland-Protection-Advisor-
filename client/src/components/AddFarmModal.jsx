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
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-gray-600 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
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
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
    />
  )
}

function Select({ value, onChange, options, placeholder, disabled }) {
  return (
    <div className="relative">
      <select
        disabled={disabled}
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  )
}

function SectionHeader({ icon: Icon, label, color = 'text-blue-400' }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${color} pt-2 pb-1 border-b border-gray-800`}>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      {/* Modal */}
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <MapPin size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Add New Farm</h2>
              <p className="text-xs text-gray-500">Enter farm details — the new farm will be immediately available across the application</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ---- Farm Identity ---- */}
          <SectionHeader icon={MapPin} label="Farm Information" color="text-blue-400" />

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
          <SectionHeader icon={Leaf} label="Agriculture Details" color="text-green-400" />

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
          <SectionHeader icon={MapPin} label="GPS Coordinates" color="text-cyan-400" />

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
          <SectionHeader icon={FlaskConical} label="Initial Salinity Reading (optional)" color="text-amber-400" />
          <p className="text-xs text-gray-600 -mt-2">
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
            <div className="flex items-start gap-2 text-xs text-green-400 bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2">
              <CheckCircle size={13} className="flex-shrink-0 mt-0.5" />
              Initial salinity data provided — risk assessment will be calculated on creation.
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          {/* Submit success */}
          {submitSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-3">
              <CheckCircle size={16} />
              Farm added successfully! Loading your new farm…
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-600">
            Fields marked <span className="text-red-400">*</span> are required
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-farm-form"
              onClick={handleSubmit}
              disabled={isPending || submitSuccess}
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
