import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',

  ibm: {
    projectId: process.env.IBM_PROJECT_ID || '',
    apiKey: process.env.IBM_WATSON_API_KEY || '',
    aiUrl: process.env.IBM_WATSON_AI_URL || 'https://us-south.ml.cloud.ibm.com',
    modelId: process.env.IBM_GRANITE_MODEL_ID || 'ibm/granite-13b-instruct-v2',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },
}

export const isIBMConfigured = () => {
  return !!(config.ibm.projectId && config.ibm.apiKey)
}
