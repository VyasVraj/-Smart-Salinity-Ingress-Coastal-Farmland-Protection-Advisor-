/**
 * Salinity Shield AI — Deterministic Risk Engine
 *
 * All risk calculations are deterministic and transparent.
 * IBM Granite is NOT used here — all calculations are pure arithmetic.
 */

// ---- Thresholds (dS/m) ----
export const THRESHOLDS = {
  soilEC: {
    LOW: 2.0,       // < 2.0 — safe
    MEDIUM: 4.0,    // 2.0 – 4.0 — moderate
    HIGH: 8.0,      // 4.0 – 8.0 — high
    // > 8.0 — critical
  },
  groundwaterEC: {
    LOW: 1.5,
    MEDIUM: 3.0,
    HIGH: 6.0,
  },
  tds: {
    LOW: 1000,      // ppm
    MEDIUM: 2000,
    HIGH: 4000,
  },
  soilPH: {
    MIN_OPTIMAL: 5.5,
    MAX_OPTIMAL: 7.5,
  },
}

const TREND_WINDOWS = {
  WORSENING_THRESHOLD: 0.05,        // 5% increase → worsening
  RAPID_WORSENING_THRESHOLD: 0.20,  // 20% increase → rapidly worsening
  IMPROVING_THRESHOLD: -0.05,       // 5% decrease → improving
}

/**
 * Calculate individual EC risk score (0-100)
 * @param {number} value
 * @param {'soilEC'|'groundwaterEC'|'tds'} type
 * @returns {number}
 */
function calcECScore(value, type) {
  const t = THRESHOLDS[type]
  if (value <= t.LOW) return Math.round((value / t.LOW) * 25)
  if (value <= t.MEDIUM) return Math.round(25 + ((value - t.LOW) / (t.MEDIUM - t.LOW)) * 25)
  if (value <= t.HIGH) return Math.round(50 + ((value - t.MEDIUM) / (t.HIGH - t.MEDIUM)) * 25)
  return Math.min(100, Math.round(75 + ((value - t.HIGH) / t.HIGH) * 25))
}

/**
 * Determine risk level from score
 * @param {number} score
 * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
function scoreToLevel(score) {
  if (score < 25) return 'LOW'
  if (score < 50) return 'MEDIUM'
  if (score < 75) return 'HIGH'
  return 'CRITICAL'
}

/**
 * Calculate trend from historical readings
 * @param {Array<{soilEC: number, groundwaterEC: number}>} history - ordered oldest first
 * @param {{soilEC: number, groundwaterEC: number}} current
 * @returns {{ trend: string, changePercent: number }}
 */
function calcTrend(history, current) {
  if (!history || history.length < 2) {
    return { trend: 'STABLE', changePercent: 0 }
  }

  // Use the oldest reading in window as baseline
  const baseline = history[0]
  const baselineAvgEC = (baseline.soilEC + baseline.groundwaterEC) / 2
  const currentAvgEC = (current.soilEC + current.groundwaterEC) / 2

  if (baselineAvgEC === 0) return { trend: 'STABLE', changePercent: 0 }

  const changePercent = (currentAvgEC - baselineAvgEC) / baselineAvgEC

  let trend
  if (changePercent >= TREND_WINDOWS.RAPID_WORSENING_THRESHOLD) {
    trend = 'RAPIDLY_WORSENING'
  } else if (changePercent >= TREND_WINDOWS.WORSENING_THRESHOLD) {
    trend = 'WORSENING'
  } else if (changePercent <= TREND_WINDOWS.IMPROVING_THRESHOLD) {
    trend = 'IMPROVING'
  } else {
    trend = 'STABLE'
  }

  return { trend, changePercent: Math.round(changePercent * 1000) / 10 }
}

/**
 * Build a human-readable reasoning summary
 * @param {number} riskScore
 * @param {string} riskLevel
 * @param {string} trend
 * @param {object} reading
 * @returns {string}
 */
