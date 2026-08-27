/**
 * Salinity Shield AI — Database Seed
 *
 * Seeds demo farms, historical readings, risk assessments, and alerts.
 * All data is clearly labeled as SAMPLE / SIMULATED DEMO DATA.
 */

import { config } from 'dotenv'
config({ path: new URL('../.env', import.meta.url) })

import { PrismaClient } from '@prisma/client'
import { calculateRisk } from '../src/engine/riskEngine.js'

const prisma = new PrismaClient()

// ---- Demo Farms ----
const demoFarms = [
  {
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
  },
  {
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
  },
  {
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
  },
]

/**
 * Generate readings for a farm with a pattern
 * @param {string} farmId
 * @param {string} pattern - 'stable' | 'worsening' | 'critical'
 * @returns {Array}
 */
function generateReadings(farmId, pattern) {
  const readings = []
  const now = new Date()
  const daysBack = 30

  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    let soilEC, groundwaterEC, tds, soilPH, moisture, waterLevel

    if (pattern === 'stable') {
      // Low risk — stable healthy farm
      soilEC = 1.2 + Math.random() * 0.4
      groundwaterEC = 0.8 + Math.random() * 0.3
      tds = 500 + Math.random() * 200
      soilPH = 6.8 + (Math.random() - 0.5) * 0.4
      moisture = 45 + Math.random() * 10
      waterLevel = 8 + Math.random() * 1

    } else if (pattern === 'worsening') {
      // Gradual worsening — medium to high risk
      const progress = (daysBack - i) / daysBack
      soilEC = 2.0 + progress * 4.5 + (Math.random() - 0.5) * 0.3
      groundwaterEC = 1.5 + progress * 3.5 + (Math.random() - 0.5) * 0.3
      tds = 1000 + progress * 2500 + Math.random() * 200
      soilPH = 7.2 + progress * 0.8 + (Math.random() - 0.5) * 0.2
      moisture = 40 - progress * 10 + Math.random() * 5
      waterLevel = 6 - progress * 1.5 + Math.random() * 0.3

    } else if (pattern === 'critical') {
      // Rapid salinity ingress — high to critical
      const progress = (daysBack - i) / daysBack
      soilEC = 4.0 + progress * 8.0 + (Math.random() - 0.5) * 0.5
      groundwaterEC = 3.0 + progress * 7.0 + (Math.random() - 0.5) * 0.4
      tds = 2000 + progress * 6000 + Math.random() * 300
      soilPH = 7.5 + progress * 1.0 + (Math.random() - 0.5) * 0.3
      moisture = 35 - progress * 15 + Math.random() * 5
      waterLevel = 4 - progress * 1.0 + Math.random() * 0.2
    }

    readings.push({
      farmId,
      soilEC: Math.max(0.1, Math.round(soilEC * 100) / 100),
      groundwaterEC: Math.max(0.1, Math.round(groundwaterEC * 100) / 100),
      tds: Math.max(50, Math.round(tds)),
      soilPH: Math.max(3, Math.min(11, Math.round(soilPH * 10) / 10)),
      moisture: Math.max(5, Math.min(95, Math.round(moisture * 10) / 10)),
      waterLevel: Math.max(0.1, Math.round(waterLevel * 10) / 10),
      source: 'SIMULATOR',
      timestamp: date,
    })
  }

  return readings
}

