/**
 * RiskMap — Interactive Leaflet + OpenStreetMap map
 * for the Coastal Salinity Risk Heatmap.
 *
 * No API key required — uses free OpenStreetMap tile layer.
 *
 * Props:
 *   farms          {Array}    filtered farm objects from GET /api/map/risk
 *   selectedFarm   {Object}   currently selected farm (may be null)
 *   onFarmSelect   {Function} callback(farm) when a marker is clicked
 *   onViewDetails  {Function} callback(farmId) — navigate to /farms/:id
 *
 * Behaviour:
 *  • Initialises the Leaflet map once; never recreates on re-render
 *  • Adds/removes/updates markers incrementally when the farms list changes
 *  • Auto-fits visible bounds to the current farm set
 *  • Selected farm: enlarged icon + open popup + map pan
 *  • Clicking marker → onFarmSelect + popup
 *  • Clicking "View Farm Details" inside popup → onViewDetails(farmId)
 *  • Tile error: non-blocking banner, farm list keeps working
 *  • Proper cleanup on unmount (removes map, prevents duplicate instances)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatSensor } from '../lib/utils.js'

// ── Constants ──────────────────────────────────────────────────────────────────

/** Gujarat approximate centre — the ONLY hard-coded geographic value */
const GUJARAT_CENTER = [22.2587, 71.1924]
const DEFAULT_ZOOM   = 7

/** Risk level → hex colour (matches the dashboard theme) */
const RISK_HEX = {
  LOW:      '#3FAE5A',
  MEDIUM:   '#E6A23C',
  HIGH:     '#E45756',
  CRITICAL: '#C83E4D',
  UNKNOWN:  '#6F8992',
}

// ── SVG icon factory ───────────────────────────────────────────────────────────

/**
 * Returns a Leaflet DivIcon with a clean circular SVG marker.
 * CRITICAL farms get a subtle dashed outer ring.
 * Selected farms get a white highlight ring and are slightly larger.
 */
function makeIcon(riskLevel, isSelected = false) {
  const color  = RISK_HEX[riskLevel] ?? RISK_HEX.UNKNOWN
  const size   = isSelected ? 22 : 15
  const stroke = isSelected ? '#ffffff' : '#071923'
  const sw     = isSelected ? 2.5 : 1.5

  const pulse = riskLevel === 'CRITICAL'
    ? `<circle cx="11" cy="11" r="9.5" fill="none" stroke="${color}" stroke-width="1.5"
              stroke-dasharray="3.5,2.5" opacity="0.55"/>`
    : ''

  const dot = `<circle cx="11" cy="11" r="${size / 2}" fill="${color}" fill-opacity="0.93"
               stroke="${stroke}" stroke-width="${sw}"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    ${pulse}${dot}
  </svg>`

  return L.divIcon({
    html:        svg,
    className:   '',          // suppress Leaflet's default white-box class
    iconSize:    [22, 22],
    iconAnchor:  [11, 11],
    popupAnchor: [0, -14],
  })
}

// ── Popup HTML ─────────────────────────────────────────────────────────────────

