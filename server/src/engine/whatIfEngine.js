/**
 * Salinity Shield AI — What-If Scenario Engine
 *
 * Deterministic scenario modelling only.
 * IBM Granite provides explanation, not arithmetic.
 * All outputs are clearly labeled as model simulations.
 */

import { THRESHOLDS } from './riskEngine.js'

// ---- Scenario definitions ----
export const SCENARIOS = {
  CONTINUE_CURRENT: {
    id: 'CONTINUE_CURRENT',
    label: 'Continue Current Practice',
    description: 'No intervention — current conditions persist.',
    ecMultiplier:       1.0,
    gwECMultiplier:     1.0,
    tdsMultiplier:      1.0,
    moistureBonus:      0,
    phImprovement:      0,
    timeframeWeeks:     4,
  },
  SWITCH_CROP: {
    id: 'SWITCH_CROP',
    label: 'Switch to Salt-Tolerant Crop',
    description: 'Adopt barley, date palm, or cotton — reduces crop stress and improves long-term land management.',
    ecMultiplier:       0.92,
    gwECMultiplier:     0.95,
    tdsMultiplier:      0.93,
    moistureBonus:      3,
    phImprovement:      0,
    timeframeWeeks:     4,
  },
  IMPROVE_IRRIGATION: {
    id: 'IMPROVE_IRRIGATION',
    label: 'Improve Irrigation Management',
    description: 'Switch to drip irrigation, apply leaching fraction, test water quality.',
    ecMultiplier:       0.82,
    gwECMultiplier:     0.85,
    tdsMultiplier:      0.80,
    moistureBonus:      5,
    phImprovement:      0.2,
    timeframeWeeks:     6,
  },
  IMPROVE_DRAINAGE: {
    id: 'IMPROVE_DRAINAGE',
    label: 'Improve Drainage',
    description: 'Install sub-surface drainage, create drainage channels.',
    ecMultiplier:       0.78,
    gwECMultiplier:     0.75,
    tdsMultiplier:      0.76,
    moistureBonus:      -2,
    phImprovement:      0.1,
    timeframeWeeks:     8,
  },
  COMBINED: {
    id: 'COMBINED',
    label: 'Combined Intervention',
    description: 'Salt-tolerant crop + improved irrigation + drainage. Most effective but requires investment.',
    ecMultiplier:       0.65,
    gwECMultiplier:     0.62,
    tdsMultiplier:      0.63,
    moistureBonus:      4,
    phImprovement:      0.3,
    timeframeWeeks:     8,
  },
}

/**
 * Score thresholds (mirrors riskEngine)
 */
function calcECScore(value, type) {
  const t = THRESHOLDS[type]
  if (value <= t.LOW)    return Math.round((value / t.LOW) * 25)
  if (value <= t.MEDIUM) return Math.round(25 + ((value - t.LOW)    / (t.MEDIUM - t.LOW))    * 25)
  if (value <= t.HIGH)   return Math.round(50 + ((value - t.MEDIUM) / (t.HIGH   - t.MEDIUM)) * 25)
  return Math.min(100, Math.round(75 + ((value - t.HIGH) / t.HIGH) * 25))
}

function scoreToLevel(score) {
  if (score < 25) return 'LOW'
  if (score < 50) return 'MEDIUM'
  if (score < 75) return 'HIGH'
  return 'CRITICAL'
}

function farmHealth(riskScore, moisture, soilPH) {
  const riskPenalty = riskScore
  const moistureBonus = Math.min(20, Math.max(0, (moisture - 20) / 3))
  const phBonus = (soilPH >= 5.5 && soilPH <= 7.5) ? 10 : 0
  return Math.round(Math.max(0, Math.min(100, 100 - riskPenalty * 0.7 + moistureBonus + phBonus)))
}

/**
 * Run a what-if scenario
 * @param {object} farm
 * @param {object} latestReading
 * @param {object} latestRisk
 * @param {string} scenarioId
 * @returns {object} scenario result
 */