async function main() {
  console.log('🌱 Seeding Salinity Shield AI database...\n')

  // Clean existing data
  await prisma.advisory.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.riskAssessment.deleteMany()
  await prisma.salinityReading.deleteMany()
  await prisma.farm.deleteMany()
  await prisma.user.deleteMany()

  // Create demo user
  const user = await prisma.user.create({
    data: {
      name: 'Demo Farmer',
      email: 'demo@salinityshield.ai',
      preferredLanguage: 'en',
    },
  })

  console.log('✓ Created demo user')

  // Create farms
  const patterns = ['stable', 'worsening', 'critical']
  const createdFarms = []

  for (let i = 0; i < demoFarms.length; i++) {
    const farm = await prisma.farm.create({
      data: { ...demoFarms[i], userId: user.id },
    })
    createdFarms.push({ farm, pattern: patterns[i] })
    console.log(`✓ Created farm: ${farm.farmName} (${farm.district})`)
  }

  // Seed readings and risk assessments
  for (const { farm, pattern } of createdFarms) {
    const readings = generateReadings(farm.id, pattern)
    console.log(`  Seeding ${readings.length} readings for ${farm.farmName}...`)

    let previousReadings = []

    for (const readingData of readings) {
      const reading = await prisma.salinityReading.create({ data: readingData })

      // Calculate risk for this reading
      const riskResult = calculateRisk(reading, previousReadings)

      await prisma.riskAssessment.create({
        data: {
          farmId: farm.id,
          readingId: reading.id,
          riskLevel: riskResult.riskLevel,
          riskScore: riskResult.riskScore,
          trend: riskResult.trend,
          trendChangePercent: riskResult.trendChangePercent,
          severity: riskResult.severity,
          reasoningSummary: `[SAMPLE DATA] ${riskResult.reasoningSummary}`,
        },
      })

      previousReadings.push(reading)
      if (previousReadings.length > 10) previousReadings.shift()
    }

    // Seed alerts based on pattern
    if (pattern === 'worsening') {
      await prisma.alert.create({
        data: {
          farmId: farm.id,
          severity: 'HIGH',
          title: '[DEMO] High Salinity Alert — Jamnagar B',
          message: '[SAMPLE DATA] Soil EC has increased significantly over the past 2 weeks. Immediate action recommended.',
          status: 'ACTIVE',
        },
      })
    }

    if (pattern === 'critical') {
      await prisma.alert.createMany({
        data: [
          {
            farmId: farm.id,
            severity: 'CRITICAL',
            title: '[DEMO] Critical Salinity Ingress — Kutch C',
            message: '[SAMPLE DATA] Rapid salinity ingress detected. Soil EC exceeds 8 dS/m. Crop failure risk is HIGH.',
            status: 'ACTIVE',
          },
          {
            farmId: farm.id,
            severity: 'HIGH',
            title: '[DEMO] Groundwater Contamination Alert',
            message: '[SAMPLE DATA] Groundwater EC exceeds 6 dS/m. Irrigation with current borewell water not recommended.',
            status: 'ACTIVE',
          },
        ],
      })
    }

    // Seed demo advisories
    if (pattern !== 'stable') {
      await prisma.advisory.create({
        data: {
          farmId: farm.id,
          type: 'MONITORING',
          language: 'en',
          content: JSON.stringify({
            conditionSummary: `[SAMPLE DATA] Farm ${farm.farmName} shows ${pattern === 'critical' ? 'critically elevated' : 'increasing'} salinity levels. Immediate attention required.`,
            keyFindings: [`Soil EC trending upward`, `Groundwater quality deteriorating`, `Crop stress risk elevated`],
            trendInterpretation: `${pattern === 'critical' ? 'Rapid' : 'Gradual'} salinity increase observed over 30-day period.`,
            requiresIntervention: true,
            interventionUrgency: pattern === 'critical' ? 'IMMEDIATE' : 'SOON',
            confidenceNote: '[SAMPLE DATA] Configure IBM watsonx.ai for real AI analysis.',
          }),
        },
      })

      await prisma.advisory.create({
        data: {
          farmId: farm.id,
          type: 'CROP',
          language: 'en',
          content: JSON.stringify({
            currentCropAssessment: `[SAMPLE DATA] ${farm.currentCrop} faces significant salinity stress at current EC levels.`,
            stressRisk: pattern === 'critical' ? 'SEVERE' : 'HIGH',
            recommendations: [
              { crop: 'Barley', suitability: 'HIGH', reason: 'Tolerates up to 8 dS/m', considerations: 'Short season crop', confidence: '[DEMO]' },
              { crop: 'Date Palm', suitability: 'HIGH', reason: 'Excellent salt tolerance', considerations: 'Long-term investment', confidence: '[DEMO]' },
            ],
            immediateActions: ['Stop irrigating with saline water', 'Test alternative water source'],
            disclaimer: '[SAMPLE DATA] Consult local agricultural experts.',
          }),
        },
      })
    }

    console.log(`✓ Seeded readings and data for ${farm.farmName}`)
  }

  console.log('\n✅ Database seeded successfully!')
  console.log('\nDemo Farms:')
  console.log('  🟢 Bhavnagar A — Stable / Low Risk')
  console.log('  🟡 Jamnagar B  — Worsening / High Risk')
  console.log('  🔴 Kutch C     — Critical Salinity Ingress')
  console.log('\n⚠  All seeded data is SAMPLE/DEMO data — not real sensor readings.\n')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
