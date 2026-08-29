import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  ibm: {
    projectId:  process.env.IBM_PROJECT_ID      || '',
    apiKey:     process.env.IBM_WATSON_API_KEY   || '',
    aiUrl:      process.env.IBM_WATSON_AI_URL    || 'https://us-south.ml.cloud.ibm.com',
    // Updated default: granite-3-8b-instruct is the current supported model.
    // Override via IBM_GRANITE_MODEL_ID in .env
    modelId:    process.env.IBM_GRANITE_MODEL_ID || 'ibm/granite-4-h-small',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },
}

export const isIBMConfigured = () => {
  return !!(
    config.ibm.projectId && config.ibm.projectId.trim() &&
    config.ibm.apiKey    && config.ibm.apiKey.trim()    &&
    config.ibm.aiUrl     && config.ibm.aiUrl.trim()
  )
}

/**
 * Print safe startup diagnostics (no secret values exposed).
 */
export function logIBMDiagnostics() {
  console.log('[IBM AI] --- Configuration Diagnostics ---')
  console.log('[IBM AI] API key configured:    ', !!config.ibm.apiKey)
  console.log('[IBM AI] Project ID configured: ', !!config.ibm.projectId)
  console.log('[IBM AI] AI URL:                ', config.ibm.aiUrl)
  console.log('[IBM AI] Model ID:              ', config.ibm.modelId)
  console.log('[IBM AI] IBM ready:             ', isIBMConfigured())
  console.log('[IBM AI] ---------------------------------')
}
