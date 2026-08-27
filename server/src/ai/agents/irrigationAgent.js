/**
 * Irrigation Advisory Agent
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { buildIrrigationPrompt } from '../prompts/irrigationPrompt.js'

/**
 * @param {object} ctx
 * @returns {Promise<{type: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runIrrigationAgent(ctx) {
  const prompt = buildIrrigationPrompt(ctx)
  const result = await callGranite(prompt, { params: { max_new_tokens: 400 } })

  const output = result.success && result.data
    ? result.data
    : generateFallback('IrrigationAgent', ctx)

  return {
    type: 'IRRIGATION',
    output,
    isDemo: result.isDemo || !result.success,
    language: 'en',
  }
}