function buildPopupHTML(farm) {
  const color = RISK_HEX[farm.riskLevel] ?? RISK_HEX.UNKNOWN

  const row = (label, value) =>
    value != null && value !== '' && value !== undefined
      ? `<tr>
           <td style="color:#7fa8c0;font-size:10.5px;padding:2px 8px 2px 0;white-space:nowrap;vertical-align:top">${label}</td>
           <td style="color:#d8eaf4;font-size:11.5px;padding:2px 0">${value}</td>
         </tr>`
      : ''

  const trendMap = {
    IMPROVING:         '↓ Improving',
    STABLE:            '→ Stable',
    WORSENING:         '↑ Worsening',
    RAPIDLY_WORSENING: '⬆ Rapidly Worsening',
  }
  const trendLabel = trendMap[farm.trend] ?? farm.trend ?? '—'

  const alertRow = farm.activeAlerts > 0
    ? `<tr><td colspan="2" style="padding-top:5px">
         <span style="color:#f87171;font-size:10.5px">⚠ ${farm.activeAlerts} active alert${farm.activeAlerts > 1 ? 's' : ''}</span>
       </td></tr>`
    : ''

  return `
    <div style="
      background:#0d1b24;
      border-radius:8px;
      padding:11px 13px 13px;
      min-width:200px;
      max-width:255px;
      font-family:-apple-system,'Segoe UI',system-ui,sans-serif;
      color:#d8eaf4;
      line-height:1.5;
    ">
      <div style="font-weight:700;font-size:13.5px;color:#f0f7ff;margin-bottom:1px;line-height:1.3">
        ${farm.farmName}
      </div>
      <div style="color:#7fa8c0;font-size:10.5px;margin-bottom:7px">
        ${farm.farmerName ?? ''}${farm.farmerName && farm.district ? ' · ' : ''}${farm.district ?? ''}
      </div>

      <div style="margin-bottom:8px">
        <span style="
          background:${color}22;
          border:1px solid ${color}66;
          color:${color};
          font-size:10.5px;font-weight:700;
          padding:1px 9px;border-radius:999px;
          letter-spacing:0.04em;
        ">${farm.riskLevel}</span>
      </div>

      <table style="border-collapse:collapse;width:100%">
        ${row('Score',   farm.riskScore != null ? `<strong style="color:#f0f7ff">${farm.riskScore}</strong>/100` : null)}
        ${row('Trend',   trendLabel)}
        ${row('Crop',    farm.currentCrop)}
        ${row('Area',    farm.landArea != null ? `${farm.landArea} ha` : null)}
        ${row('Soil EC', farm.soilEC != null ? `${formatSensor('soilEC', farm.soilEC)} dS/m` : null)}
        ${row('GW EC',   farm.groundwaterEC != null ? `${formatSensor('groundwaterEC', farm.groundwaterEC)} dS/m` : null)}
        ${row('TDS',     farm.tds != null ? `${formatSensor('tds', farm.tds)} ppm` : null)}
        ${alertRow}
      </table>

      <button
        data-farm-id="${farm.id}"
        style="
          margin-top:10px;width:100%;padding:5px 0;
          background:rgba(45,212,191,0.12);
          border:1px solid rgba(45,212,191,0.35);
          border-radius:6px;color:#5eead4;
          font-size:11.5px;font-weight:600;cursor:pointer;
          font-family:inherit;letter-spacing:0.03em;
          transition:background 0.15s;
        "
        onmouseover="this.style.background='rgba(45,212,191,0.22)'"
        onmouseout="this.style.background='rgba(45,212,191,0.12)'"
      >
        View Farm Details →
      </button>
    </div>`
}

// ── Placeholder ────────────────────────────────────────────────────────────────

