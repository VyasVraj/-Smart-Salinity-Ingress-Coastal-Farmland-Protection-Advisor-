/**
 * Real IBM Granite end-to-end test.
 * Run from project root: node server/src/tests/graniteTest.mjs
 * Tests IAM auth + Granite chat endpoint with the configured model.
 * Never prints secrets. Exits 0 on success, 1 on failure.
 */
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

// Manually parse server/.env (dotenv not available here without install)
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env')
let envLines = []
try {
  envLines = readFileSync(envPath, 'utf8').split('\n')
} catch {
  console.error('[TEST] Could not read server/.env')
  process.exit(1)
}

const env = {}
for (const line of envLines) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m) env[m[1]] = m[2].trim()
}

const apiKey    = env.IBM_WATSON_API_KEY
const projectId = env.IBM_PROJECT_ID
const aiUrl     = env.IBM_WATSON_AI_URL || 'https://us-south.ml.cloud.ibm.com'
const modelId   = env.IBM_GRANITE_MODEL_ID || 'ibm/granite-4-h-small'

console.log('\n=== IBM Granite End-to-End Test ===')
console.log('Model:    ', modelId)
console.log('Endpoint: ', aiUrl)
console.log('Project:  ', projectId ? '✓ SET' : '✗ MISSING')
console.log('API Key:  ', apiKey   ? '✓ SET' : '✗ MISSING')
console.log()

if (!apiKey || !projectId) {
  console.error('ABORT: IBM_WATSON_API_KEY or IBM_PROJECT_ID not set in server/.env')
  process.exit(1)
}

// ── Step 1: IAM token ────────────────────────────────────────────────────────
console.log('Step 1: Fetching IAM token...')
let token
try {
  const iamRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
  })
  if (!iamRes.ok) {
    const t = await iamRes.text()
    console.error('IAM FAILED [' + iamRes.status + ']:', t.slice(0, 300))
    process.exit(1)
  }
  const iamData = await iamRes.json()
  token = iamData.access_token
  console.log('Step 1: ✓ IAM token obtained\n')
} catch (err) {
  console.error('IAM NETWORK ERROR:', err.message)
  process.exit(1)
}

// ── Step 2: Granite chat ──────────────────────────────────────────────────────
console.log('Step 2: Calling Granite chat endpoint...')
const chatBody = {
  model_id: modelId,
  project_id: projectId,
  messages: [
    { role: 'system', content: 'You are a helpful agricultural assistant. Answer in one sentence.' },
    { role: 'user',   content: 'What is soil salinity and why does it matter for farmers?' },
  ],
  parameters: { max_new_tokens: 80, temperature: 0.3 },
}

try {
  const chatRes = await fetch(`${aiUrl}/ml/v1/text/chat?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(chatBody),
  })

  const chatText = await chatRes.text()
  if (!chatRes.ok) {
    console.error('GRANITE CHAT FAILED [' + chatRes.status + ']:', chatText.slice(0, 400))
    process.exit(1)
  }

  const chatData = JSON.parse(chatText)
  const reply = chatData.choices?.[0]?.message?.content
    || chatData.results?.[0]?.generated_text
    || ''

  if (!reply.trim()) {
    console.error('GRANITE RETURNED EMPTY RESPONSE')
    console.error('Raw response:', JSON.stringify(chatData).slice(0, 400))
    process.exit(1)
  }

  console.log('Step 2: ✓ Real Granite response received')
  console.log('\n--- Granite says: ---')
  console.log(reply.trim())
  console.log('---------------------\n')
  console.log('✅ IBM Granite integration verified successfully')
  console.log('   Model:   ', modelId)
  console.log('   Endpoint:', aiUrl)
  process.exit(0)
} catch (err) {
  console.error('GRANITE NETWORK ERROR:', err.message)
  process.exit(1)
}
