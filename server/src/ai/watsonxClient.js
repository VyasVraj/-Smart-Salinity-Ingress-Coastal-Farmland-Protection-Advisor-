/**
 * Salinity Shield AI — IBM watsonx.ai Client
 *
 * Handles authentication and text generation via IBM watsonx.ai API.
 * All credentials are server-side only — never exposed to the browser.
 *
 * Supports two generation modes:
 *   - generateText()  : /ml/v1/text/generation  (legacy Granite models)
 *   - generateChat()  : /ml/v1/text/chat         (Granite 3.x+ / granite-4 instruction models)
 *
 * NOTE: granite-4-h-small and granite-3.x are chat-native models.
 * Prefer generateChat() for all current Granite models.
 * generateText() is retained for legacy compatibility only.
 */

import { config, isIBMConfigured } from '../config/env.js'

let _tokenCache = null
let _tokenExpiry = 0

/**
 * Fetch IAM access token from IBM Cloud (cached, auto-refreshed)
 * @returns {Promise<string>}
 */
async function getIAMToken() {
  const now = Date.now()
  if (_tokenCache && now < _tokenExpiry) {
    return _tokenCache
  }

  console.log('[IBM AI] Fetching fresh IAM token...')

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${config.ibm.apiKey}`,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`IBM IAM authentication failed (${response.status}): ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  _tokenCache = data.access_token
  // Expire 5 minutes before actual expiry for safety
  _tokenExpiry = now + (data.expires_in - 300) * 1000
  console.log('[IBM AI] IAM token obtained successfully')
  return _tokenCache
}

/**
 * Generate free-form text via IBM watsonx.ai text/generation endpoint.
 * Retained for legacy compatibility. granite-4-h-small prefers generateChat().
 *
 * @param {string} prompt - full formatted prompt
 * @param {object} params - generation parameters
 * @returns {Promise<string>} generated text
 */
export async function generateText(prompt, params = {}) {
  if (!isIBMConfigured()) {
    throw new Error('IBM watsonx.ai credentials not configured')
  }

  console.log('[IBM AI] Sending text generation request...')
  console.log('[IBM AI] Model:', config.ibm.modelId)
  console.log('[IBM AI] Project configured:', !!config.ibm.projectId)

  const token = await getIAMToken()

  const body = {
    model_id: config.ibm.modelId,
    project_id: config.ibm.projectId,
    input: prompt,
    parameters: {
      decoding_method: params.decoding_method || 'greedy',
      max_new_tokens: params.max_new_tokens || 600,
      min_new_tokens: params.min_new_tokens || 10,
      temperature: params.temperature || 0.7,
      repetition_penalty: params.repetition_penalty || 1.1,
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
    const errMsg = `IBM watsonx.ai text generation error (${response.status}): ${text.slice(0, 400)}`
    console.error('[IBM AI]', errMsg)
    throw new Error(errMsg)
  }

  const data = await response.json()

  if (!data.results || !data.results[0]) {
    throw new Error('Unexpected IBM watsonx.ai response format: missing results array')
  }

  const generated = data.results[0].generated_text?.trim() || ''
  console.log('[IBM AI] Text generation successful, tokens:', data.results[0].generated_token_count)
  return generated
}

/**
 * Generate a response via IBM watsonx.ai chat completions endpoint.
 * Required for Granite 3.x instruction-tuned models.
 *
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} params - generation parameters
 * @returns {Promise<string>} assistant message content
 */
export async function generateChat(messages, params = {}) {
  if (!isIBMConfigured()) {
    throw new Error('IBM watsonx.ai credentials not configured')
  }

  console.log('[IBM AI] Sending chat generation request...')
  console.log('[IBM AI] Model:', config.ibm.modelId)
  console.log('[IBM AI] Project configured:', !!config.ibm.projectId)
  console.log('[IBM AI] Message count:', messages.length)

  const token = await getIAMToken()

  const body = {
    model_id: config.ibm.modelId,
    project_id: config.ibm.projectId,
    messages,
    parameters: {
      decoding_method: params.decoding_method || 'greedy',
      max_new_tokens: params.max_new_tokens || 600,
      min_new_tokens: params.min_new_tokens || 10,
      temperature: params.temperature || 0.7,
      repetition_penalty: params.repetition_penalty || 1.1,
    },
  }

  const url = `${config.ibm.aiUrl}/ml/v1/text/chat?version=2023-05-29`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    const errMsg = `IBM watsonx.ai chat error (${response.status}): ${errorBody.slice(0, 400)}`
    console.error('[IBM AI]', errMsg)
    throw new Error(errMsg)
  }

  const data = await response.json()

  // Chat endpoint returns choices[0].message.content
  const content = data.choices?.[0]?.message?.content?.trim()
    || data.results?.[0]?.generated_text?.trim()  // fallback shape
    || ''

  if (!content) {
    throw new Error('IBM watsonx.ai chat response was empty')
  }

  console.log('[IBM AI] Chat generation successful')
  return content
}
