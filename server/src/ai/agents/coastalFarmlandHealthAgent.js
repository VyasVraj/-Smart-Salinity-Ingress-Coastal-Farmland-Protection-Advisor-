/**
 * Coastal Farmland Health Agent
 *
 * Produces a holistic health summary for a coastal farm based on:
 * - Latest salinity reading
 * - Current risk assessment
 * - Recent advisories
 * - Active alerts
 *
 * Stores result as Advisory with type = 'HEALTH_SUMMARY'.
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { isIBMConfigured } from '../../config/env.js'

const AGENT_NAME = 'CoastalFarmlandHealthAgent'

/**
 * Build a structured prompt for IBM Granite.
 * @param {object} ctx
 * @returns {string}
 */
function buildHealthPrompt(ctx) {
  const { farm, latestReading, riskAssessment, recentAdvisories, activeAlerts } = ctx

  const advisorySummary = (recentAdvisories || [])
    .slice(0, 3)
    .map(a => `- ${a.type}: ${JSON.stringify(a.content).slice(0, 120)}`)
    .join('\n') || 'None'

  const alertSummary = (activeAlerts || [])
    .map(a => `- [${a.severity}] ${a.title}`)
    .join('\n') || 'None'

  return `<|system|>
You are an expert coastal farmland health analyst. Analyse the data and return ONLY a valid JSON object — no explanatory text before or after.

The JSON must have exactly these keys:
{
  "overallHealth": "GOOD" | "WATCH" | "AT_RISK" | "CRITICAL",
  "healthScore": <integer 0-100, where 100 = perfectly healthy>,
  "salinityStatus": "<one sentence describing current salinity state>",
  "mainRisk": "<primary threat to this farm right now>",
  "trendSummary": "<1-2 sentences on recent trend direction>",
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "topActions": ["<action 1>", "<action 2>", "<action 3>"],
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "monitoringRecommendation": "<recommended monitoring frequency and method>",
  "confidenceNote": "<brief note on data quality / confidence>",
  "disclaimer": "AI-generated health summary. Validate with field measurements and consult local agricultural experts."
}
<|user|>
Farm: ${farm.farmName} (${farm.district})
Farmer: ${farm.farmerName}
Crop: ${farm.currentCrop}
Land Area: ${farm.landArea} ha
Soil Type: ${farm.soilType}
Irrigation: ${farm.irrigationSource}

Latest Reading:
  Soil EC: ${latestReading?.soilEC ?? 'N/A'} dS/m
  Groundwater EC: ${latestReading?.groundwaterEC ?? 'N/A'} dS/m
  TDS: ${latestReading?.tds ?? 'N/A'} ppm
  Soil pH: ${latestReading?.soilPH ?? 'N/A'}
  Moisture: ${latestReading?.moisture ?? 'N/A'}%

Risk Assessment:
  Risk Level: ${riskAssessment?.riskLevel ?? 'UNKNOWN'}
  Risk Score: ${riskAssessment?.riskScore ?? 'N/A'}/100
  Trend: ${riskAssessment?.trend ?? 'UNKNOWN'} (${riskAssessment?.trendChangePercent ?? 0}% change)
  Summary: ${riskAssessment?.reasoningSummary ?? 'N/A'}

Recent Advisories:
${advisorySummary}

Active Alerts:
${alertSummary}
<|assistant|>
`
}

/**
 * Deterministic fallback — derived entirely from risk data, no fake AI text.
 * @param {object} ctx
 * @returns {object}
 */
