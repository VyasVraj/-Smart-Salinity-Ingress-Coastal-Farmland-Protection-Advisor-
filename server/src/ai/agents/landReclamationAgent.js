/**
 * Land Reclamation Agent
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { buildReclamationPrompt } from '../prompts/reclamationPrompt.js'

/**
 * @param {object} ctx
 * @returns {Promise<{type: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runLandReclamationAgent(ctx) {
  const prompt = buildReclamationPrompt(ctx)
  const result = await callGranite(prompt, { params: { max_new_tokens: 500 } })

  const output = result.success && result.data
    ? result.data
    : generateFallback('LandReclamationAgent', ctx)

  return {
    type: 'RECLAMATION',
    output,
    isDemo: result.isDemo || !result.success,
    language: 'en',
  }
}
