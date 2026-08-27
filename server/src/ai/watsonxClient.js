/**
 * Salinity Shield AI — IBM watsonx.ai Client
 *
 * Handles authentication and text generation via IBM watsonx.ai API.
 * All credentials are server-side only — never exposed to the browser.
 */

import { config, isIBMConfigured } from '../config/env.js'

let _tokenCache = null
let _tokenExpiry = 0

/**
 * Fetch IAM access token from IBM Cloud
 * @returns {Promise<string>}
 */
async function getIAMToken() {
  const now = Date.now()
  if (_tokenCache && now < _tokenExpiry) {
    return _tokenCache
  }

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${config.ibm.apiKey}`,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`IBM IAM token error: ${response.status} — ${text}`)
  }

  const data = await response.json()
  _tokenCache = data.access_token
  // Expire 5 minutes before actual expiry
  _tokenExpiry = now + (data.expires_in - 300) * 1000
  return _tokenCache
}

/**
 * Generate text via IBM watsonx.ai
 * @param {string} prompt - full formatted prompt
 * @param {object} params - generation parameters
 * @returns {Promise<string>} generated text
 */
export async function generateText(prompt, params = {}) {
  if (!isIBMConfigured()) {
    throw new Error('IBM watsonx.ai credentials not configured')
  }

  const token = await getIAMToken()

  const body = {
    model_id: config.ibm.modelId,
    project_id: config.ibm.projectId,
    input: prompt,
    parameters: {
      decoding_method: params.decoding_method || 'greedy',
      max_new_tokens: params.max_new_tokens || 600,
      min_new_tokens: params.min_new_tokens || 10,
      temperature: params.temperature || 0.5,
      repetition_penalty: 1.1,
    },
  }

  const url = `${config.ibm.aiUrl}/ml/v1/text/generation?version=2023-05-29`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`IBM watsonx.ai API error: ${response.status} — ${text}`)
  }

  const data = await response.json()

  if (!data.results || !data.results[0]) {
    throw new Error('Unexpected IBM watsonx.ai response format')
  }

  return data.results[0].generated_text?.trim() || ''
}
