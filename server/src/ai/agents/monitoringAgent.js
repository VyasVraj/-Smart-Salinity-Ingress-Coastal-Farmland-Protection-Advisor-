/**
 * Soil & Groundwater Salinity Monitoring Agent
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { buildMonitoringPrompt } from '../prompts/monitoringPrompt.js'

/**
 * @param {object} ctx - { farm, reading, riskResult, history }
 * @returns {Promise<{type: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runMonitoringAgent(ctx) {
  const prompt = buildMonitoringPrompt(ctx)
  const result = await callGranite(prompt, { params: { max_new_tokens: 400 } })

  const output = result.success && result.data
    ? result.data
    : generateFallback('MonitoringAgent', ctx)

  return {
    type: 'MONITORING',
    output,
    isDemo: result.isDemo || !result.success,
    language: 'en',
  }
}
