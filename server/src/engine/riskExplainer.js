/**
 * Salinity Shield AI — Explainable Risk Score
 *
 * Breaks down the risk score into contributing factors.
 * Purely deterministic — no IBM Granite here.
 */

import { THRESHOLDS } from './riskEngine.js'

/**
 * Calculate a factor contribution (+/- points toward the 0-100 risk score)
 */
export function explainRisk(reading, history = [], riskResult) {
  const factors = []

  // ---- Soil EC contribution ----
  const soilECBase = calcECScore(reading.soilEC, 'soilEC')
  const soilECWeight = 0.45
  const soilContrib = Math.round(soilECBase * soilECWeight)
  factors.push({
    factor: 'Soil EC',
    value: `${reading.soilEC} dS/m`,
    threshold: `Safe < ${THRESHOLDS.soilEC.LOW} dS/m`,
    contribution: soilContrib,
    direction: soilContrib > 11 ? 'negative' : 'positive',
    explanation: soilECLabel(reading.soilEC),
  })

  // ---- Groundwater EC contribution ----
  const gwECBase = calcECScore(reading.groundwaterEC, 'groundwaterEC')
  const gwECWeight = 0.35
  const gwContrib = Math.round(gwECBase * gwECWeight)
  factors.push({
    factor: 'Groundwater EC',
    value: `${reading.groundwaterEC} dS/m`,
    threshold: `Safe < ${THRESHOLDS.groundwaterEC.LOW} dS/m`,
    contribution: gwContrib,
    direction: gwContrib > 8 ? 'negative' : 'positive',
    explanation: gwECLabel(reading.groundwaterEC),
  })

  // ---- TDS contribution ----
  const tdsBase = calcECScore(reading.tds, 'tds')
  const tdsWeight = 0.20
  const tdsContrib = Math.round(tdsBase * tdsWeight)
  factors.push({
    factor: 'TDS (Water Quality)',
    value: `${reading.tds} ppm`,
    threshold: `Safe < ${THRESHOLDS.tds.LOW} ppm`,
    contribution: tdsContrib,
    direction: tdsContrib > 5 ? 'negative' : 'positive',
    explanation: tdsLabel(reading.tds),
  })

  // ---- Trend modifier ----
  let trendContrib = 0
  let trendDirection = 'neutral'
  if (riskResult.trend === 'RAPIDLY_WORSENING') {
    trendContrib = 5; trendDirection = 'negative'
  } else if (riskResult.trend === 'WORSENING') {
    trendContrib = 3; trendDirection = 'negative'
  } else if (riskResult.trend === 'IMPROVING') {
    trendContrib = -2; trendDirection = 'positive'
  }
  factors.push({
    factor: 'Salinity Trend',
    value: riskResult.trend,
    threshold: 'STABLE is baseline',
    contribution: trendContrib,
    direction: trendDirection,
    explanation: trendLabel(riskResult.trend, riskResult.trendChangePercent),
  })

  // ---- pH modifier ----
  let phContrib = 0
  let phDirection = 'neutral'
  if (reading.soilPH < THRESHOLDS.soilPH.MIN_OPTIMAL || reading.soilPH > THRESHOLDS.soilPH.MAX_OPTIMAL) {
    phContrib = 3; phDirection = 'negative'
  } else {
    phContrib = -1; phDirection = 'positive'
  }
  factors.push({
    factor: 'Soil pH',
    value: reading.soilPH,
    threshold: 'Optimal: 5.5 – 7.5',
    contribution: phContrib,
    direction: phDirection,
    explanation: phLabel(reading.soilPH),
  })

  // ---- Historical trend in EC (last 4 readings) ----
  let historyData = null
  if (history && history.length >= 3) {
    const recent = history.slice(-4)
    historyData = {
      soilEC: recent.map(r => r.soilEC),
      groundwaterEC: recent.map(r => r.groundwaterEC),
      timestamps: recent.map(r => new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
    }
  }

  return {
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    trend: riskResult.trend,
    trendChangePercent: riskResult.trendChangePercent,
    factors,
    historyData,
    reasoningSummary: riskResult.reasoningSummary,
    scoreBreakdown: {
      soilECContrib: soilContrib,
      gwECContrib:   gwContrib,
      tdsContrib,
      trendContrib,
      phContrib,
      total: riskResult.riskScore,
    },
  }
}

// ---- Helper label functions ----

function calcECScore(value, type) {
  const t = THRESHOLDS[type]
  if (value <= t.LOW)    return Math.round((value / t.LOW) * 25)
  if (value <= t.MEDIUM) return Math.round(25 + ((value - t.LOW)    / (t.MEDIUM - t.LOW))    * 25)
  if (value <= t.HIGH)   return Math.round(50 + ((value - t.MEDIUM) / (t.HIGH   - t.MEDIUM)) * 25)
  return Math.min(100, Math.round(75 + ((value - t.HIGH) / t.HIGH) * 25))
}

function soilECLabel(v) {
  if (v < THRESHOLDS.soilEC.LOW)    return 'Within safe range. Low contribution to risk.'
  if (v < THRESHOLDS.soilEC.MEDIUM) return 'Above safe level. Crop stress possible.'
  if (v < THRESHOLDS.soilEC.HIGH)   return 'High soil salinity. Significant crop damage risk.'
  return 'Critically elevated. Most crops will fail at this level.'
}

function gwECLabel(v) {
  if (v < THRESHOLDS.groundwaterEC.LOW)    return 'Groundwater quality is good. Safe for irrigation.'
  if (v < THRESHOLDS.groundwaterEC.MEDIUM) return 'Moderate salinity in groundwater. Use with caution.'
  if (v < THRESHOLDS.groundwaterEC.HIGH)   return 'High groundwater salinity. Irrigation will worsen soil EC.'
  return 'Severe groundwater contamination. Irrigation not recommended.'
}

function tdsLabel(v) {
  if (v < THRESHOLDS.tds.LOW)    return 'Water quality acceptable.'
  if (v < THRESHOLDS.tds.MEDIUM) return 'Elevated dissolved solids. Monitor closely.'
  if (v < THRESHOLDS.tds.HIGH)   return 'Poor water quality. Restrict irrigation use.'
  return 'Very poor water quality. Not suitable for most crops.'
}

function trendLabel(trend, pct) {
  const p = Math.abs(pct ?? 0)
  switch (trend) {
    case 'RAPIDLY_WORSENING': return `Salinity increased ${p}% from baseline. Immediate intervention required.`
    case 'WORSENING':         return `Salinity increased ${p}% from baseline. Action recommended.`
    case 'STABLE':            return 'Salinity stable. Continue monitoring.'
    case 'IMPROVING':         return `Salinity decreased ${p}% from baseline. Conditions improving.`
    default: return 'Insufficient data to determine trend.'
  }
}

function phLabel(v) {
  if (v >= THRESHOLDS.soilPH.MIN_OPTIMAL && v <= THRESHOLDS.soilPH.MAX_OPTIMAL) {
    return `pH ${v} is within optimal range (5.5–7.5). Slight positive adjustment to score.`
  }
  if (v < THRESHOLDS.soilPH.MIN_OPTIMAL) return `pH ${v} is acidic. Nutrient availability reduced.`
  return `pH ${v} is alkaline. Common in salt-affected soils. Adds to risk.`
}
