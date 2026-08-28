/**
 * Salinity Shield AI — IBM Granite Service
 *
 * Wraps watsonxClient with:
 * - Error handling and meaningful error classification
 * - JSON-structured output parsing (for agent pipelines)
 * - Raw text output (for chat advisory)
 * - Logging
 * - Timeout protection
 */

import { generateText, generateChat } from './watsonxClient.js'
import { isIBMConfigured } from '../config/env.js'

const TIMEOUT_MS = 60000

/**
 * Classify IBM API errors into user-friendly categories
 */
function classifyError(err) {
  const msg = err.message || ''
  if (msg.includes('credentials not configured')) return { type: 'CONFIG', message: 'IBM watsonx.ai credentials not configured' }
  if (msg.includes('IAM authentication failed') || msg.includes('401')) return { type: 'AUTH', message: 'IBM API key authentication failed — check IBM_WATSON_API_KEY' }
  if (msg.includes('403')) return { type: 'FORBIDDEN', message: 'Access denied — verify IBM_PROJECT_ID and account permissions' }
  if (msg.includes('404')) return { type: 'NOT_FOUND', message: 'Model or endpoint not found — check IBM_GRANITE_MODEL_ID and IBM_WATSON_AI_URL' }
  if (msg.includes('429')) return { type: 'RATE_LIMIT', message: 'IBM watsonx.ai rate limit reached — try again shortly' }
  if (msg.includes('503') || msg.includes('502')) return { type: 'UNAVAILABLE', message: 'IBM watsonx.ai service temporarily unavailable' }
  if (msg.includes('timed out')) return { type: 'TIMEOUT', message: 'IBM Granite request timed out (60s)' }
  if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) return { type: 'NETWORK', message: 'Cannot reach IBM watsonx.ai — check network connectivity' }
  return { type: 'UNKNOWN', message: msg.slice(0, 300) }
}

/**
 * Call Granite for structured JSON output (used by agent pipeline).
 * Returns success/data/raw/isDemo shape.
 *
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<{success: boolean, data: object|null, raw: string, isDemo: boolean, error?: string, errorType?: string}>}
 */
export async function callGranite(prompt, options = {}) {
  if (!isIBMConfigured()) {
    console.warn('[IBM AI] Credentials not configured — using demo fallback')
    return { success: false, data: null, raw: '', isDemo: true, error: 'IBM watsonx.ai credentials not configured', errorType: 'CONFIG' }
  }

  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('IBM Granite request timed out')), TIMEOUT_MS)
  })

  try {
    const raw = await Promise.race([
      generateText(prompt, options.params || {}),
      timeoutPromise,
    ])
    clearTimeout(timeoutId)

    // Extract JSON from response (agent pipeline expects JSON)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('[IBM AI] Response did not contain valid JSON:', raw.slice(0, 200))
      return { success: false, data: null, raw, isDemo: false, error: 'Response did not contain expected JSON structure', errorType: 'PARSE' }
    }

    const data = JSON.parse(jsonMatch[0])
    return { success: true, data, raw, isDemo: false }
  } catch (err) {
    clearTimeout(timeoutId)
    const classified = classifyError(err)
    console.error(`[IBM AI] ${classified.type} error:`, classified.message)
    return { success: false, data: null, raw: '', isDemo: false, error: classified.message, errorType: classified.type }
  }
}

/**
 * Call Granite for free-form text chat response.
 * Uses the chat completions endpoint with proper message structure.
 * Does NOT require JSON in the response — returns raw assistant text.
 *
 * @param {string} systemPrompt - system instruction
 * @param {string} userMessage  - the user's question/message
 * @param {object} options
 * @returns {Promise<{success: boolean, text: string, isDemo: boolean, error?: string, errorType?: string}>}
 */
export async function callGraniteChat(systemPrompt, userMessage, options = {}) {
  if (!isIBMConfigured()) {
    console.warn('[IBM AI] Credentials not configured — using demo fallback')
    return { success: false, text: '', isDemo: true, error: 'IBM watsonx.ai credentials not configured', errorType: 'CONFIG' }
  }

  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('IBM Granite request timed out')), TIMEOUT_MS)
  })

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  try {
    const text = await Promise.race([
      generateChat(messages, options.params || {}),
      timeoutPromise,
    ])
    clearTimeout(timeoutId)

    if (!text || !text.trim()) {
      return { success: false, text: '', isDemo: false, error: 'Granite returned an empty response', errorType: 'EMPTY' }
    }

    return { success: true, text: text.trim(), isDemo: false }
  } catch (err) {
    clearTimeout(timeoutId)
    const classified = classifyError(err)
    console.error(`[IBM AI] ${classified.type} error:`, classified.message)
    return { success: false, text: '', isDemo: false, error: classified.message, errorType: classified.type }
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
