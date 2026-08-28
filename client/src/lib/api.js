/**
 * Salinity Shield AI — API client with automatic demo-data fallback.
 *
 * When the backend is unreachable or returns an error, every call
 * transparently returns the matching static demo data so the UI
 * always has something to display.
 */

import { DEMO_FARMS, DEMO_READINGS } from './demoData.js'

const API_BASE = '/api'

// ---- Track whether we are currently in demo mode ----
let _demoMode = false
export const isDemoMode = () => _demoMode
export const setDemoMode = (v) => { _demoMode = v }

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `API error ${res.status}`)
  }
  return res.json()
}

/**
 * Wrap any API call with an automatic demo-data fallback.
 * If the call fails (network error or server error), returns fallbackFn().
 * Sets global demoMode flag so the UI can show a banner.
 */
async function withFallback(apiFn, fallbackFn) {
  try {
    const result = await apiFn()
    _demoMode = false
    return result
  } catch {
    _demoMode = true
    return fallbackFn()
  }
}

// ---- Demo fallback helpers ----

function demoFarmList() {
  return DEMO_FARMS
}

function demoFarm(id) {
  const farm = DEMO_FARMS.find(f => f.id === id) ?? DEMO_FARMS[0]
  return {
    ...farm,
    readings:        DEMO_READINGS[farm.id] ?? [],
    riskAssessments: farm.riskAssessments,
    alerts:          farm.alerts,
    advisories:      farm.advisories,
    agentRuns:       farm.agentRuns,
  }
}

function demoReadings(farmId) {
  return DEMO_READINGS[farmId] ?? DEMO_READINGS[DEMO_FARMS[0].id]
}

function demoDecisionTrace(farmId) {
  const farm = DEMO_FARMS.find(f => f.id === farmId) ?? DEMO_FARMS[1]
  const events = []
  const reading = (DEMO_READINGS[farmId] ?? [])[29]
  if (reading) {
    events.push({ id: `demo-r-${farmId}`, type: 'READING', agent: 'Sensor / Data Input', timestamp: reading.timestamp, status: 'COMPLETED', trigger: `New ${reading.source} reading submitted`, summary: `Soil EC: ${reading.soilEC} dS/m | GW EC: ${reading.groundwaterEC} dS/m | TDS: ${reading.tds} ppm`, detail: { soilEC: reading.soilEC, groundwaterEC: reading.groundwaterEC, source: reading.source } })
  }
  const ra = farm.riskAssessments?.[0]
  if (ra) {
    events.push({ id: `demo-ra-${farmId}`, type: 'RISK_ASSESSMENT', agent: 'Risk Engine', timestamp: ra.createdAt, status: 'COMPLETED', trigger: `Reading submitted for farm ${farm.farmName}`, summary: `Risk: ${ra.riskLevel} (${ra.riskScore}/100) | Trend: ${ra.trend}`, detail: { riskLevel: ra.riskLevel, riskScore: ra.riskScore, trend: ra.trend, reasoningSummary: ra.reasoningSummary } })
  }
  for (const run of (farm.agentRuns ?? [])) {
    events.push({ id: `demo-ar-${run.id}`, type: 'AGENT_RUN', agent: run.agentName, timestamp: run.createdAt, status: run.status, trigger: run.triggerReason, summary: run.outputSummary, detail: { status: run.status } })
  }
  return { farmId, farmName: farm.farmName, events, total: events.length }
}

