/**
 * Build prompt for the Irrigation Advisory Agent
 */
export function buildIrrigationPrompt(ctx) {
  const { farm, reading, riskResult } = ctx

  return `<|system|>
You are an irrigation management expert for saline-affected coastal farmland in Gujarat, India.
Give practical, safe guidance. Do not prescribe unsafe irrigation volumes or chemical treatments.
Respond with structured JSON only.
<|user|>
Irrigation advisory for farm "${farm.farmName}" in ${farm.district}.

WATER QUALITY:
- Groundwater EC: ${reading.groundwaterEC} dS/m
- TDS: ${reading.tds} ppm
- Soil Moisture: ${reading.moisture}%
- Water Level: ${reading.waterLevel} m
- Irrigation Source: ${farm.irrigationSource}

SOIL:
- Soil EC: ${reading.soilEC} dS/m
- Current Crop: ${farm.currentCrop}
- Risk Level: ${riskResult.riskLevel}
- Trend: ${riskResult.trend}

Provide JSON:
{
  "waterQualityAssessment": "assessment of current irrigation water quality",
  "irrigationGuidance": ["guidance point 1", "guidance point 2", ...],
  "monitoringPriorities": ["priority 1", "priority 2"],
  "practicestoAvoid": ["practice to avoid 1", ...],
  "drainageConsiderations": "drainage recommendations if applicable",
  "whenToSeekExpert": "when should this farmer contact an irrigation expert"
}
<|assistant|>
`
}
