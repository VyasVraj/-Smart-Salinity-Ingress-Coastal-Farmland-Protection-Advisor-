/**
 * Salinity Shield AI — Static Demo Data
 *
 * Used automatically when the backend is unreachable.
 * All data is clearly labeled as DEMO / SYNTHETIC.
 */

const now = new Date()
const daysAgo = (d) => new Date(now - d * 86400000).toISOString()

export const DEMO_FARMS = [
  {
    id: 'demo-farm-1',
    farmName: 'Coastal Farm — Bhavnagar A',
    farmerName: 'Ramesh Patel',
    district: 'Bhavnagar',
    location: 'Mahuva Taluka, Bhavnagar',
    landArea: 4.5,
    currentCrop: 'Cotton',
    soilType: 'Black Cotton Soil (Vertisol)',
    irrigationSource: 'Canal + Borewell',
    latitude: 21.4627,
    longitude: 72.1525,
    createdAt: daysAgo(60),
    readings: [
      { id: 'r1-1', soilEC: 1.4, groundwaterEC: 0.9, tds: 620, soilPH: 6.8, moisture: 47, waterLevel: 8.2, source: 'SIMULATOR', timestamp: daysAgo(1) },
    ],
    riskAssessments: [
      { id: 'ra1-1', riskLevel: 'LOW', riskScore: 18, trend: 'STABLE', trendChangePercent: 1.2, reasoningSummary: '[DEMO] Salinity parameters are within acceptable ranges.', createdAt: daysAgo(1) },
    ],
    alerts: [],
    advisories: [],
    agentRuns: [],
  },
  {
    id: 'demo-farm-2',
    farmName: 'Delta Farm — Jamnagar B',
    farmerName: 'Suresh Jadeja',
    district: 'Jamnagar',
    location: 'Kalawad Taluka, Jamnagar',
    landArea: 6.2,
    currentCrop: 'Groundnut',
    soilType: 'Sandy Loam',
    irrigationSource: 'Borewell',
    latitude: 22.4707,
    longitude: 70.0577,
    createdAt: daysAgo(60),
    readings: [
      { id: 'r2-1', soilEC: 5.2, groundwaterEC: 3.8, tds: 2800, soilPH: 7.4, moisture: 32, waterLevel: 5.1, source: 'SIMULATOR', timestamp: daysAgo(1) },
    ],
    riskAssessments: [
      { id: 'ra2-1', riskLevel: 'HIGH', riskScore: 68, trend: 'WORSENING', trendChangePercent: 18.4, reasoningSummary: '[DEMO] Soil EC (5.2 dS/m) is above safe levels. Salinity has been consistently increasing over recent readings.', createdAt: daysAgo(1) },
    ],
    alerts: [
      { id: 'al2-1', severity: 'HIGH', title: '[DEMO] High Salinity Alert — Jamnagar B', message: '[DEMO] Soil EC has increased significantly over the past 2 weeks. Immediate action recommended.', status: 'ACTIVE', createdAt: daysAgo(2), farmId: 'demo-farm-2' },
    ],
    advisories: [
      {
        id: 'adv2-1', type: 'MONITORING', language: 'en', createdAt: daysAgo(1),
        content: JSON.stringify({ conditionSummary: '[DEMO] Farm Delta shows increasing salinity levels.', keyFindings: ['Soil EC trending upward', 'Groundwater quality deteriorating'], requiresIntervention: true, interventionUrgency: 'SOON', confidenceNote: '[DEMO] Configure IBM watsonx.ai for real AI analysis.' }),
      },
    ],
    agentRuns: [
      { id: 'ar2-1', agentName: 'MonitoringAgent', status: 'COMPLETED', triggerReason: 'Risk: HIGH, Trend: WORSENING', inputSummary: '{}', outputSummary: 'High salinity detected', createdAt: daysAgo(1) },
    ],
  },
  {
    id: 'demo-farm-3',
    farmName: 'Rann Farm — Kutch C',
    farmerName: 'Bharat Sodha',
    district: 'Kutch',
    location: 'Mandvi Taluka, Kutch',
    landArea: 8.0,
    currentCrop: 'Bajra (Pearl Millet)',
    soilType: 'Sandy Desert Soil',
    irrigationSource: 'Borewell (Deep)',
    latitude: 22.8329,
    longitude: 69.3534,
    createdAt: daysAgo(60),
    readings: [
      { id: 'r3-1', soilEC: 9.8, groundwaterEC: 7.4, tds: 6200, soilPH: 8.1, moisture: 21, waterLevel: 3.2, source: 'SIMULATOR', timestamp: daysAgo(1) },
    ],
    riskAssessments: [
      { id: 'ra3-1', riskLevel: 'CRITICAL', riskScore: 87, trend: 'RAPIDLY_WORSENING', trendChangePercent: 34.6, reasoningSummary: '[DEMO] Soil EC (9.8 dS/m) is critically elevated. Groundwater EC (7.4 dS/m) indicates severe salinity ingress. Salinity is increasing rapidly — immediate action is required.', createdAt: daysAgo(1) },
    ],
    alerts: [
      { id: 'al3-1', severity: 'CRITICAL', title: '[DEMO] Critical Salinity Ingress — Kutch C', message: '[DEMO] Rapid salinity ingress detected. Soil EC exceeds 8 dS/m. Crop failure risk is HIGH.', status: 'ACTIVE', createdAt: daysAgo(1), farmId: 'demo-farm-3' },
      { id: 'al3-2', severity: 'HIGH', title: '[DEMO] Groundwater Contamination Alert', message: '[DEMO] Groundwater EC exceeds 6 dS/m. Irrigation with current borewell water not recommended.', status: 'ACTIVE', createdAt: daysAgo(2), farmId: 'demo-farm-3' },
    ],
    advisories: [
      {
        id: 'adv3-1', type: 'CROP', language: 'en', createdAt: daysAgo(1),
        content: JSON.stringify({ currentCropAssessment: '[DEMO] Bajra faces significant salinity stress at current EC levels.', stressRisk: 'SEVERE', recommendations: [{ crop: 'Barley', suitability: 'HIGH', reason: 'Tolerates up to 8 dS/m', considerations: 'Short season crop', confidence: '[DEMO]' }, { crop: 'Date Palm', suitability: 'HIGH', reason: 'Excellent salt tolerance', considerations: 'Long-term investment', confidence: '[DEMO]' }], immediateActions: ['Stop irrigating with saline water', 'Test alternative water source'], disclaimer: '[DEMO] Consult local agricultural experts.' }),
      },
    ],
    agentRuns: [
      { id: 'ar3-1', agentName: 'MonitoringAgent',     status: 'COMPLETED', triggerReason: 'Risk: CRITICAL, Trend: RAPIDLY_WORSENING', inputSummary: '{}', outputSummary: 'Critical salinity detected', createdAt: daysAgo(1) },
      { id: 'ar3-2', agentName: 'CropAdvisoryAgent',   status: 'COMPLETED', triggerReason: 'Risk: CRITICAL, Trend: RAPIDLY_WORSENING', inputSummary: '{}', outputSummary: 'Switch to salt-tolerant crops recommended', createdAt: daysAgo(1) },
      { id: 'ar3-3', agentName: 'FarmerAlertAgent',    status: 'COMPLETED', triggerReason: 'Risk: CRITICAL, Trend: RAPIDLY_WORSENING', inputSummary: '{}', outputSummary: 'Alert sent to farmer', createdAt: daysAgo(1) },
    ],
  },
]