function demoForecast(farmId) {
  const readings = DEMO_READINGS[farmId] ?? DEMO_READINGS[DEMO_FARMS[0].id]
  const farm = DEMO_FARMS.find(f => f.id === farmId) ?? DEMO_FARMS[0]
  const last = readings[readings.length - 1]
  const isCritical = farmId === 'demo-farm-3'
  const isWorsening = farmId === 'demo-farm-2'
  return {
    sufficient: true,
    currentRiskScore: farm.riskAssessments[0]?.riskScore ?? 18,
    currentRiskLevel: farm.riskAssessments[0]?.riskLevel ?? 'LOW',
    alreadyCritical: isCritical,
    projections: [
      { days: 7,  soilEC: +(last.soilEC  + (isWorsening ? 0.8  : isCritical ? 2.0  : 0.05)).toFixed(2), groundwaterEC: +(last.groundwaterEC + 0.5).toFixed(2), tds: Math.round(last.tds + 300), riskScore: isCritical ? 92 : isWorsening ? 74 : 19, riskLevel: isCritical ? 'CRITICAL' : isWorsening ? 'HIGH' : 'LOW' },
      { days: 30, soilEC: +(last.soilEC  + (isWorsening ? 3.5  : isCritical ? 5.0  : 0.1)).toFixed(2),  groundwaterEC: +(last.groundwaterEC + 2.0).toFixed(2), tds: Math.round(last.tds + 1200), riskScore: isCritical ? 97 : isWorsening ? 83 : 21, riskLevel: isCritical ? 'CRITICAL' : isWorsening ? 'CRITICAL' : 'LOW' },
      { days: 90, soilEC: +(last.soilEC  + (isWorsening ? 8.0  : isCritical ? 8.0  : 0.3)).toFixed(2),  groundwaterEC: +(last.groundwaterEC + 5.0).toFixed(2), tds: Math.round(last.tds + 3000), riskScore: isCritical ? 99 : isWorsening ? 96 : 24, riskLevel: isCritical ? 'CRITICAL' : isWorsening ? 'CRITICAL' : 'LOW' },
    ],
    timeToCriticalDays: isCritical ? null : isWorsening ? 26 : null,
    chartHistory: readings.slice(-15).map(r => ({ date: new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), soilEC: r.soilEC, groundwaterEC: r.groundwaterEC, type: 'historical' })),
    forecastPoints: [7, 14, 21, 30].map(d => ({ date: `+${d}d`, soilEC: +(last.soilEC + (isWorsening ? d * 0.12 : d * 0.003)).toFixed(2), groundwaterEC: +(last.groundwaterEC + d * 0.05).toFixed(2), type: 'forecast' })),
    trend: { soilECSlope: isWorsening ? 0.11 : isCritical ? 0.21 : 0.003, groundwaterECSlope: isWorsening ? 0.08 : isCritical ? 0.16 : 0.002, r2Soil: 88, r2Groundwater: 82 },
    confidence: 72, confidenceLabel: 'MODERATE', readingsUsed: readings.length,
    disclaimer: '[DEMO DATA] Model estimate based on synthetic data. Configure backend for real forecasts.',
  }
}

function demoRiskExplanation(farmId) {
  const farm = DEMO_FARMS.find(f => f.id === farmId) ?? DEMO_FARMS[0]
  const ra = farm.riskAssessments[0]
  const reading = farm.readings[0]
  return {
    riskScore: ra?.riskScore ?? 18,
    riskLevel: ra?.riskLevel ?? 'LOW',
    trend: ra?.trend ?? 'STABLE',
    trendChangePercent: ra?.trendChangePercent ?? 0,
    factors: [
      { factor: 'Soil EC', value: `${reading?.soilEC} dS/m`, threshold: 'Safe < 2.0 dS/m', contribution: Math.round((reading?.soilEC ?? 1) * 4), direction: (reading?.soilEC ?? 1) > 2 ? 'negative' : 'positive', explanation: 'Soil EC contribution to overall risk.' },
      { factor: 'Groundwater EC', value: `${reading?.groundwaterEC} dS/m`, threshold: 'Safe < 1.5 dS/m', contribution: Math.round((reading?.groundwaterEC ?? 0.8) * 3), direction: (reading?.groundwaterEC ?? 0.8) > 1.5 ? 'negative' : 'positive', explanation: 'Groundwater quality impact.' },
      { factor: 'TDS (Water Quality)', value: `${reading?.tds} ppm`, threshold: 'Safe < 1000 ppm', contribution: Math.round(((reading?.tds ?? 600) / 1000) * 5), direction: (reading?.tds ?? 600) > 1000 ? 'negative' : 'positive', explanation: 'Total dissolved solids.' },
      { factor: 'Salinity Trend', value: ra?.trend ?? 'STABLE', threshold: 'STABLE is baseline', contribution: ra?.trend === 'RAPIDLY_WORSENING' ? 5 : ra?.trend === 'WORSENING' ? 3 : ra?.trend === 'IMPROVING' ? -2 : 0, direction: ra?.trend?.includes('WORSENING') ? 'negative' : ra?.trend === 'IMPROVING' ? 'positive' : 'neutral', explanation: 'Trend direction modifier.' },
      { factor: 'Soil pH', value: reading?.soilPH, threshold: 'Optimal: 5.5 – 7.5', contribution: (reading?.soilPH ?? 6.8) > 7.5 ? 3 : -1, direction: (reading?.soilPH ?? 6.8) > 7.5 ? 'negative' : 'positive', explanation: 'pH outside optimal range adds risk.' },
    ],
    historyData: { soilEC: (DEMO_READINGS[farmId] ?? []).slice(-4).map(r => r.soilEC), groundwaterEC: (DEMO_READINGS[farmId] ?? []).slice(-4).map(r => r.groundwaterEC), timestamps: [] },
    reasoningSummary: ra?.reasoningSummary ?? '',
    graniteExplanation: '[DEMO] Configure IBM watsonx.ai credentials for real AI explanations.',
    scoreBreakdown: { total: ra?.riskScore ?? 18 },
    farm: { id: farm.id, farmName: farm.farmName, district: farm.district },
  }
}

