/**
 * LeafletRiskMap — Interactive Leaflet + OpenStreetMap integration
 * for the Coastal Salinity Risk Heatmap.
 *
 * Props:
 *   farms          {Array}    filtered farm objects from GET /api/map/risk
 *   selectedFarm   {Object}   currently selected farm (may be null)
 *   onFarmSelect   {Function} callback when a farm marker is clicked (selects it in the panel)
 *   onViewDetails  {Function} callback(farmId) when "View Farm Details" button is clicked
 */

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Constants ──────────────────────────────────────────────────────────────────

// Gujarat approximate center — the ONLY hard-coded geographic value.
const GUJARAT_CENTER = [22.2587, 71.1924]
const DEFAULT_ZOOM   = 7

// Risk colour map
const RISK_COLORS = {
  LOW:      '#22c55e',
  MEDIUM:   '#f59e0b',
  HIGH:     '#ef4444',
  CRITICAL: '#7c3aed',
  UNKNOWN:  '#6b7280',
}

// ── Marker icon factory ────────────────────────────────────────────────────────

/**
 * Build a lightweight circular SVG DivIcon for a given risk level.
 * Re-used for each marker so we keep icon objects small.
 */
function makeIcon(riskLevel, isSelected = false) {
  const color  = RISK_COLORS[riskLevel] ?? RISK_COLORS.UNKNOWN
  const size   = isSelected ? 20 : 14
  const border = isSelected ? 3  : 2
  const pulse  = riskLevel === 'CRITICAL'
    ? `<circle cx="10" cy="10" r="9" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3,2" opacity="0.6"/>`
    : ''

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      ${pulse}
      <circle cx="10" cy="10" r="${size / 2}" fill="${color}" fill-opacity="0.9"
              stroke="${isSelected ? '#ffffff' : '#1e293b'}" stroke-width="${border}"/>
    </svg>`

  return L.divIcon({
    html:        svg,
    className:   '',          // suppress Leaflet's default white-box class
    iconSize:    [20, 20],
    iconAnchor:  [10, 10],
    popupAnchor: [0, -12],
  })
}

// ── Popup HTML builder ─────────────────────────────────────────────────────────

function buildPopupHTML(farm) {
  const color = RISK_COLORS[farm.riskLevel] ?? RISK_COLORS.UNKNOWN

  const row = (label, value) =>
    value != null && value !== '' && value !== undefined
      ? `<tr>
           <td style="color:#94a3b8;font-size:11px;padding:2px 6px 2px 0;white-space:nowrap">${label}</td>
           <td style="color:#f1f5f9;font-size:12px;padding:2px 0">${value}</td>
         </tr>`
      : ''

  const trendMap = {
    IMPROVING: '↓ Improving', STABLE: '→ Stable',
    WORSENING: '↑ Worsening', RAPIDLY_WORSENING: '⬆ Rapidly Worsening',
  }
  const trendLabel = trendMap[farm.trend] ?? farm.trend ?? '—'

  const alertsRow = farm.activeAlerts > 0
    ? `<tr><td colspan="2" style="padding-top:6px">
         <span style="color:#f87171;font-size:11px">⚠ ${farm.activeAlerts} active alert${farm.activeAlerts > 1 ? 's' : ''}</span>
       </td></tr>`
    : ''

  return `
    <div style="background:#1e293b;border-radius:8px;padding:12px 14px;min-width:200px;max-width:260px;
                font-family:system-ui,sans-serif;color:#e2e8f0;line-height:1.5">
      <div style="font-weight:700;font-size:14px;color:#f1f5f9;margin-bottom:2px">${farm.farmName}</div>
      <div style="color:#94a3b8;font-size:11px;margin-bottom:8px">${farm.farmerName ?? ''} · ${farm.district}</div>
      <table style="border-collapse:collapse;width:100%">
        <tr>
          <td style="color:#94a3b8;font-size:11px;padding:2px 6px 2px 0">Risk</td>
          <td style="padding:2px 0">
            <span style="background:${color}22;border:1px solid ${color}55;color:${color};
                         font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px">
              ${farm.riskLevel}
            </span>
          </td>
        </tr>
        ${row('Score',   farm.riskScore != null ? `${farm.riskScore}/100` : null)}
        ${row('Trend',   trendLabel)}
        ${row('Crop',    farm.currentCrop)}
        ${row('Soil EC', farm.soilEC != null ? `${farm.soilEC} dS/m` : null)}
        ${row('GW EC',   farm.groundwaterEC != null ? `${farm.groundwaterEC} dS/m` : null)}
        ${alertsRow}
      </table>
      <button
        data-farm-id="${farm.id}"
        style="margin-top:10px;width:100%;padding:5px 0;background:#3b82f655;
               border:1px solid #3b82f680;border-radius:6px;color:#93c5fd;
               font-size:12px;cursor:pointer;font-family:inherit"
      >
        View Farm Details
      </button>
    </div>`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeafletRiskMap({ farms, selectedFarm, onFarmSelect, onViewDetails }) {
  const containerRef = useRef(null)   // DOM node for the map
  const mapRef       = useRef(null)   // L.Map instance
  const markersRef   = useRef({})     // { [farmId]: L.Marker }

  // ── Initialise map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return            // already created
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center:          GUJARAT_CENTER,
      zoom:            DEFAULT_ZOOM,
      zoomControl:     true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current  = null
      markersRef.current = {}
    }
  }, [])

  // ── Stable callback for "View Farm Details" button inside popups ─────────────
  // We attach a single delegated listener on the map container so we never leak.
  const handlePopupClick = useCallback((e) => {
    const btn = e.target.closest('[data-farm-id]')
    if (!btn) return
    const farmId = btn.getAttribute('data-farm-id')
    if (onViewDetails) {
      onViewDetails(farmId)
    } else {
      // Fallback: select in the side panel if no navigation handler provided
      const farm = farms.find(f => f.id === farmId)
      if (farm) onFarmSelect(farm)
    }
  }, [farms, onFarmSelect, onViewDetails])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('click', handlePopupClick)
    return () => el.removeEventListener('click', handlePopupClick)
  }, [handlePopupClick])

  // ── Sync markers whenever farms prop changes ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const currentIds  = new Set(Object.keys(markersRef.current))
    const incomingIds = new Set(farms.map(f => f.id))

    // Remove markers for farms no longer in the filtered set
    for (const id of currentIds) {
      if (!incomingIds.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    }

    // Add or update markers
    for (const farm of farms) {
      if (farm.latitude == null || farm.longitude == null) continue
      const pos = [farm.latitude, farm.longitude]

      if (markersRef.current[farm.id]) {
        // Update existing marker: position + icon + popup
        const m = markersRef.current[farm.id]
        m.setLatLng(pos)
        m.setIcon(makeIcon(farm.riskLevel, selectedFarm?.id === farm.id))
        m.getPopup()?.setContent(buildPopupHTML(farm))
      } else {
        // Create new marker
        const marker = L.marker(pos, {
          icon: makeIcon(farm.riskLevel, selectedFarm?.id === farm.id),
        })
        marker.bindPopup(buildPopupHTML(farm), {
          closeButton:   true,
          maxWidth:      280,
          className:     'salinity-popup',
        })
        marker.on('click', () => onFarmSelect(farm))
        marker.addTo(map)
        markersRef.current[farm.id] = marker
      }
    }

    // Auto-fit bounds
    const valid = farms.filter(f => f.latitude != null && f.longitude != null)
    if (valid.length === 0) return

    if (valid.length === 1) {
      map.setView([valid[0].latitude, valid[0].longitude], 12)
    } else {
      const bounds = L.latLngBounds(valid.map(f => [f.latitude, f.longitude]))
      map.fitBounds(bounds, { padding: [48, 48] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farms])

  // ── Update icon styles when selectedFarm changes ─────────────────────────────
  useEffect(() => {
    for (const [id, marker] of Object.entries(markersRef.current)) {
      const farm = farms.find(f => f.id === id)
      if (!farm) continue
      marker.setIcon(makeIcon(farm.riskLevel, selectedFarm?.id === id))
    }
  }, [selectedFarm, farms])

  // ── Pan to selected farm and open its popup ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedFarm) return
    const marker = markersRef.current[selectedFarm.id]
    if (!marker) return
    map.setView([selectedFarm.latitude, selectedFarm.longitude], Math.max(map.getZoom(), 12))
    marker.openPopup()
  }, [selectedFarm])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 440, borderRadius: 8, overflow: 'hidden', zIndex: 0 }}
    />
  )
}
