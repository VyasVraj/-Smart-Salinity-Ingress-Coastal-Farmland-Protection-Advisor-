/**
 * Chat Advisory Agent — handles contextual AI chat queries
 */

import { callGranite } from '../graniteService.js'
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

  const advisorySummary = recentAdvisories.slice(0, 3)
    .map(a => `${a.type}: ${JSON.stringify(JSON.parse(a.content)).slice(0, 200)}`)
    .join('\n')

  const prompt = `<|system|>
You are Salinity Shield AI, an agricultural advisor for coastal Gujarat farmers.
Answer the farmer's question based ONLY on the provided farm data.
Never invent sensor readings. Be clear if data is unavailable.
Keep answers under 300 words. Be practical and farmer-friendly.
IMPORTANT: You MUST respond ONLY in ${langLabel}. Do not use any other language.
<|user|>
Farm: ${farm.farmName} (${farm.district})
Farmer: ${farm.farmerName}
Current Crop: ${farm.currentCrop}
Soil Type: ${farm.soilType}
Irrigation: ${farm.irrigationSource}

${latestReading ? `LATEST READING:
- Soil EC: ${latestReading.soilEC} dS/m
- Groundwater EC: ${latestReading.groundwaterEC} dS/m
- TDS: ${latestReading.tds} ppm
- pH: ${latestReading.soilPH}
- Source: ${latestReading.source}` : 'No readings available yet.'}

${latestRisk ? `CURRENT RISK: ${latestRisk.riskLevel} (score: ${latestRisk.riskScore}/100)
TREND: ${latestRisk.trend} (${latestRisk.trendChangePercent}% change)` : 'Risk not yet assessed.'}

RECENT ADVISORIES:
${advisorySummary || 'No advisories yet.'}

FARMER QUESTION: ${question}

Respond in ${langLabel} only.
<|assistant|>
`

  if (!isIBMConfigured()) {
    const demoFn = DEMO_RESPONSES[language] || DEMO_RESPONSES.en
    return {
      answer: demoFn(question, farm, latestRisk),
      isDemo: true,
    }
  }

  const result = await callGranite(prompt, { params: { max_new_tokens: 400, temperature: 0.6 } })

  if (result.success) {
    return { answer: result.raw, isDemo: false }
  }

  return {
    answer: `I encountered an issue analyzing your question. ${result.error || ''}\n\nBased on available data: Farm ${farm.farmName} is at ${latestRisk?.riskLevel || 'UNKNOWN'} risk with ${latestRisk?.trend || 'UNKNOWN'} trend.`,
    isDemo: false,
  }
}
