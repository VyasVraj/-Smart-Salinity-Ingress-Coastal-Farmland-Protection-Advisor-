/**
 * Salinity-Resistant Crop Advisory Agent
 */

import { callGranite, generateFallback } from '../graniteService.js'
import { buildCropAdvisoryPrompt } from '../prompts/cropAdvisoryPrompt.js'

/**
 * @param {object} ctx
 * @returns {Promise<{type: string, output: object, isDemo: boolean, language: string}>}
 */
export async function runCropAdvisoryAgent(ctx) {
  const prompt = buildCropAdvisoryPrompt(ctx)
  const result = await callGranite(prompt, { params: { max_new_tokens: 600 } })

  const output = result.success && result.data
    ? result.data
    : generateFallback('CropAdvisoryAgent', ctx)

  return {
    type: 'CROP',
    output,
    isDemo: result.isDemo || !result.success,
    language: 'en',
  }
}
