/**
 * Salinity Shield AI — Deterministic Forecast Engine
 *
 * All forecasting uses linear regression on historical data.
 * IBM Granite is NOT used here — pure arithmetic only.
 * All outputs are clearly labeled as model estimates.
 */

import { THRESHOLDS, calculateRisk } from './riskEngine.js'

const MIN_READINGS_FOR_FORECAST = 5

/**
 * Simple linear regression on (index, value) pairs
 * Returns { slope, intercept, r2 }
 */
function linearRegression(values) {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
    sumY2 += values[i] * values[i]
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // R² coefficient of determination
  const yMean = sumY / n
  const ssTot = values.reduce((acc, v) => acc + (v - yMean) ** 2, 0)
  const ssRes = values.reduce((acc, v, i) => acc + (v - (slope * i + intercept)) ** 2, 0)
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, r2 }
}

/**
 * Determine risk level from score
 */
function scoreToLevel(score) {
  if (score < 25) return 'LOW'
  if (score < 50) return 'MEDIUM'
  if (score < 75) return 'HIGH'
  return 'CRITICAL'
}

/**
 * Compute composite EC score for forecast risk level
 */
function calcECScore(value, type) {
  const t = THRESHOLDS[type]
  if (value <= t.LOW) return Math.round((value / t.LOW) * 25)
  if (value <= t.MEDIUM) return Math.round(25 + ((value - t.LOW) / (t.MEDIUM - t.LOW)) * 25)
  if (value <= t.HIGH) return Math.round(50 + ((value - t.MEDIUM) / (t.HIGH - t.MEDIUM)) * 25)
  return Math.min(100, Math.round(75 + ((value - t.HIGH) / t.HIGH) * 25))
}

/**
 * Calculate days until a value crosses a critical threshold given a slope (per reading).
 * If already critical or slope is non-positive, return null.
 */
function daysUntilCritical(currentValue, slope, threshold, readingsPerDay) {
  if (slope <= 0) return null
  if (currentValue >= threshold) return 0
  const readingsNeeded = (threshold - currentValue) / slope
  return Math.round(readingsNeeded / readingsPerDay)
}

/**
 * Main forecast function
 * @param {Array} readings - ordered oldest to newest, each has { soilEC, groundwaterEC, tds, timestamp }
 * @returns {object} forecast result
 */
