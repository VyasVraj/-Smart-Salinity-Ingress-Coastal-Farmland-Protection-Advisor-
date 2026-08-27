/**
 * Salinity Shield AI — Agent Orchestrator
 *
 * Coordinates all specialized agents based on risk level and farm context.
 * Stores all agent runs, advisories, and alerts.
 * Emits real-time Socket.IO events after each step.
 */

import prisma from '../db/client.js'
import { selectAgents } from '../engine/riskEngine.js'
import { runMonitoringAgent } from './agents/monitoringAgent.js'
import { runCropAdvisoryAgent } from './agents/cropAdvisoryAgent.js'
import { runIrrigationAgent } from './agents/irrigationAgent.js'
import { runLandReclamationAgent } from './agents/landReclamationAgent.js'
import { runFarmerAlertAgent } from './agents/farmerAlertAgent.js'

const AGENT_MAP = {
  MonitoringAgent: runMonitoringAgent,
  CropAdvisoryAgent: runCropAdvisoryAgent,
  IrrigationAgent: runIrrigationAgent,
  LandReclamationAgent: runLandReclamationAgent,
  FarmerAlertAgent: runFarmerAlertAgent,
}

/**
 * Main orchestrator — called after every new reading is persisted and risk assessed
 * @param {object} params
 * @param {object} params.farm
 * @param {object} params.reading
 * @param {object} params.riskResult
 * @param {string} params.riskAssessmentId
 * @param {Array} params.history
 * @param {object} params.io - Socket.IO server instance
 */
export async function orchestrate({ farm, reading, riskResult, riskAssessmentId, history, io }) {
  if (!riskResult.triggerAgents) {
    console.log(`[Orchestrator] No agents triggered for farm ${farm.id} — LOW risk, STABLE trend`)
    return
  }

  const agentsToRun = selectAgents(riskResult.riskLevel, riskResult.trend)
  console.log(`[Orchestrator] Triggering agents for ${farm.farmName}: ${agentsToRun.join(', ')}`)

  emit(io, farm.id, 'orchestrator:started', {
    farmId: farm.id,
    farmName: farm.farmName,
    riskLevel: riskResult.riskLevel,
    agents: agentsToRun,
  })

  const agentContext = { farm, reading, riskResult, history, riskAssessmentId }

  for (const agentName of agentsToRun) {
    const runner = AGENT_MAP[agentName]
    if (!runner) {
      console.warn(`[Orchestrator] Unknown agent: ${agentName}`)
      continue
    }

    emit(io, farm.id, 'agent:started', { agentName, farmId: farm.id })

    // Create agent run record
    const agentRun = await prisma.agentRun.create({
      data: {
        farmId: farm.id,
        readingId: reading.id,
        agentName,
        triggerReason: `Risk: ${riskResult.riskLevel}, Trend: ${riskResult.trend}`,
        status: 'RUNNING',
        inputSummary: JSON.stringify({
          riskLevel: riskResult.riskLevel,
          trend: riskResult.trend,
          soilEC: reading.soilEC,
          groundwaterEC: reading.groundwaterEC,
        }),
        outputSummary: null,
      },
    })

    try {
      const result = await runner(agentContext)

      // Update agent run with output
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: {
          status: 'COMPLETED',
          outputSummary: JSON.stringify(result.output || result).slice(0, 1000),
        },
      })

      // Store advisory
      const advisory = await prisma.advisory.create({
        data: {
          farmId: farm.id,
          riskAssessmentId,
          type: result.type || agentName.replace('Agent', '').toUpperCase(),
          language: result.language || 'en',
          content: JSON.stringify(result.output || result),
        },
      })

      emit(io, farm.id, 'agent:completed', {
        agentName,
        farmId: farm.id,
        advisoryId: advisory.id,
        type: result.type,
        isDemo: result.isDemo || false,
      })

      // Create alert for HIGH/CRITICAL
      if (agentName === 'FarmerAlertAgent') {
        const alertData = result.output || {}
        await createAlert({
          farmId: farm.id,
          severity: riskResult.riskLevel,
          title: alertData.alertTitle || `${riskResult.riskLevel} Salinity Alert`,
          message: alertData.situationExplained || riskResult.reasoningSummary,
          io,
        })
      }
    } catch (err) {
      console.error(`[Orchestrator] Agent ${agentName} failed:`, err.message)
      await prisma.agentRun.update({
        where: { id: agentRun.id },
        data: { status: 'FAILED', outputSummary: err.message.slice(0, 500) },
      })

      emit(io, farm.id, 'agent:failed', { agentName, farmId: farm.id, error: err.message })
    }
  }

  emit(io, farm.id, 'orchestrator:completed', {
    farmId: farm.id,
    farmName: farm.farmName,
    riskLevel: riskResult.riskLevel,
    agentsRan: agentsToRun,
  })
}

/**
 * Create and persist an alert, then emit via Socket.IO
 */
async function createAlert({ farmId, severity, title, message, io }) {
  try {
    const alert = await prisma.alert.create({
      data: { farmId, severity, title, message, status: 'ACTIVE' },
    })
    emit(io, farmId, 'alert:created', alert)
    return alert
  } catch (err) {
    console.error('[Orchestrator] Failed to create alert:', err.message)
  }
}

/**
 * Emit Socket.IO event to farm room and global room
 */
function emit(io, farmId, event, data) {
  if (!io) return
  io.to(`farm:${farmId}`).emit(event, data)
  io.emit(event, data) // also broadcast globally for dashboard
}