function MapPlaceholder({ height = 440, children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height, background: 'var(--bg-elevated)', borderRadius: 8,
      color: 'var(--text-muted)', fontSize: '0.875rem',
      gap: '0.625rem', padding: '1.5rem', textAlign: 'center',
    }}>
      {children}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function GoogleRiskMap({ farms, selectedFarm, onFarmSelect, onViewDetails }) {
  const containerRef  = useRef(null)   // DOM node mounted into
  const mapRef        = useRef(null)   // L.Map instance
  const markersRef    = useRef({})     // { [farmId]: L.Marker }
  const tileErrorRef  = useRef(false)  // flag to avoid spamming tile errors

  const [ready,     setReady]     = useState(false)
  const [tileError, setTileError] = useState(false)

  // ── Initialise map once ────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center:             GUJARAT_CENTER,
      zoom:               DEFAULT_ZOOM,
      zoomControl:        true,
      attributionControl: true,
    })

    const tileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom:  19,
        minZoom:  4,
      }
    )

    tileLayer.on('tileerror', () => {
      if (!tileErrorRef.current) {
        tileErrorRef.current = true
        setTileError(true)
      }
    })

    tileLayer.addTo(map)

    mapRef.current = map
    setReady(true)

    return () => {
      Object.values(markersRef.current).forEach(m => m.remove())
      markersRef.current = {}
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Delegated click handler for "View Farm Details" buttons in popups ──────
  const handleContainerClick = useCallback((e) => {
    const btn = e.target.closest('[data-farm-id]')
    if (!btn) return
    const farmId = btn.getAttribute('data-farm-id')
    if (onViewDetails) {
      onViewDetails(farmId)
    } else {
      // fallback: select in panel if no navigation callback provided
      const farm = farms.find(f => String(f.id) === farmId)
      if (farm) onFarmSelect(farm)
    }
  }, [farms, onFarmSelect, onViewDetails])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('click', handleContainerClick)
    return () => el.removeEventListener('click', handleContainerClick)
  }, [handleContainerClick])

  // ── Sync markers when farms changes ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    const currentIds  = new Set(Object.keys(markersRef.current))
    const incomingIds = new Set(farms.map(f => String(f.id)))

    // Remove stale markers
    for (const id of currentIds) {
      if (!incomingIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    }

    // Add or update
    for (const farm of farms) {
      if (farm.latitude == null || farm.longitude == null) continue
      const id       = String(farm.id)
      const pos      = [farm.latitude, farm.longitude]
      const selected = selectedFarm?.id === farm.id

      if (markersRef.current[id]) {
        const m = markersRef.current[id]
        m.setLatLng(pos)
        m.setIcon(makeIcon(farm.riskLevel, selected))
        m.getPopup()?.setContent(buildPopupHTML(farm))
        // keep farm reference up-to-date
        m._farmData = farm
      } else {
        const marker = L.marker(pos, {
          icon: makeIcon(farm.riskLevel, selected),
        })
        marker._farmData = farm
        marker.bindPopup(buildPopupHTML(farm), {
          closeButton: true,
          maxWidth:    280,
          className:   'salinity-popup',
        })
        marker.on('click', () => {
          onFarmSelect(marker._farmData)
        })
        marker.addTo(map)
        markersRef.current[id] = marker
      }
    }

    // Auto-fit bounds to visible farms
    const valid = farms.filter(f => f.latitude != null && f.longitude != null)
    if (valid.length === 0) return

    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], 12)
    } else {
      const bounds = L.latLngBounds(valid.map(f => [f.latitude, f.longitude]))
      map.fitBounds(bounds, { padding: [48, 48] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farms, ready])

  // ── Refresh icon style when selection changes ──────────────────────────────
  useEffect(() => {
    if (!ready) return
    for (const [id, marker] of Object.entries(markersRef.current)) {
      const farm = marker._farmData
      if (!farm) continue
      marker.setIcon(makeIcon(farm.riskLevel, selectedFarm?.id === id))
    }
  }, [selectedFarm, ready])

  // ── Pan + open popup when selectedFarm set from the farm list ─────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !selectedFarm) return
    const marker = markersRef.current[String(selectedFarm.id)]
    if (!marker) return
    map.setView(
      [selectedFarm.latitude, selectedFarm.longitude],
      Math.max(map.getZoom(), 12)
    )
    marker.openPopup()
  }, [selectedFarm, ready])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: 440 }}>
      {/* Map container — always rendered so Leaflet has a real DOM node */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', zIndex: 0 }}
      />

      {/* Loading overlay — shown until Leaflet fires 'ready' */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'var(--bg-elevated)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '0.625rem', color: 'var(--text-muted)', fontSize: '0.875rem',
          zIndex: 10,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-seafoam)',
            animation: 'spin 0.8s linear infinite',
          }} />
          Loading Coastal Risk Map…
        </div>
      )}

      {/* Non-blocking tile-error banner */}
      {ready && tileError && (
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(13,27,36,0.88)', border: '1px solid var(--border-default)',
          borderRadius: 6, padding: '5px 12px',
          fontSize: '0.75rem', color: 'var(--text-muted)',
          zIndex: 1000, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          Map tiles are currently unavailable. Farm data is still available.
        </div>
      )}
    </div>
  )
}