export function computeForecast(readings) {
  if (!readings || readings.length < MIN_READINGS_FOR_FORECAST) {
    return {
      sufficient: false,
      message: 'Insufficient historical data to estimate forecast. At least 5 readings required.',
      readings: readings?.length ?? 0,
    }
  }

  const ordered = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  const soilECValues = ordered.map(r => r.soilEC)
  const gwECValues   = ordered.map(r => r.groundwaterEC)
  const tdsValues    = ordered.map(r => r.tds)

  const soilReg = linearRegression(soilECValues)
  const gwReg   = linearRegression(gwECValues)
  const tdsReg  = linearRegression(tdsValues)

  // Average readings per day based on actual timestamps
  const first = new Date(ordered[0].timestamp)
  const last  = new Date(ordered[ordered.length - 1].timestamp)
  const daySpan = Math.max(1, (last - first) / (1000 * 60 * 60 * 24))
  const readingsPerDay = ordered.length / daySpan

  // Current (latest) values
  const latest = ordered[ordered.length - 1]

  // Project forward: 7, 30, 90 days
  const horizons = [7, 30, 90]
  const projections = horizons.map(days => {
    const steps = days * readingsPerDay
    const projSoilEC = Math.max(0, soilReg.slope * (ordered.length - 1 + steps) + soilReg.intercept)
    const projGwEC   = Math.max(0, gwReg.slope   * (ordered.length - 1 + steps) + gwReg.intercept)
    const projTds    = Math.max(0, tdsReg.slope   * (ordered.length - 1 + steps) + tdsReg.intercept)

    const soilScore = calcECScore(projSoilEC, 'soilEC')
    const gwScore   = calcECScore(projGwEC,   'groundwaterEC')
    const tdsScore  = calcECScore(projTds,    'tds')
    const riskScore = Math.round(soilScore * 0.45 + gwScore * 0.35 + tdsScore * 0.20)

    return {
      days,
      soilEC:       Math.round(projSoilEC * 100) / 100,
      groundwaterEC: Math.round(projGwEC  * 100) / 100,
      tds:          Math.round(projTds),
      riskScore:    Math.min(100, riskScore),
      riskLevel:    scoreToLevel(Math.min(100, riskScore)),
    }
  })

  // Current composite risk score
  const curSoilScore = calcECScore(latest.soilEC, 'soilEC')
  const curGwScore   = calcECScore(latest.groundwaterEC, 'groundwaterEC')
  const curTdsScore  = calcECScore(latest.tds, 'tds')
  const currentRiskScore = Math.round(curSoilScore * 0.45 + curGwScore * 0.35 + curTdsScore * 0.20)
  const currentRiskLevel = scoreToLevel(currentRiskScore)

  // Time-to-critical: which threshold will be crossed first?
  const criticalThresholds = {
    soilEC: THRESHOLDS.soilEC.HIGH,           // entering CRITICAL zone
    groundwaterEC: THRESHOLDS.groundwaterEC.HIGH,
  }

  let timeToCriticalDays = null
  const alreadyCritical = currentRiskLevel === 'CRITICAL'

  if (!alreadyCritical) {
    const soilDays = daysUntilCritical(latest.soilEC, soilReg.slope * readingsPerDay, criticalThresholds.soilEC, 1)
    const gwDays   = daysUntilCritical(latest.groundwaterEC, gwReg.slope * readingsPerDay, criticalThresholds.groundwaterEC, 1)

    const candidates = [soilDays, gwDays].filter(d => d !== null && d > 0)
    if (candidates.length > 0) {
      timeToCriticalDays = Math.min(...candidates)
    }
  }

  // Build chart data: last N readings + forecast points
  const chartHistory = ordered.slice(-20).map((r, i) => ({
    date: new Date(r.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    soilEC: r.soilEC,
    groundwaterEC: r.groundwaterEC,
    type: 'historical',
  }))

  // Add 30-day forecast points (weekly)
  const forecastPoints = []
  for (let w = 7; w <= 30; w += 7) {
    const steps = w * readingsPerDay
    forecastPoints.push({
      date: `+${w}d`,
      soilEC:       Math.round(Math.max(0, soilReg.slope * (ordered.length - 1 + steps) + soilReg.intercept) * 100) / 100,
      groundwaterEC: Math.round(Math.max(0, gwReg.slope  * (ordered.length - 1 + steps) + gwReg.intercept)  * 100) / 100,
      type: 'forecast',
    })
  }

  // Confidence based on R² of soil EC regression (primary indicator)
  const confidence = Math.round((soilReg.r2 * 0.6 + gwReg.r2 * 0.4) * 100)
  const confidenceLabel = confidence >= 70 ? 'MODERATE' : confidence >= 40 ? 'LOW' : 'VERY_LOW'

  return {
    sufficient: true,
    currentRiskScore,
    currentRiskLevel,
    alreadyCritical,
    projections,           // [7d, 30d, 90d]
    timeToCriticalDays,    // null if already critical, declining, or insufficient slope
    chartHistory,
    forecastPoints,
    trend: {
      soilECSlope:        Math.round(soilReg.slope * 1000) / 1000,
      groundwaterECSlope: Math.round(gwReg.slope   * 1000) / 1000,
      r2Soil:             Math.round(soilReg.r2     * 100),
      r2Groundwater:      Math.round(gwReg.r2       * 100),
    },
    confidence,
    confidenceLabel,
    readingsUsed: ordered.length,
    disclaimer: 'Model estimate based on linear trend. If current conditions change, actual outcomes will differ.',
  }
}
