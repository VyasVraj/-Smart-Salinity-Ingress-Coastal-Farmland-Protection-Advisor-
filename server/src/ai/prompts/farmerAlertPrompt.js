/**
 * Build prompt for the Farmer Alert Agent
 * Translates technical analysis into farmer-friendly language
 */
export function buildFarmerAlertPrompt(ctx) {
  const { farm, reading, riskResult, monitoringOutput, language } = ctx

  const langInstructions = {
    en: 'Respond in clear, simple English that a farmer with basic literacy can understand.',
    hi: 'किसान को सरल हिंदी में जवाब दें जो एक साधारण किसान समझ सके।',
    gu: 'ખેડૂત ને સરળ ગુજરાતી ભાષામાં જવાબ આપો જે સાધારણ ખેડૂત સમજી શકે.',
  }

  const langNote = langInstructions[language] || langInstructions.en

  return `<|system|>
You are a helpful agricultural advisor. ${langNote}
Use simple words. Avoid technical jargon. Respond with structured JSON only.
The JSON keys must remain in English; only the text values should be in the requested language.
<|user|>
Create a farmer-friendly advisory for ${farm.farmerName}, farm "${farm.farmName}", ${farm.district}.

TECHNICAL SUMMARY:
- Risk Level: ${riskResult.riskLevel}
- Risk Score: ${riskResult.riskScore}/100
- Trend: ${riskResult.trend}
- Change: ${riskResult.trendChangePercent}%
- Summary: ${riskResult.reasoningSummary}
- Current Crop: ${farm.currentCrop}
- Soil EC: ${reading.soilEC} dS/m
- Groundwater EC: ${reading.groundwaterEC} dS/m

Provide JSON:
{
  "alertTitle": "brief alert title (max 10 words)",
  "greeting": "personal greeting to farmer",
  "situationExplained": "explain current farm situation in 2-3 simple sentences",
  "riskInPlainLanguage": "explain the risk level simply",
  "topThreeActions": ["simple action 1", "simple action 2", "simple action 3"],
  "encouragingClose": "brief encouraging closing message",
  "language": "${language}"
}
<|assistant|>
`
}