function demoWhatIf(farmId, scenarioId) {
  const farm = DEMO_FARMS.find(f => f.id === farmId) ?? DEMO_FARMS[1]
  const reading = farm.readings[0]
  const ra = farm.riskAssessments[0]
  const reductions = { CONTINUE_CURRENT: 0, SWITCH_CROP: 8, IMPROVE_IRRIGATION: 18, IMPROVE_DRAINAGE: 22, COMBINED: 35 }
  const reduction = reductions[scenarioId] ?? 15
  const simScore = Math.max(5, (ra?.riskScore ?? 50) - reduction)
  const toLevel = s => s < 25 ? 'LOW' : s < 50 ? 'MEDIUM' : s < 75 ? 'HIGH' : 'CRITICAL'
  return {
    scenarioId, scenario: { label: scenarioId.replace(/_/g, ' '), description: 'Demo scenario simulation.', timeframeWeeks: 6 },
    current: { soilEC: reading?.soilEC, groundwaterEC: reading?.groundwaterEC, tds: reading?.tds, soilPH: reading?.soilPH, moisture: reading?.moisture, riskScore: ra?.riskScore ?? 50, riskLevel: ra?.riskLevel ?? 'MEDIUM', farmHealth: 100 - (ra?.riskScore ?? 50), cropVulnerability: ra?.riskLevel ?? 'MEDIUM', waterStress: 'MEDIUM', crop: farm.currentCrop },
    simulated: { soilEC: +(reading?.soilEC * 0.85).toFixed(2), groundwaterEC: +(reading?.groundwaterEC * 0.88).toFixed(2), tds: Math.round(reading?.tds * 0.82), soilPH: reading?.soilPH, moisture: reading?.moisture, riskScore: simScore, riskLevel: toLevel(simScore), farmHealth: 100 - simScore, cropVulnerability: toLevel(simScore), waterStress: simScore > 50 ? 'MEDIUM' : 'LOW' },
    delta: { riskScore: reduction, farmHealth: reduction, soilEC: +(reading?.soilEC * 0.15).toFixed(2), groundwaterEC: +(reading?.groundwaterEC * 0.12).toFixed(2) },
    improved: reduction > 0,
    graniteExplanation: `[DEMO] The scenario "${scenarioId.replace(/_/g, ' ')}" could reduce modeled risk by approximately ${reduction} points based on simulated assumptions. Configure IBM watsonx.ai for real AI explanations.`,
    disclaimer: '[DEMO DATA] This is a model simulation estimate using synthetic data.',
    scenarios: Object.keys(reductions).map(id => ({ id, label: id.replace(/_/g, ' '), description: '' })),
  }
}

