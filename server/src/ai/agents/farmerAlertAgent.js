/**
 * Farmer Alert & Advisory Agent
 * Produces multilingual farmer-friendly advisories
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { buildFarmerAlertPrompt } from '../prompts/farmerAlertPrompt.js'

/**
 * @param {object} ctx
 * @returns {Promise<{type: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runFarmerAlertAgent(ctx, language = 'en') {
  const ctxWithLang = { ...ctx, language }
  const prompt = buildFarmerAlertPrompt(ctxWithLang)
  const result = await callGranite(prompt, { params: { max_new_tokens: 400 } })

  const output = result.success && result.data
    ? result.data
    : generateFallback('FarmerAlertAgent', ctx)

  return {
    type: 'ALERT',
    output,
    isDemo: result.isDemo || !result.success,
    language,
  }
}
