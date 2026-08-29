/**
 * GoogleRiskMap — Real Google Maps integration for the Coastal Salinity Risk Heatmap.
 *
 * Uses @vis.gl/react-google-maps (official Google Maps team React library).
 * API key is read from VITE_GOOGLE_MAPS_API_KEY — never hard-coded.
 *
 * Props:
 *   farms          {Array}    filtered farm objects from GET /api/map/risk
 *   selectedFarm   {Object}   currently selected farm (may be null)
 *   onFarmSelect   {Function} callback(farm) when a marker is clicked
 *   onViewDetails  {Function} callback(farmId) — navigate to /farms/:id
 *
 * Behaviour:
 *  • API key missing  → professional error state (rest of page still works)
 *  • Map loads once; markers update incrementally when farms prop changes
 *  • Auto-fits LatLngBounds for multiple farms; centres on single farm at zoom 12
 *  • Clicking marker → onFarmSelect + InfoWindow
 *  • Clicking farm list → centre + zoom + open InfoWindow
 *  • Dark map style (Night theme) to match the dashboard UI
 *  • Filter changes → markers show/hide dynamically (only filtered farms rendered)
 *  • New farms from DB appear automatically via TanStack Query refresh
 *  • No hard-coded farm coordinates — all positions come from the API
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { formatSensor } from '../lib/utils.js'
import { AlertTriangle, MapPin } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────────

/** Gujarat approximate centre — the ONLY hard-coded geographic value */
const GUJARAT_CENTER = { lat: 22.2587, lng: 71.1924 }
const DEFAULT_ZOOM   = 7

/** Risk level → hex colour (matches existing dashboard theme) */
const RISK_HEX = {
  LOW:      '#3FAE5A',
  MEDIUM:   '#E6A23C',
  HIGH:     '#E45756',
  CRITICAL: '#C83E4D',
  UNKNOWN:  '#6F8992',
}

const RISK_LABELS = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical', UNKNOWN: 'Unknown',
}

/**
 * Google Maps dark "Night" style — minimal, readable, matches dark dashboard.
 * Source: Google Maps Platform Styling Wizard export.
 */
const DARK_MAP_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#0d1b24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7fa8c0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1b24' }] },
  { featureType: 'administrative',   elementType: 'geometry', stylers: [{ color: '#1e3a4a' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9db3c0' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#9db3c0' }] },
  { featureType: 'poi',              stylers: [{ visibility: 'off' }] },
  { featureType: 'road',             elementType: 'geometry', stylers: [{ color: '#1a3040' }] },
  { featureType: 'road',             elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road',             elementType: 'labels.text.fill', stylers: [{ color: '#6190a0' }] },
  { featureType: 'road.arterial',    elementType: 'geometry', stylers: [{ color: '#203850' }] },
  { featureType: 'road.highway',     elementType: 'geometry', stylers: [{ color: '#25495c' }] },
  { featureType: 'road.highway',     elementType: 'geometry.stroke', stylers: [{ color: '#1a3040' }] },
  { featureType: 'road.local',       stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',          stylers: [{ visibility: 'off' }] },
  { featureType: 'water',            elementType: 'geometry', stylers: [{ color: '#071923' }] },
  { featureType: 'water',            elementType: 'labels.text.fill', stylers: [{ color: '#3a6e8a' }] },
]

// ── Marker pin factory ─────────────────────────────────────────────────────────

/**
 * Returns an inline SVG string used as the AdvancedMarker pin.
 * CRITICAL farms get a pulsing dashed outer ring.
 * Selected farms are larger with a white highlight ring.
 */
function makePinSVG(riskLevel, isSelected = false) {
  const color = RISK_HEX[riskLevel] ?? RISK_HEX.UNKNOWN
  const r     = isSelected ? 11 : 8
  const size  = isSelected ? 28 : 20
  const sw    = isSelected ? 2.5 : 1.5
  const stroke = isSelected ? '#ffffff' : '#0d1b24'

  const pulse = riskLevel === 'CRITICAL'
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r + 3}" fill="none"
         stroke="${color}" stroke-width="1.5" stroke-dasharray="3,2.5" opacity="0.55"/>`
    : ''

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    pulse +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" fill-opacity="0.92"` +
    ` stroke="${stroke}" stroke-width="${sw}"/>` +
    `</svg>`
  )
}

// ── InfoWindow content ─────────────────────────────────────────────────────────

/**
 * Pure React InfoWindow body.
 * Displayed inside Google Maps InfoWindow when a marker is clicked.
 */
