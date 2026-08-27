/**
 * Salinity Shield AI — Reading Processing Pipeline
 *
 * Handles the full pipeline:
 * 1. Save reading to DB
 * 2. Fetch historical data
 * 3. Calculate risk
 * 4. Store risk assessment
 * 5. Trigger orchestrator
 * 6. Emit Socket.IO events
 */

import prisma from '../db/client.js'
import { calculateRisk } from '../engine/riskEngine.js'
import { orchestrate } from '../ai/orchestrator.js'

const HISTORY_WINDOW = 10 // number of historical readings to analyze

/**
 * Process a new salinity reading through the full pipeline
 * @param {object} data - validated reading data
 * @param {object} io - Socket.IO server instance
 * @returns {Promise<object>} - { reading, riskAssessment }
 */
export async function processReading(data, io) {
  // 1. Fetch the farm
  const farm = await prisma.farm.findUnique({ where: { id: data.farmId } })
  if (!farm) throw new Error(`Farm not found: ${data.farmId}`)

  // 2. Persist the reading
  const reading = await prisma.salinityReading.create({
    data: {
      farmId: data.farmId,
      soilEC: data.soilEC,
      groundwaterEC: data.groundwaterEC,
      tds: data.tds,
      soilPH: data.soilPH,
      moisture: data.moisture,
      waterLevel: data.waterLevel,
      source: data.source,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    },
  })

  // Emit reading received event
  emitEvent(io, farm.id, 'reading:received', {
    readingId: reading.id,
    farmId: farm.id,
    farmName: farm.farmName,
    soilEC: reading.soilEC,
    groundwaterEC: reading.groundwaterEC,
    source: reading.source,
    timestamp: reading.timestamp,
  })

  // 3. Fetch historical readings (excluding current)
  const history = await prisma.salinityReading.findMany({
    where: {
      farmId: data.farmId,
      id: { not: reading.id },
    },
    orderBy: { timestamp: 'asc' },
    take: HISTORY_WINDOW,
  })

  // 4. Calculate risk deterministically
  const riskResult = calculateRisk(reading, history)
  console.log(`[Pipeline] Risk for ${farm.farmName}: ${riskResult.riskLevel} (${riskResult.riskScore}) | Trend: ${riskResult.trend}`)

  // 5. Store risk assessment
  const riskAssessment = await prisma.riskAssessment.create({
    data: {
      farmId: farm.id,
      readingId: reading.id,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      trend: riskResult.trend,
      trendChangePercent: riskResult.trendChangePercent,
      severity: riskResult.severity,
      reasoningSummary: riskResult.reasoningSummary,
    },
  })

  // Emit risk assessed event
  emitEvent(io, farm.id, 'risk:assessed', {
    farmId: farm.id,
    farmName: farm.farmName,
    riskLevel: riskResult.riskLevel,
    riskScore: riskResult.riskScore,
    trend: riskResult.trend,
    trendChangePercent: riskResult.trendChangePercent,
    reasoningSummary: riskResult.reasoningSummary,
  })

  // 6. Trigger agent orchestration (non-blocking)
  setImmediate(async () => {
    try {
      await orchestrate({
        farm,
        reading,
        riskResult,
        riskAssessmentId: riskAssessment.id,
        history,
        io,
      })
    } catch (err) {
      console.error('[Pipeline] Orchestration error:', err.message)
    }
  })

  return { reading, riskAssessment }
}

function emitEvent(io, farmId, event, data) {
  if (!io) return
  io.to(`farm:${farmId}`).emit(event, data)
  io.emit(event, data)
}
