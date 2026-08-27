/**
 * Build prompt for the Land Reclamation Agent
 */
export function buildReclamationPrompt(ctx) {
  const { farm, reading, riskResult } = ctx

  return `<|system|>
You are a land reclamation specialist for saline-affected coastal farmland in Gujarat, India.
Provide prioritized, practical guidance. Clearly state that AI guidance supports — but does not replace — expert soil testing.
Respond with structured JSON only.
<|user|>
Land reclamation plan for farm "${farm.farmName}" in ${farm.district}.

CONDITIONS:
- Soil EC: ${reading.soilEC} dS/m
- Groundwater EC: ${reading.groundwaterEC} dS/m
- Soil pH: ${reading.soilPH}
- Risk Level: ${riskResult.riskLevel}
- Trend: ${riskResult.trend}
- Land Area: ${farm.landArea} hectares
- Soil Type: ${farm.soilType}

Provide JSON:
{
  "immediateActions": ["action within 1 week"],
  "shortTermActions": ["actions within 1-3 months"],
  "longTermMonitoring": ["ongoing practices"],
  "precautions": ["important precautions"],
  "whenExpertIsNeeded": "describe when to contact soil/reclamation experts",
  "disclaimer": "AI recommendations support decision-making; they do not replace proper soil testing or local agricultural experts."
}
<|assistant|>
`
}