function demoMapRisk() {
  const features = DEMO_FARMS.map(f => ({
    id: f.id, farmName: f.farmName, farmerName: f.farmerName, district: f.district,
    latitude: f.latitude, longitude: f.longitude, currentCrop: f.currentCrop, landArea: f.landArea,
    riskLevel: f.riskAssessments[0]?.riskLevel ?? 'LOW',
    riskScore: f.riskAssessments[0]?.riskScore ?? 0,
    trend: f.riskAssessments[0]?.trend ?? 'STABLE',
    soilEC: f.readings[0]?.soilEC ?? null,
    groundwaterEC: f.readings[0]?.groundwaterEC ?? null,
    tds: f.readings[0]?.tds ?? null,
    activeAlerts: f.alerts.length,
    lastUpdated: f.readings[0]?.timestamp ?? null,
  }))
  const byDistrict = {}
  for (const f of features) {
    if (!byDistrict[f.district]) byDistrict[f.district] = { district: f.district, total: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    byDistrict[f.district].total++
    byDistrict[f.district][f.riskLevel] = (byDistrict[f.district][f.riskLevel] || 0) + 1
  }
  return { features, regionalSummary: Object.values(byDistrict) }
}

// ---- Public API ----
export const api = {
  farms: {
    list:      ()        => withFallback(() => request('/farms'),                              demoFarmList),
    get:       (id)      => withFallback(() => request(`/farms/${id}`),                        () => demoFarm(id)),
    create:    (data)    => request('/farms', { method: 'POST', body: JSON.stringify(data) }),
    delete:    (id)      => request(`/farms/${id}`, { method: 'DELETE' }),
    update:    (id, data)=> request(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    readings:  (id, lim = 100) => withFallback(() => request(`/farms/${id}/readings?limit=${lim}`), () => demoReadings(id)),
    advisories:(id)      => withFallback(() => request(`/farms/${id}/advisories`),             () => DEMO_FARMS.find(f => f.id === id)?.advisories ?? []),
    alerts:    (id)      => withFallback(() => request(`/farms/${id}/alerts`),                 () => DEMO_FARMS.find(f => f.id === id)?.alerts ?? []),
    agentRuns: (id)      => withFallback(() => request(`/farms/${id}/agent-runs`),             () => DEMO_FARMS.find(f => f.id === id)?.agentRuns ?? []),
  },

  readings: {
    create: (data) => request('/readings', { method: 'POST', body: JSON.stringify(data) }),
  },

  alerts: {
    resolve: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  },

  chat: {
    ask: (data) => withFallback(
      () => request('/chat', { method: 'POST', body: JSON.stringify(data) }),
      () => ({ answer: `[DEMO MODE] Backend is not connected. Question received: "${data.question}"\n\nTo get real AI answers, start the backend server and ensure PostgreSQL is running.`, isDemo: true })
    ),
  },

  analytics: {
    riskExplanation: (farmId)         => withFallback(() => request(`/farms/${farmId}/risk/explanation`),  () => demoRiskExplanation(farmId)),
    forecast:        (farmId)         => withFallback(() => request(`/farms/${farmId}/forecast`),           () => demoForecast(farmId)),
    decisionTrace:   (farmId, rid)    => withFallback(() => request(`/farms/${farmId}/decision-trace${rid ? `?readingId=${rid}` : ''}`), () => demoDecisionTrace(farmId)),
    whatIf:          (farmId, sc, lg = 'en') => withFallback(() => request(`/farms/${farmId}/what-if`, { method: 'POST', body: JSON.stringify({ scenario: sc, language: lg }) }), () => demoWhatIf(farmId, sc)),
    mapRisk:         ()               => withFallback(() => request('/map/risk'),                           demoMapRisk),
    scenarios:       ()               => withFallback(() => request('/what-if/scenarios'),                  () => ({ scenarios: [{ id: 'IMPROVE_IRRIGATION', label: 'Improve Irrigation', description: 'Demo' }, { id: 'SWITCH_CROP', label: 'Switch Crop', description: 'Demo' }, { id: 'IMPROVE_DRAINAGE', label: 'Improve Drainage', description: 'Demo' }, { id: 'COMBINED', label: 'Combined', description: 'Demo' }] })),
  },

  health: () => withFallback(() => request('/health'), () => ({ status: 'demo', ibmConfigured: false, environment: 'demo' })),
}
