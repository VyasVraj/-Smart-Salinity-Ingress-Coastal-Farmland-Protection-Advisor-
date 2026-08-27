/**
 * Salinity Shield AI — Advanced Analytics Routes
 *
 * GET /api/farms/:id/risk/explanation
 * GET /api/farms/:id/forecast
 * GET /api/farms/:id/decision-trace
 * POST /api/farms/:id/what-if
 * GET /api/map/risk
 */

import prisma from '../db/client.js'
import { computeForecast } from '../engine/forecastEngine.js'
import { runScenario, SCENARIOS } from '../engine/whatIfEngine.js'
import { explainRisk } from '../engine/riskExplainer.js'
import { callGranite } from '../ai/graniteService.js'
import { isIBMConfigured } from '../config/env.js'

export async function analyticsRoutes(fastify) {

  // ── GET /api/farms/:id/risk/explanation ───────────────────────────────────
  fastify.get('/api/farms/:id/risk/explanation', async (req, reply) => {
    const { id } = req.params

    const [farm, latestRisk, readings] = await Promise.all([
      prisma.farm.findUnique({ where: { id } }),
      prisma.riskAssessment.findFirst({ where: { farmId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.salinityReading.findMany({
        where: { farmId: id },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ])

    if (!farm)      return reply.code(404).send({ error: 'Farm not found' })
    if (!latestRisk) return reply.code(404).send({ error: 'No risk assessments yet' })

    const latestReading = readings[0]
    if (!latestReading) return reply.code(404).send({ error: 'No readings yet' })

    const history = readings.slice(1).reverse()
    const explanation = explainRisk(latestReading, history, latestRisk)

    // Optionally get a Granite explanation
    let graniteExplanation = null
    if (isIBMConfigured()) {
      const prompt = `<|system|>You are a concise agricultural risk analyst. In 2-3 sentences, explain to a farmer why their risk score is ${latestRisk.riskScore}/100 (${latestRisk.riskLevel}). Use the data provided. Be clear and farmer-friendly.<|user|>Soil EC: ${latestReading.soilEC} dS/m, Groundwater EC: ${latestReading.groundwaterEC} dS/m, TDS: ${latestReading.tds} ppm, Trend: ${latestRisk.trend}, Change: ${latestRisk.trendChangePercent}%<|assistant|>`
      const r = await callGranite(prompt, { params: { max_new_tokens: 150, temperature: 0.4 } })
      if (r.success) graniteExplanation = r.raw
    }

    return { ...explanation, graniteExplanation, farm: { id: farm.id, farmName: farm.farmName, district: farm.district } }
  })

  // ── GET /api/farms/:id/forecast ────────────────────────────────────────────
  fastify.get('/api/farms/:id/forecast', async (req, reply) => {
    const { id } = req.params

    const [farm, readings] = await Promise.all([
      prisma.farm.findUnique({ where: { id } }),
      prisma.salinityReading.findMany({
        where: { farmId: id },
        orderBy: { timestamp: 'asc' },
      }),
    ])

    if (!farm) return reply.code(404).send({ error: 'Farm not found' })

    const forecast = computeForecast(readings)
    return { farmId: id, farmName: farm.farmName, district: farm.district, ...forecast }
  })

  // ── GET /api/farms/:id/decision-trace ─────────────────────────────────────
  fastify.get('/api/farms/:id/decision-trace', async (req, reply) => {
    const { id } = req.params
    const limit = Math.min(parseInt(req.query.limit || '50'), 100)
    const readingId = req.query.readingId // optional: filter by specific reading

    const farm = await prisma.farm.findUnique({ where: { id } })
    if (!farm) return reply.code(404).send({ error: 'Farm not found' })

    const where = { farmId: id }
    if (readingId) where.readingId = readingId

    const [agentRuns, riskAssessments, readings] = await Promise.all([
      prisma.agentRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.riskAssessment.findMany({
        where: { farmId: id, ...(readingId ? { readingId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: readingId ? 1 : 10,
      }),
      prisma.salinityReading.findMany({
        where: { farmId: id, ...(readingId ? { id: readingId } : {}) },
        orderBy: { timestamp: 'desc' },
        take: readingId ? 1 : 10,
      }),
    ])

    // Build unified timeline events
    const events = []

    // Reading events
    for (const r of readings) {
      events.push({
        id: `reading-${r.id}`,
        type: 'READING',
        agent: 'Sensor / Data Input',
        timestamp: r.timestamp,
        status: 'COMPLETED',
        trigger: `New ${r.source} reading submitted`,
        summary: `Soil EC: ${r.soilEC} dS/m | GW EC: ${r.groundwaterEC} dS/m | TDS: ${r.tds} ppm`,
        readingId: r.id,
        detail: {
          soilEC: r.soilEC,
          groundwaterEC: r.groundwaterEC,
          tds: r.tds,
          soilPH: r.soilPH,
          source: r.source,
        },
      })
    }

    // Risk assessment events
    for (const ra of riskAssessments) {
      events.push({
        id: `risk-${ra.id}`,
        type: 'RISK_ASSESSMENT',
        agent: 'Risk Engine',
        timestamp: ra.createdAt,
        status: 'COMPLETED',
        trigger: `Reading submitted for farm ${farm.farmName}`,
        summary: `Risk: ${ra.riskLevel} (${ra.riskScore}/100) | Trend: ${ra.trend} (${ra.trendChangePercent}%)`,
        readingId: ra.readingId,
        detail: {
          riskLevel: ra.riskLevel,
          riskScore: ra.riskScore,
          trend: ra.trend,
          trendChangePercent: ra.trendChangePercent,
          reasoningSummary: ra.reasoningSummary,
        },
      })
    }

    // Agent run events
    for (const run of agentRuns) {
      let inputData = {}
      let outputData = {}
      try { inputData  = JSON.parse(run.inputSummary  || '{}') } catch {}
      try { outputData = JSON.parse(run.outputSummary || '{}') } catch {}

      events.push({
        id: `agent-${run.id}`,
        type: 'AGENT_RUN',
        agent: run.agentName,
        timestamp: run.createdAt,
        status: run.status,
        trigger: run.triggerReason,
        summary: run.outputSummary
          ? (typeof outputData === 'object'
            ? outputData.conditionSummary || outputData.currentCropAssessment || outputData.alertTitle || run.outputSummary.slice(0, 120)
            : run.outputSummary.slice(0, 120))
          : run.status === 'RUNNING' ? 'Agent is running...' : 'No output recorded.',
        readingId: run.readingId,
        detail: {
          inputSummary: inputData,
          // Do not expose full outputSummary (may contain internal prompt data) — just key fields
          status: run.status,
          agentName: run.agentName,
        },
      })
    }

    // Sort all events by timestamp ascending
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    return {
      farmId: id,
      farmName: farm.farmName,
      events,
      total: events.length,
    }
  })

  // ── POST /api/farms/:id/what-if ────────────────────────────────────────────
  fastify.post('/api/farms/:id/what-if', async (req, reply) => {
    const { id } = req.params
    const { scenario: scenarioId, language = 'en' } = req.body || {}

    if (!scenarioId || !SCENARIOS[scenarioId]) {
      return reply.code(400).send({
        error: 'Invalid scenario',
        validScenarios: Object.keys(SCENARIOS),
      })
    }

    const [farm, latestReading, latestRisk] = await Promise.all([
      prisma.farm.findUnique({ where: { id } }),
      prisma.salinityReading.findFirst({ where: { farmId: id }, orderBy: { timestamp: 'desc' } }),
      prisma.riskAssessment.findFirst({ where: { farmId: id }, orderBy: { createdAt: 'desc' } }),
    ])

    if (!farm) return reply.code(404).send({ error: 'Farm not found' })

    const result = runScenario(farm, latestReading, latestRisk, scenarioId)
    if (result.error) return reply.code(422).send(result)

    // Get Granite explanation
    let graniteExplanation = null
    const scenario = SCENARIOS[scenarioId]

    if (isIBMConfigured()) {
      const langInstruction = language !== 'en' ? `Respond in ${language === 'hi' ? 'Hindi' : 'Gujarati'}.` : ''
      const prompt = `<|system|>You are an agricultural advisor. Explain in 3-4 sentences why the scenario "${scenario.label}" could help this farm. Be practical, farmer-friendly, and honest about uncertainty. ${langInstruction}<|user|>Farm: ${farm.farmName} (${farm.district}). Crop: ${farm.currentCrop}. Current risk: ${result.current.riskLevel} (${result.current.riskScore}/100). Simulated risk after "${scenario.label}": ${result.simulated.riskLevel} (${result.simulated.riskScore}/100). Risk reduction: ${result.delta.riskScore} points. Scenario: ${scenario.description}<|assistant|>`
      const r = await callGranite(prompt, { params: { max_new_tokens: 200, temperature: 0.5 } })
      if (r.success) graniteExplanation = r.raw
    }

    if (!graniteExplanation) {
      const langMap = {
        en: `The scenario "${scenario.label}" could reduce modeled risk from ${result.current.riskLevel} to ${result.simulated.riskLevel} based on simulated assumptions. ${scenario.description} This is a model estimate — validate with field measurements and consult local agricultural experts.`,
        hi: `"${scenario.label}" परिदृश्य के तहत, अनुमानित जोखिम ${result.current.riskLevel} से ${result.simulated.riskLevel} तक कम हो सकता है। ${scenario.description} यह एक मॉडल अनुमान है।`,
        gu: `"${scenario.label}" પરિસ્થિતિ હેઠળ, અનુમાનિત જોખમ ${result.current.riskLevel}થી ${result.simulated.riskLevel} સુધી ઘટી શકે છે। ${scenario.description} આ એક મોડેલ અંદાજ છે।`,
      }
      graniteExplanation = langMap[language] || langMap.en
    }

    return { ...result, graniteExplanation, scenarios: Object.values(SCENARIOS).map(s => ({ id: s.id, label: s.label, description: s.description })) }
  })

  // ── GET /api/what-if/scenarios ─────────────────────────────────────────────
  fastify.get('/api/what-if/scenarios', async () => ({
    scenarios: Object.values(SCENARIOS).map(s => ({
      id: s.id, label: s.label, description: s.description, timeframeWeeks: s.timeframeWeeks,
    })),
  }))

  // ── GET /api/map/risk ──────────────────────────────────────────────────────
  fastify.get('/api/map/risk', async () => {
    const farms = await prisma.farm.findMany({
      include: {
        riskAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
        readings:        { orderBy: { timestamp:  'desc' }, take: 1 },
        alerts:          { where: { status: 'ACTIVE' } },
      },
    })

    const features = farms.map(f => {
      const risk    = f.riskAssessments[0]
      const reading = f.readings[0]
      return {
        id:           f.id,
        farmName:     f.farmName,
        farmerName:   f.farmerName,
        district:     f.district,
        latitude:     f.latitude,
        longitude:    f.longitude,
        currentCrop:  f.currentCrop,
        landArea:     f.landArea,
        riskLevel:    risk?.riskLevel    ?? 'UNKNOWN',
        riskScore:    risk?.riskScore    ?? null,
        trend:        risk?.trend        ?? null,
        soilEC:       reading?.soilEC        ?? null,
        groundwaterEC: reading?.groundwaterEC ?? null,
        tds:          reading?.tds           ?? null,
        activeAlerts: f.alerts.length,
        lastUpdated:  reading?.timestamp     ?? null,
      }
    })

    // Regional summary
    const byDistrict = {}
    for (const f of features) {
      if (!byDistrict[f.district]) byDistrict[f.district] = { district: f.district, total: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UNKNOWN: 0 }
      byDistrict[f.district].total++
      byDistrict[f.district][f.riskLevel] = (byDistrict[f.district][f.riskLevel] || 0) + 1
    }

    return { features, regionalSummary: Object.values(byDistrict) }
  })
}
