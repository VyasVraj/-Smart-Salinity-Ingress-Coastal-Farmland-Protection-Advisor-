/**
 * Build prompt for the Crop Advisory Agent
 */
export function buildCropAdvisoryPrompt(ctx) {
  const { farm, reading, riskResult } = ctx

  return `<|system|>
You are an agricultural expert specializing in salt-tolerant crops for coastal Gujarat, India.
Provide factual, evidence-based guidance only. Clearly state uncertainties.
Respond with structured JSON only.
<|user|>
Provide crop advisory for farm "${farm.farmName}" in ${farm.district}, Gujarat.

CURRENT CONDITIONS:
- Current Crop: ${farm.currentCrop}
- Soil EC: ${reading.soilEC} dS/m (${reading.soilEC > 4 ? 'ABOVE safe threshold' : 'within range'})
- Groundwater EC: ${reading.groundwaterEC} dS/m
- Soil pH: ${reading.soilPH}
- Risk Level: ${riskResult.riskLevel}
- Trend: ${riskResult.trend}
- Soil Type: ${farm.soilType}
- Irrigation Source: ${farm.irrigationSource}
- District: ${farm.district}

Provide JSON with:
{
  "currentCropAssessment": "can current crop survive these conditions? brief assessment",
  "stressRisk": "LOW|MODERATE|HIGH|SEVERE",
  "recommendations": [
    {
      "crop": "crop name",
      "suitability": "HIGH|MODERATE|LOW",
      "reason": "why suitable for these salinity levels",
      "considerations": "key growing considerations",
      "confidence": "confidence level and limitations"
    }
  ],
  "immediateActions": ["action 1", "action 2"],
  "disclaimer": "standard agricultural disclaimer"
}

Include 2-4 crop recommendations suitable for ${farm.district} district's climate.
Consider crops known to tolerate salinity such as date palm, barley, sugar beet, cotton (Gujarat variety), jowar, bajra, or mangrove-zone crops.
<|assistant|>
`
}