function buildReasoning(riskScore, riskLevel, trend, reading) {
  const parts = []

  if (reading.soilEC > THRESHOLDS.soilEC.HIGH) {
    parts.push(`Soil EC (${reading.soilEC} dS/m) is critically elevated.`)
  } else if (reading.soilEC > THRESHOLDS.soilEC.MEDIUM) {
    parts.push(`Soil EC (${reading.soilEC} dS/m) is above safe levels.`)
  }

  if (reading.groundwaterEC > THRESHOLDS.groundwaterEC.HIGH) {
    parts.push(`Groundwater EC (${reading.groundwaterEC} dS/m) indicates severe salinity ingress.`)
  } else if (reading.groundwaterEC > THRESHOLDS.groundwaterEC.MEDIUM) {
    parts.push(`Groundwater EC (${reading.groundwaterEC} dS/m) shows moderate contamination.`)
  }

  if (reading.tds > THRESHOLDS.tds.HIGH) {
    parts.push(`TDS (${reading.tds} ppm) is very high, indicating poor water quality.`)
  }

  if (reading.soilPH < THRESHOLDS.soilPH.MIN_OPTIMAL || reading.soilPH > THRESHOLDS.soilPH.MAX_OPTIMAL) {
    parts.push(`Soil pH (${reading.soilPH}) is outside optimal range (5.5–7.5).`)
  }

  if (trend === 'RAPIDLY_WORSENING') {
    parts.push('Salinity is increasing rapidly — immediate action is required.')
  } else if (trend === 'WORSENING') {
    parts.push('Salinity has been consistently increasing over recent readings.')
  } else if (trend === 'IMPROVING') {
    parts.push('Conditions are improving compared to recent readings.')
  }

  if (parts.length === 0) {
    parts.push(`Salinity parameters are within acceptable ranges. Risk score: ${riskScore}.`)
  }

  return parts.join(' ')
}

/**
 * Main risk calculation — fully deterministic
 * @param {object} reading - current salinity reading
 * @param {Array} history - recent historical readings (latest last)
 * @returns {{ riskLevel, riskScore, trend, trendChangePercent, severity, triggerAgents, reasoningSummary }}
 */
export function calculateRisk(reading, history = []) {
  const soilScore = calcECScore(reading.soilEC, 'soilEC')
  const gwScore = calcECScore(reading.groundwaterEC, 'groundwaterEC')
  const tdsScore = calcECScore(reading.tds, 'tds')

  // Weighted composite (soil EC is most important indicator)
  const riskScore = Math.round(soilScore * 0.45 + gwScore * 0.35 + tdsScore * 0.20)
  const riskLevel = scoreToLevel(riskScore)

  const { trend, changePercent } = calcTrend(history, reading)

  const severity = riskLevel

  // Trigger agents for anything above LOW, or any worsening
  const triggerAgents = riskLevel !== 'LOW' || trend === 'WORSENING' || trend === 'RAPIDLY_WORSENING'

  const reasoningSummary = buildReasoning(riskScore, riskLevel, trend, reading)

  return {
    riskLevel,
    riskScore,
    trend,
    trendChangePercent: changePercent,
    severity,
    triggerAgents,
    reasoningSummary,
  }
}

/**
 * Determine which agents to activate based on risk level and trend
 * @param {string} riskLevel
 * @param {string} trend
 * @returns {string[]} agent names
 */
export function selectAgents(riskLevel, trend) {
  const agents = ['MonitoringAgent']

  if (riskLevel === 'MEDIUM') {
    agents.push('CropAdvisoryAgent')
  }

  if (riskLevel === 'HIGH') {
    agents.push('CropAdvisoryAgent', 'IrrigationAgent', 'LandReclamationAgent', 'FarmerAlertAgent')
  }

  if (riskLevel === 'CRITICAL') {
    agents.push('CropAdvisoryAgent', 'IrrigationAgent', 'LandReclamationAgent', 'FarmerAlertAgent')
  }

  if ((trend === 'WORSENING' || trend === 'RAPIDLY_WORSENING') && riskLevel === 'MEDIUM') {
    if (!agents.includes('FarmerAlertAgent')) agents.push('FarmerAlertAgent')
  }

  return [...new Set(agents)]
}
