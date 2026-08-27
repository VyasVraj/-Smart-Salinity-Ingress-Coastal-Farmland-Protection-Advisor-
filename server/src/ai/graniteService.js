/**
 * Salinity Shield AI — IBM Granite Service
 *
 * Wraps watsonxClient with:
 * - Error handling and fallback
 * - JSON parsing and Zod validation
 * - Logging
 * - Timeout protection
 */

import { generateText } from './watsonxClient.js'
import { isIBMConfigured } from '../config/env.js'

const TIMEOUT_MS = 30000

/**
 * Call Granite with timeout and structured output parsing
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<{success: boolean, data: object|null, raw: string, isDemo: boolean, error?: string}>}
 */
export async function callGranite(prompt, options = {}) {
  if (!isIBMConfigured()) {
    console.warn('[Granite] IBM credentials not configured — using fallback demo mode')
    return {
      success: false,
      data: null,
      raw: '',
      isDemo: true,
      error: 'IBM watsonx.ai credentials not configured',
    }
  }

  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('IBM Granite request timed out')), TIMEOUT_MS)
  })

  try {
    const raw = await Promise.race([
      generateText(prompt, options.params),
      timeoutPromise,
    ])
    clearTimeout(timeoutId)

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[Granite] Response did not contain valid JSON:', raw.slice(0, 200))
      return { success: false, data: null, raw, isDemo: false, error: 'No JSON in response' }
    }

    const data = JSON.parse(jsonMatch[0])
    return { success: true, data, raw, isDemo: false }
  } catch (err) {
    clearTimeout(timeoutId)
    console.error('[Granite] Error:', err.message)
    return { success: false, data: null, raw: '', isDemo: false, error: err.message }
  }
}

/**
 * Generate fallback demo output for when Granite is unavailable
 * @param {string} agentName
 * @param {object} ctx
 * @returns {object}
 */
export function generateFallback(agentName, ctx) {
  const { riskResult, farm } = ctx

  const fallbacks = {
    MonitoringAgent: {
      conditionSummary: `[DEMO] Farm ${farm?.farmName} shows ${riskResult?.riskLevel || 'UNKNOWN'} risk with ${riskResult?.trend || 'STABLE'} trend. Soil EC is ${ctx.reading?.soilEC} dS/m.`,
      keyFindings: [
        `Soil EC: ${ctx.reading?.soilEC} dS/m`,
        `Groundwater EC: ${ctx.reading?.groundwaterEC} dS/m`,
        `TDS: ${ctx.reading?.tds} ppm`,
      ],
      trendInterpretation: `[DEMO] The ${riskResult?.trend} trend indicates ${riskResult?.trendChangePercent}% change in salinity levels.`,
      requiresIntervention: riskResult?.riskLevel !== 'LOW',
      interventionUrgency: riskResult?.riskLevel === 'CRITICAL' ? 'IMMEDIATE' : riskResult?.riskLevel === 'HIGH' ? 'SOON' : 'MONITOR',
      confidenceNote: '[DEMO MODE] Configure IBM watsonx.ai credentials for real AI analysis.',
    },

    CropAdvisoryAgent: {
      currentCropAssessment: `[DEMO] ${farm?.currentCrop} may face ${riskResult?.riskLevel === 'LOW' ? 'minimal' : 'significant'} salinity stress at current EC levels.`,
      stressRisk: riskResult?.riskLevel || 'MEDIUM',
      recommendations: [
        { crop: 'Barley (Gujarat variety)', suitability: 'HIGH', reason: 'Tolerates soil EC up to 8 dS/m', considerations: 'Requires good drainage', confidence: '[DEMO]' },
        { crop: 'Cotton (Desi)', suitability: 'MODERATE', reason: 'Moderate salinity tolerance', considerations: 'Monitor closely above 4 dS/m', confidence: '[DEMO]' },
        { crop: 'Date Palm', suitability: 'HIGH', reason: 'Excellent salinity tolerance', considerations: 'Long-term crop, 3-5 years to first harvest', confidence: '[DEMO]' },
      ],
      immediateActions: ['Test irrigation water quality', 'Apply gypsum if pH is alkaline'],
      disclaimer: '[DEMO] Configure IBM watsonx.ai for real crop advisory. Consult local agricultural experts.',
    },

    IrrigationAgent: {
      waterQualityAssessment: `[DEMO] Groundwater EC of ${ctx.reading?.groundwaterEC} dS/m ${ctx.reading?.groundwaterEC > 3 ? 'exceeds' : 'is within'} recommended irrigation limits.`,
      irrigationGuidance: [
        'Monitor irrigation water EC before each use',
        'Apply slightly more water than crop needs to leach salt downward',
        'Avoid irrigating during peak heat hours',
      ],
      monitoringPriorities: ['Weekly EC soil tests', 'Monthly groundwater quality test'],
      practicestoAvoid: ['Flood irrigation in saline conditions', 'Over-irrigation causing waterlogging'],
      drainageConsiderations: '[DEMO] Ensure proper field drainage to prevent salt accumulation.',
      whenToSeekExpert: 'When EC exceeds 6 dS/m consistently or crops show visible salt stress.',
    },

    LandReclamationAgent: {
      immediateActions: ['Stop irrigating with highly saline water if EC > 6 dS/m', 'Create drainage channels'],
      shortTermActions: ['Apply gypsum to reduce sodium (get soil test first)', 'Plant salt-tolerant cover crops'],
      longTermMonitoring: ['Quarterly soil EC testing', 'Monitor groundwater levels monthly'],
      precautions: ['Do not apply chemical amendments without soil test results', 'Consult before heavy tillage'],
      whenExpertIsNeeded: 'When soil EC exceeds 8 dS/m, or reclamation efforts show no improvement after 3 months.',
      disclaimer: '[DEMO] AI recommendations support decision-making; they do not replace proper soil testing or local agricultural experts.',
    },

    FarmerAlertAgent: {
      alertTitle: `[DEMO] ${riskResult?.riskLevel} Salinity Alert`,
      greeting: `Dear ${farm?.farmerName},`,
      situationExplained: `[DEMO] Your farm's salinity level is ${riskResult?.riskLevel}. The trend shows ${riskResult?.trend} conditions.`,
      riskInPlainLanguage: riskResult?.riskLevel === 'LOW' ? 'Your farm is healthy right now.' : `Your farm needs attention. Salinity is ${riskResult?.riskLevel === 'HIGH' || riskResult?.riskLevel === 'CRITICAL' ? 'dangerously high' : 'getting higher'}.`,
      topThreeActions: [
        'Check your irrigation water quality',
        'Monitor your crops for salt stress signs',
        'Review crop alternatives in the advisory',
      ],
      encouragingClose: 'You are taking the right steps by monitoring your farm. Help is available.',
      language: 'en',
    },
  }

  return fallbacks[agentName] || { message: '[DEMO] Fallback response — configure IBM credentials.', isDemo: true }
}