export const DEMO_READINGS = {
  'demo-farm-1': Array.from({ length: 30 }, (_, i) => ({
    id: `r1-hist-${i}`,
    farmId: 'demo-farm-1',
    soilEC:        +(1.2 + Math.sin(i * 0.3) * 0.2 + Math.random() * 0.1).toFixed(2),
    groundwaterEC: +(0.8 + Math.sin(i * 0.3) * 0.1 + Math.random() * 0.05).toFixed(2),
    tds:           Math.round(580 + Math.sin(i * 0.3) * 80),
    soilPH:        +(6.8 + (Math.random() - 0.5) * 0.3).toFixed(1),
    moisture:      +(45 + (Math.random() - 0.5) * 6).toFixed(1),
    waterLevel:    +(8.1 + (Math.random() - 0.5) * 0.4).toFixed(1),
    source:        'SIMULATOR',
    timestamp:     daysAgo(30 - i),
  })),
  'demo-farm-2': Array.from({ length: 30 }, (_, i) => ({
    id: `r2-hist-${i}`,
    farmId: 'demo-farm-2',
    soilEC:        +(2.0 + i * 0.11 + (Math.random() - 0.5) * 0.2).toFixed(2),
    groundwaterEC: +(1.5 + i * 0.08 + (Math.random() - 0.5) * 0.15).toFixed(2),
    tds:           Math.round(1000 + i * 60 + (Math.random() - 0.5) * 100),
    soilPH:        +(7.1 + i * 0.01 + (Math.random() - 0.5) * 0.2).toFixed(1),
    moisture:      +(40 - i * 0.25 + (Math.random() - 0.5) * 3).toFixed(1),
    waterLevel:    +(6.0 - i * 0.03 + (Math.random() - 0.5) * 0.2).toFixed(1),
    source:        'SIMULATOR',
    timestamp:     daysAgo(30 - i),
  })),
  'demo-farm-3': Array.from({ length: 30 }, (_, i) => ({
    id: `r3-hist-${i}`,
    farmId: 'demo-farm-3',
    soilEC:        +(3.5 + i * 0.21 + (Math.random() - 0.5) * 0.3).toFixed(2),
    groundwaterEC: +(2.5 + i * 0.16 + (Math.random() - 0.5) * 0.25).toFixed(2),
    tds:           Math.round(1800 + i * 148 + (Math.random() - 0.5) * 200),
    soilPH:        +(7.5 + i * 0.02 + (Math.random() - 0.5) * 0.2).toFixed(1),
    moisture:      +(35 - i * 0.43 + (Math.random() - 0.5) * 3).toFixed(1),
    waterLevel:    +(5.0 - i * 0.06 + (Math.random() - 0.5) * 0.2).toFixed(1),
    source:        'SIMULATOR',
    timestamp:     daysAgo(30 - i),
  })),
}

export const IS_DEMO = true