function FarmInfoWindowContent({ farm, onViewDetails }) {
  if (!farm) return null

  const color = RISK_HEX[farm.riskLevel] ?? RISK_HEX.UNKNOWN
  const trendMap = {
    IMPROVING:         '↓ Improving',
    STABLE:            '→ Stable',
    WORSENING:         '↑ Worsening',
    RAPIDLY_WORSENING: '⬆ Rapidly Worsening',
  }
  const trendLabel = trendMap[farm.trend] ?? farm.trend ?? '—'

  const row = (label, value) => {
    if (value == null || value === '' || value === undefined) return null
    return (
      <tr key={label}>
        <td style={{ color: '#7fa8c0', fontSize: 10.5, padding: '2px 8px 2px 0', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
        <td style={{ color: '#d8eaf4', fontSize: 11.5, padding: '2px 0' }}>{value}</td>
      </tr>
    )
  }

  return (
    <div style={{
      background: '#0d1b24',
      borderRadius: 8,
      padding: '11px 13px 13px',
      minWidth: 200,
      maxWidth: 255,
      fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
      color: '#d8eaf4',
      lineHeight: 1.5,
    }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#f0f7ff', marginBottom: 1, lineHeight: 1.3 }}>
        {farm.farmName}
      </div>
      <div style={{ color: '#7fa8c0', fontSize: 10.5, marginBottom: 7 }}>
        {farm.farmerName}{farm.farmerName && farm.district ? ' · ' : ''}{farm.district}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span style={{
          background: `${color}22`,
          border: `1px solid ${color}66`,
          color,
          fontSize: 10.5, fontWeight: 700,
          padding: '1px 9px', borderRadius: 999,
          letterSpacing: '0.04em',
        }}>
          {farm.riskLevel}
        </span>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {row('Score',    farm.riskScore != null ? <><strong style={{ color: '#f0f7ff' }}>{farm.riskScore}</strong>/100</> : null)}
          {row('Trend',    trendLabel)}
          {row('Crop',     farm.currentCrop)}
          {row('Area',     farm.landArea != null ? `${farm.landArea} ha` : null)}
          {row('Soil EC',  farm.soilEC != null ? `${formatSensor('soilEC', farm.soilEC)} dS/m` : null)}
          {row('GW EC',    farm.groundwaterEC != null ? `${formatSensor('groundwaterEC', farm.groundwaterEC)} dS/m` : null)}
          {row('TDS',      farm.tds != null ? `${formatSensor('tds', farm.tds)} ppm` : null)}
          {farm.activeAlerts > 0 && (
            <tr>
              <td colSpan={2} style={{ paddingTop: 5 }}>
                <span style={{ color: '#f87171', fontSize: 10.5 }}>
                  ⚠ {farm.activeAlerts} active alert{farm.activeAlerts > 1 ? 's' : ''}
                </span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        onClick={() => onViewDetails && onViewDetails(farm.id)}
        style={{
          marginTop: 10, width: '100%', padding: '5px 0',
          background: 'rgba(45,212,191,0.12)',
          border: '1px solid rgba(45,212,191,0.35)',
          borderRadius: 6, color: '#5eead4',
          fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.03em',
        }}
      >
        View Farm Details →
      </button>
    </div>
  )
}

// ── Inner map component (has access to useMap hook) ────────────────────────────

function MapContent({ farms, selectedFarm, onFarmSelect, onViewDetails }) {
  const map = useMap()
  const [openInfoWindowId, setOpenInfoWindowId] = useState(null)

  // ── Auto-fit map bounds when farms change ────────────────────────────────────
  useEffect(() => {
    if (!map) return
    const valid = farms.filter(f => f.latitude != null && f.longitude != null)
    if (valid.length === 0) return

    if (valid.length === 1) {
      map.setCenter({ lat: valid[0].latitude, lng: valid[0].longitude })
      map.setZoom(12)
    } else {
      const bounds = new window.google.maps.LatLngBounds()
      for (const f of valid) {
        bounds.extend({ lat: f.latitude, lng: f.longitude })
      }
      map.fitBounds(bounds, 56) // 56px padding
    }
  }, [map, farms])

  // ── Pan + open InfoWindow when selectedFarm changes (from list click) ────────
  useEffect(() => {
    if (!map || !selectedFarm || selectedFarm.latitude == null) return
    map.panTo({ lat: selectedFarm.latitude, lng: selectedFarm.longitude })
    const current = map.getZoom() ?? DEFAULT_ZOOM
    if (current < 12) map.setZoom(12)
    setOpenInfoWindowId(String(selectedFarm.id))
  }, [map, selectedFarm])

  const handleMarkerClick = useCallback((farm) => {
    onFarmSelect(farm)
    setOpenInfoWindowId(String(farm.id))
  }, [onFarmSelect])

  const handleInfoWindowClose = useCallback(() => {
    setOpenInfoWindowId(null)
  }, [])

  return (
    <>
      {farms.map(farm => {
        if (farm.latitude == null || farm.longitude == null) return null
        const farmId   = String(farm.id)
        const isSelected = selectedFarm?.id === farm.id
        const position = { lat: farm.latitude, lng: farm.longitude }

        return (
          <div key={farmId}>
            <AdvancedMarker
              position={position}
              onClick={() => handleMarkerClick(farm)}
              title={farm.farmName}
              zIndex={isSelected ? 100 : 1}
            >
              {/* Inline SVG pin — no external image required */}
              <div
                style={{ cursor: 'pointer' }}
                dangerouslySetInnerHTML={{ __html: makePinSVG(farm.riskLevel, isSelected) }}
              />
            </AdvancedMarker>

            {openInfoWindowId === farmId && (
              <InfoWindow
                position={position}
                onCloseClick={handleInfoWindowClose}
                pixelOffset={[0, isSelected ? -16 : -12]}
                headerDisabled
              >
                <FarmInfoWindowContent farm={farm} onViewDetails={onViewDetails} />
              </InfoWindow>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── API-key-missing placeholder ────────────────────────────────────────────────

function ApiKeyMissingState({ height = 440 }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height, background: 'var(--bg-elevated)', borderRadius: 8,
      padding: '2rem', textAlign: 'center', gap: '0.75rem',
    }}>
      <MapPin size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
        Google Maps API key is not configured.
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 340 }}>
        Add <code style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-seafoam)' }}>VITE_GOOGLE_MAPS_API_KEY</code> to your{' '}
        <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-seafoam)' }}>client/.env</code>{' '}
        file. Farm data and filters remain functional while the map is unavailable.
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        See <code style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>client/.env.example</code> for setup instructions.
      </div>
    </div>
  )
}

// ── Google Maps load-error placeholder ────────────────────────────────────────

function MapErrorState({ message, height = 440 }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height, background: 'var(--bg-elevated)', borderRadius: 8,
      padding: '2rem', textAlign: 'center', gap: '0.625rem',
    }}>
      <AlertTriangle size={28} style={{ color: 'var(--risk-high)', opacity: 0.8 }} />
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Google Maps failed to load
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: 360 }}>
        {message || 'Check your API key, ensure the Maps JavaScript API is enabled, and that billing is active in Google Cloud Console.'}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
        Farm data, filters, and district summary remain available.
      </div>
    </div>
  )
}

// ── Loading placeholder ────────────────────────────────────────────────────────

function MapLoadingState({ height = 440 }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height, background: 'var(--bg-elevated)', borderRadius: 8,
      gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        border: '3px solid var(--border-default)',
        borderTopColor: 'var(--accent-seafoam)',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading Google Maps…
    </div>
  )
}