export function runScenario(farm, latestReading, latestRisk, scenarioId) {
  const scenario = SCENARIOS[scenarioId]
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`)

  if (!latestReading) {
    return {
      error: 'No readings available for this farm. Submit at least one reading first.',
      scenarioId,
    }
  }

  // Current state
  const curSoilEC   = latestReading.soilEC
  const curGwEC     = latestReading.groundwaterEC
  const curTds      = latestReading.tds
  const curPH       = latestReading.soilPH
  const curMoisture = latestReading.moisture

  const curSoilScore = calcECScore(curSoilEC, 'soilEC')
  const curGwScore   = calcECScore(curGwEC,   'groundwaterEC')
  const curTdsScore  = calcECScore(curTds,    'tds')
  const currentRiskScore = Math.round(curSoilScore * 0.45 + curGwScore * 0.35 + curTdsScore * 0.20)
  const currentRiskLevel = scoreToLevel(currentRiskScore)
  const currentHealth    = farmHealth(currentRiskScore, curMoisture, curPH)

  // Crop vulnerability (higher EC → higher vulnerability)
  const cropVulnerability = currentRiskLevel === 'CRITICAL' ? 'CRITICAL'
    : currentRiskLevel === 'HIGH' ? 'HIGH'
    : currentRiskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW'

  // Water stress
  const waterStress = curGwEC > THRESHOLDS.groundwaterEC.HIGH ? 'HIGH'
    : curGwEC > THRESHOLDS.groundwaterEC.MEDIUM ? 'MEDIUM' : 'LOW'

  // Simulated state
  const simSoilEC   = Math.max(0.1, curSoilEC   * scenario.ecMultiplier)
  const simGwEC     = Math.max(0.1, curGwEC     * scenario.gwECMultiplier)
  const simTds      = Math.max(50,  curTds      * scenario.tdsMultiplier)
  const simPH       = Math.max(3,   Math.min(11, curPH       + scenario.phImprovement))
  const simMoisture = Math.max(5,   Math.min(95, curMoisture + scenario.moistureBonus))

  const simSoilScore = calcECScore(simSoilEC, 'soilEC')
  const simGwScore   = calcECScore(simGwEC,   'groundwaterEC')
  const simTdsScore  = calcECScore(simTds,    'tds')
  const simRiskScore = Math.round(simSoilScore * 0.45 + simGwScore * 0.35 + simTdsScore * 0.20)
  const simRiskLevel = scoreToLevel(simRiskScore)
  const simHealth    = farmHealth(simRiskScore, simMoisture, simPH)

  const simCropVulnerability = simRiskLevel === 'CRITICAL' ? 'CRITICAL'
    : simRiskLevel === 'HIGH' ? 'HIGH'
    : simRiskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW'

  const simWaterStress = simGwEC > THRESHOLDS.groundwaterEC.HIGH ? 'HIGH'
    : simGwEC > THRESHOLDS.groundwaterEC.MEDIUM ? 'MEDIUM' : 'LOW'

  const riskChange  = currentRiskScore - simRiskScore
  const healthChange = simHealth - currentHealth

  return {
    scenarioId,
    scenario: {
      label:       scenario.label,
      description: scenario.description,
      timeframeWeeks: scenario.timeframeWeeks,
    },
    current: {
      soilEC:          curSoilEC,
      groundwaterEC:   curGwEC,
      tds:             curTds,
      soilPH:          curPH,
      moisture:        curMoisture,
      riskScore:       currentRiskScore,
      riskLevel:       currentRiskLevel,
      farmHealth:      currentHealth,
      cropVulnerability,
      waterStress,
      crop:            farm.currentCrop,
    },
    simulated: {
      soilEC:          Math.round(simSoilEC   * 100) / 100,
      groundwaterEC:   Math.round(simGwEC     * 100) / 100,
      tds:             Math.round(simTds),
      soilPH:          Math.round(simPH       * 10)  / 10,
      moisture:        Math.round(simMoisture * 10)  / 10,
      riskScore:       simRiskScore,
      riskLevel:       simRiskLevel,
      farmHealth:      simHealth,
      cropVulnerability: simCropVulnerability,
      waterStress:     simWaterStress,
    },
    delta: {
      riskScore:   riskChange,
      farmHealth:  healthChange,
      soilEC:      Math.round((curSoilEC - simSoilEC) * 100) / 100,
      groundwaterEC: Math.round((curGwEC - simGwEC)   * 100) / 100,
    },
    improved: riskChange > 0,
    disclaimer: 'This is a model simulation estimate. Actual outcomes depend on field conditions, implementation quality, and local environment. Validate with field measurements and consult agricultural experts.',
  }
}
