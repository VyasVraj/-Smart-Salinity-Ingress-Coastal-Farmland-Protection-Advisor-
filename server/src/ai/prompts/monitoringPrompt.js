/**
 * Build the prompt for the Salinity Monitoring Agent
 * @param {object} ctx
 */
export function buildMonitoringPrompt(ctx) {
  const { farm, reading, riskResult, history } = ctx

  const historySummary = history.length > 0
    ? history.slice(-5).map(r =>
        `  - ${new Date(r.timestamp).toLocaleDateString()}: soilEC=${r.soilEC}, gwEC=${r.groundwaterEC}, TDS=${r.tds}`
      ).join('\n')
    : '  No prior readings available.'

  return `<|system|>
You are a soil and groundwater salinity expert advising coastal farmers in Gujarat, India.
Your analysis must be factual, concise, and actionable. Do not invent data.
Respond in clear English. Provide structured JSON output only.
<|user|>
Analyze the following salinity data for farm "${farm.farmName}" in ${farm.district} district.

CURRENT READING:
- Soil EC: ${reading.soilEC} dS/m
- Groundwater EC: ${reading.groundwaterEC} dS/m
- TDS: ${reading.tds} ppm
- Soil pH: ${reading.soilPH}
- Moisture: ${reading.moisture}%
- Water Level: ${reading.waterLevel} m
- Source: ${reading.source}

DETERMINISTIC RISK RESULT:
- Risk Level: ${riskResult.riskLevel}
- Risk Score: ${riskResult.riskScore}/100
- Trend: ${riskResult.trend}
- Change: ${riskResult.trendChangePercent}%
- Summary: ${riskResult.reasoningSummary}

RECENT HISTORY (last 5 readings):
${historySummary}

FARM:
- Crop: ${farm.currentCrop}
- Soil Type: ${farm.soilType}
- Irrigation: ${farm.irrigationSource}
- Location: ${farm.location}

Provide your analysis as JSON with these fields:
{
  "conditionSummary": "2-3 sentence summary of current farm conditions",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "trendInterpretation": "interpret the salinity trend and what it means",
  "requiresIntervention": true/false,
  "interventionUrgency": "IMMEDIATE|SOON|MONITOR",
  "confidenceNote": "brief note on data confidence"
}
<|assistant|>
`
}