// ── Main exported component ────────────────────────────────────────────────────

export default function GoogleRiskMap({ farms, selectedFarm, onFarmSelect, onViewDetails }) {
  const [mapError, setMapError] = useState(null)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // Unique map ID required for AdvancedMarker (must be configured in Cloud Console
  // or use the special 'DEMO_MAP_ID' for local development).
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

  // ── Missing API key ────────────────────────────────────────────────────────
  if (!apiKey || apiKey === 'your_google_maps_api_key') {
    return <ApiKeyMissingState height={440} />
  }

  // ── Memoised map options to avoid unnecessary re-renders ──────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mapOptions = useMemo(() => ({
    mapTypeControl:        false,
    streetViewControl:     false,
    fullscreenControl:     true,
    zoomControl:           true,
    gestureHandling:       'greedy',
    styles:                DARK_MAP_STYLE,
    backgroundColor:       '#0d1b24',
    clickableIcons:        false,
  }), [])

  const handleError = useCallback((err) => {
    // Do not expose the raw error object — it may contain API key information
    console.error('[GoogleRiskMap] Maps API failed to load')
    const msg = err?.message || ''
    if (msg.includes('BillingNotEnabled') || msg.includes('billing')) {
      setMapError('Billing is not enabled for this Google Cloud project. Enable billing in Google Cloud Console.')
    } else if (msg.includes('ApiNotActivated') || msg.includes('not enabled')) {
      setMapError('The Maps JavaScript API is not enabled. Enable it in Google Cloud Console under APIs & Services.')
    } else if (msg.includes('InvalidKey') || msg.includes('invalid')) {
      setMapError('The Google Maps API key is invalid. Check the key in your client/.env file.')
    } else {
      setMapError('Google Maps could not be loaded. Check your API key, network connection, and Cloud Console configuration.')
    }
  }, [])

  if (mapError) {
    return <MapErrorState message={mapError} height={440} />
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 440, borderRadius: 8, overflow: 'hidden' }}>
      <APIProvider
        apiKey={apiKey}
        onError={handleError}
        libraries={['places']}
      >
        <Map
          mapId={mapId}
          defaultCenter={GUJARAT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          options={mapOptions}
          reuseMaps
        >
          <MapContent
            farms={farms}
            selectedFarm={selectedFarm}
            onFarmSelect={onFarmSelect}
            onViewDetails={onViewDetails}
          />
        </Map>
      </APIProvider>
    </div>
  )
}
