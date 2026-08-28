/**
 * Chat Advisory Agent — handles contextual AI chat queries via IBM Granite
 *
 * Uses callGraniteChat() which:
 * - Calls the /ml/v1/text/chat endpoint (Granite 3.x native)
 * - Auto-falls back to /ml/v1/text/generation if chat endpoint not supported
 * - Does NOT require JSON in the response
 * - Returns the raw assistant text directly
 */

import { callGraniteChat } from '../graniteService.js'
import { isIBMConfigured } from '../../config/env.js'

const LANG_LABELS = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  gu: 'Gujarati (ગુજરાતી)',
}

const DEMO_RESPONSES = {
  en: (question, farm, latestRisk) =>
    `[DEMO MODE — IBM Granite not configured]\n\nYour question: "${question}"\n\nBased on your farm data:\n- Farm: ${farm.farmName} (${farm.district})\n- Risk: ${latestRisk?.riskLevel || 'Not assessed'}\n- Trend: ${latestRisk?.trend || 'Unknown'}\n\nTo get real AI-powered answers, configure your IBM watsonx.ai credentials in the .env file.`,

  hi: (question, farm, latestRisk) =>
    `[डेमो मोड — IBM Granite कॉन्फ़िगर नहीं है]\n\nआपका प्रश्न: "${question}"\n\nआपके खेत की जानकारी:\n- खेत: ${farm.farmName} (${farm.district})\n- जोखिम स्तर: ${latestRisk?.riskLevel || 'मूल्यांकन नहीं हुआ'}\n- प्रवृत्ति: ${latestRisk?.trend || 'अज्ञात'}\n\nवास्तविक AI उत्तर पाने के लिए, .env फ़ाइल में IBM watsonx.ai क्रेडेंशियल कॉन्फ़िगर करें।`,

  gu: (question, farm, latestRisk) =>
    `[ડેમો મોડ — IBM Granite ગોઠવાયેલ નથી]\n\nતમારો પ્રશ્ન: "${question}"\n\nતમારા ખેતરની માહિતી:\n- ખેતર: ${farm.farmName} (${farm.district})\n- જોખમ સ્તર: ${latestRisk?.riskLevel || 'આકારણી નથી'}\n- વલણ: ${latestRisk?.trend || 'અજ્ઞાત'}\n\nવાસ્તવિક AI જવાબો મેળવવા માટે, .env ફાઇલમાં IBM watsonx.ai ઓળખપત્ર ગોઠવો।`,
}

/**
 * @param {object} params
 * @param {string} params.question
 * @param {object} params.farm
 * @param {object} params.latestReading
 * @param {object} params.latestRisk
 * @param {Array}  params.recentAdvisories
 * @param {string} params.language - 'en' | 'hi' | 'gu'
 * @returns {Promise<{answer: string, isDemo: boolean}>}
 */