function buildDeterministicFallback(ctx) {
  const { farm, latestReading, riskAssessment, activeAlerts } = ctx
  const riskLevel = riskAssessment?.riskLevel ?? 'UNKNOWN'
  const riskScore = riskAssessment?.riskScore ?? 50
  const trend     = riskAssessment?.trend     ?? 'STABLE'

  // Map risk level → overall health
  const healthMap = {
    LOW:      { overallHealth: 'GOOD',    healthScore: Math.max(65, 100 - riskScore), urgency: 'LOW' },
    MEDIUM:   { overallHealth: 'WATCH',   healthScore: Math.max(40, 100 - riskScore), urgency: 'MEDIUM' },
    HIGH:     { overallHealth: 'AT_RISK', healthScore: Math.max(15, 100 - riskScore), urgency: 'HIGH' },
    CRITICAL: { overallHealth: 'CRITICAL',healthScore: Math.max(5,  100 - riskScore), urgency: 'CRITICAL' },
    UNKNOWN:  { overallHealth: 'WATCH',   healthScore: 50,                            urgency: 'MEDIUM' },
  }

  const { overallHealth, healthScore, urgency } = healthMap[riskLevel] || healthMap.UNKNOWN

  const soilEC = latestReading?.soilEC ?? 0
  const gwEC   = latestReading?.groundwaterEC ?? 0
  const tds    = latestReading?.tds ?? 0

  const salinityStatus =
    soilEC < 2 && gwEC < 1.5
      ? `Soil EC ${soilEC} dS/m and groundwater EC ${gwEC} dS/m are within safe limits.`
      : soilEC < 4
        ? `Soil EC ${soilEC} dS/m is moderately elevated; groundwater EC ${gwEC} dS/m needs monitoring.`
        : `Soil EC ${soilEC} dS/m is critically elevated. Groundwater EC ${gwEC} dS/m indicates active salinity ingress.`

  const trendPhrases = {
    IMPROVING:        'Salinity trend is improving — recent readings show decreasing levels.',
    STABLE:           'Salinity trend is stable with no significant directional change.',
    WORSENING:        'Salinity trend is worsening — levels are increasing over recent readings.',
    RAPIDLY_WORSENING:'Salinity is increasing rapidly — urgent intervention required.',
    UNKNOWN:          'Trend data insufficient.',
  }

  const mainRisk =
    riskLevel === 'CRITICAL' ? 'Severe salinity ingress threatening crop survival'
    : riskLevel === 'HIGH'   ? 'Elevated salinity causing significant crop stress'
    : riskLevel === 'MEDIUM' ? 'Moderate salinity accumulation requiring active management'
    :                          'Low salinity — routine monitoring sufficient'

  const topActions =
    riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
      ? [
          'Stop irrigating with high-EC water immediately',
          'Test alternative water sources for salinity content',
          'Consider gypsum application after soil test confirmation',
        ]
      : riskLevel === 'MEDIUM'
        ? [
            'Reduce irrigation frequency and switch to low-EC water if possible',
            'Monitor soil EC weekly and record results',
            'Evaluate salt-tolerant crop varieties as contingency',
          ]
        : [
            'Continue regular salinity monitoring (bi-weekly readings)',
            'Maintain current irrigation and drainage practices',
            'Record baseline data for trend comparison',
          ]

  return {
    overallHealth,
    healthScore,
    salinityStatus,
    mainRisk,
    trendSummary: trendPhrases[trend] || trendPhrases.UNKNOWN,
    keyFindings: [
      `Soil EC: ${soilEC} dS/m (${soilEC < 2 ? 'Safe' : soilEC < 4 ? 'Moderate' : 'Critical'})`,
      `Groundwater EC: ${gwEC} dS/m (${gwEC < 1.5 ? 'Safe' : gwEC < 3 ? 'Moderate' : 'High'})`,
      `TDS: ${tds} ppm | Active alerts: ${(activeAlerts || []).length}`,
    ],
    topActions,
    urgency,
    monitoringRecommendation:
      urgency === 'CRITICAL' || urgency === 'HIGH'
        ? 'Daily readings strongly recommended. Install automated EC sensors if possible.'
        : urgency === 'MEDIUM'
          ? 'Weekly readings recommended. Record after each irrigation event.'
          : 'Bi-weekly readings are sufficient under current conditions.',
    confidenceNote: '[Deterministic fallback] Configure IBM watsonx.ai credentials for AI-powered analysis.',
    disclaimer: 'AI-generated health summary. Validate with field measurements and consult local agricultural experts.',
  }
}

/**
 * Run the CoastalFarmlandHealthAgent.
 *
 * @param {object} ctx - { farm, latestReading, riskAssessment, recentAdvisories, activeAlerts }
 * @returns {Promise<{type: string, agentName: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runCoastalFarmlandHealthAgent(ctx) {
  let output
  let isDemo = true

  if (isIBMConfigured()) {
    const prompt = buildHealthPrompt(ctx)
    const result = await callGranite(prompt, { params: { max_new_tokens: 600, temperature: 0.4 } })

    if (result.success && result.data) {
      // Validate required keys are present
      const required = ['overallHealth', 'healthScore', 'salinityStatus', 'mainRisk', 'topActions', 'urgency']
      const hasAllKeys = required.every(k => k in result.data)
      if (hasAllKeys) {
        output = result.data
        isDemo = false
      } else {
        console.warn(`[${AGENT_NAME}] Granite response missing required keys — using deterministic fallback`)
        output = buildDeterministicFallback(ctx)
      }
    } else {
      console.warn(`[${AGENT_NAME}] Granite call failed [${result.errorType}]: ${result.error} — using deterministic fallback`)
      output = buildDeterministicFallback(ctx)
    }
  } else {
    output = buildDeterministicFallback(ctx)
  }

  return {
    type: 'HEALTH_SUMMARY',
    agentName: AGENT_NAME,
    output,
    isDemo,
    language: 'en',
  }
}