export async function runChatAdvisor({ question, farm, latestReading, latestRisk, recentAdvisories, language = 'en' }) {
  if (!farm) {
    return { answer: 'Please select a farm to get personalized advice.', isDemo: false }
  }

  const langLabel = LANG_LABELS[language] || LANG_LABELS.en

  // Return demo response immediately if IBM is not configured
  if (!isIBMConfigured()) {
    console.log('[IBM AI] Not configured — returning demo chat response')
    const demoFn = DEMO_RESPONSES[language] || DEMO_RESPONSES.en
    return { answer: demoFn(question, farm, latestRisk), isDemo: true }
  }

  // Build the system prompt with full farm context
  const systemPrompt = `You are Salinity Shield AI, a knowledgeable and empathetic agricultural advisor specializing in soil salinity management for coastal Gujarat farmers. 

Your role:
- Answer farmer questions based ONLY on the provided farm data
- Give practical, actionable advice tailored to the specific farm conditions
- Never invent or fabricate sensor readings or data
- Be honest when data is unavailable — say so clearly
- Keep answers under 350 words, using clear and farmer-friendly language
- Avoid overly technical jargon; explain terms when used
- Show care for the farmer's livelihood and wellbeing

IMPORTANT LANGUAGE INSTRUCTION: You MUST respond ENTIRELY in ${langLabel}. Do not use any other language in your response. If responding in Hindi or Gujarati, use proper script (not transliteration).`

  // Build the user message with all available farm context
  const advisorySummary = (recentAdvisories || []).slice(0, 2)
    .map(a => {
      try {
        const parsed = JSON.parse(a.content)
        return `[${a.type}] ${parsed.answer ? parsed.answer.slice(0, 150) + '...' : JSON.stringify(parsed).slice(0, 150)}`
      } catch {
        return `[${a.type}] ${String(a.content).slice(0, 150)}`
      }
    })
    .join('\n')

  const userMessage = `FARM INFORMATION:
Farm Name: ${farm.farmName}
District: ${farm.district}
Farmer: ${farm.farmerName}
Current Crop: ${farm.currentCrop || 'Not specified'}
Soil Type: ${farm.soilType || 'Not specified'}
Irrigation Source: ${farm.irrigationSource || 'Not specified'}
Land Area: ${farm.landArea ? `${farm.landArea} acres` : 'Not specified'}

${latestReading ? `LATEST SENSOR READING (${new Date(latestReading.timestamp).toLocaleDateString('en-IN')}):
- Soil EC: ${latestReading.soilEC} dS/m
- Groundwater EC: ${latestReading.groundwaterEC} dS/m
- Total Dissolved Solids (TDS): ${latestReading.tds} ppm
- Soil pH: ${latestReading.soilPH}
- Moisture: ${latestReading.moisture ?? 'N/A'}%
- Reading Source: ${latestReading.source}` : 'SENSOR DATA: No readings recorded yet for this farm.'}

${latestRisk ? `CURRENT RISK ASSESSMENT:
- Risk Level: ${latestRisk.riskLevel}
- Risk Score: ${latestRisk.riskScore}/100
- Trend: ${latestRisk.trend}
- Trend Change: ${latestRisk.trendChangePercent}%
- Summary: ${latestRisk.reasoningSummary || 'N/A'}` : 'RISK ASSESSMENT: Not yet computed for this farm.'}

${advisorySummary ? `RECENT ADVISORIES:\n${advisorySummary}` : 'RECENT ADVISORIES: None yet.'}

FARMER QUESTION: ${question}

Please respond in ${langLabel} only.`

  console.log('[IBM AI] Calling Granite chat for farm:', farm.farmName, '| language:', language)

  const result = await callGraniteChat(systemPrompt, userMessage, {
    params: { max_new_tokens: 500, temperature: 0.6, decoding_method: 'greedy' },
  })

  if (result.success) {
    console.log('[IBM AI] Chat response received successfully')
    return { answer: result.text, isDemo: false }
  }

  // IBM configured but call failed — return meaningful error (not demo)
  console.error('[IBM AI] Chat call failed:', result.errorType, result.error)

  const errorMessages = {
    AUTH: `IBM Granite authentication failed. The API key may be invalid or expired. Please check your IBM_WATSON_API_KEY configuration.\n\nFarm ${farm.farmName} is at ${latestRisk?.riskLevel || 'UNKNOWN'} risk with ${latestRisk?.trend || 'UNKNOWN'} trend.`,
    FORBIDDEN: `IBM Granite access denied. Please verify your IBM_PROJECT_ID is correct and that your account has access to this project.\n\nFarm ${farm.farmName} current risk: ${latestRisk?.riskLevel || 'UNKNOWN'}.`,
    NOT_FOUND: `IBM Granite model not found. The configured model ID (${process.env.IBM_GRANITE_MODEL_ID || 'ibm/granite-13b-instruct-v2'}) may be unavailable or deprecated. Try updating IBM_GRANITE_MODEL_ID in your .env file.`,
    RATE_LIMIT: `IBM watsonx.ai rate limit reached. Please wait a moment and try again.`,
    TIMEOUT: `IBM Granite request timed out. The service may be under load. Please try again.\n\nFarm ${farm.farmName} is at ${latestRisk?.riskLevel || 'UNKNOWN'} risk.`,
    NETWORK: `Cannot connect to IBM watsonx.ai. Please check your internet connection and verify IBM_WATSON_AI_URL is correct.`,
    UNAVAILABLE: `IBM watsonx.ai is temporarily unavailable. Please try again in a few minutes.`,
  }

  const errorAnswer = errorMessages[result.errorType]
    || `IBM Granite request failed: ${result.error || 'Unknown error'}\n\nFarm ${farm.farmName} is at ${latestRisk?.riskLevel || 'UNKNOWN'} risk with ${latestRisk?.trend || 'UNKNOWN'} trend.`

  return { answer: errorAnswer, isDemo: false }
}
