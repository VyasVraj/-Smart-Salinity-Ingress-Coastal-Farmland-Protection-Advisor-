/**
 * Farm routes
 */

import prisma from '../db/client.js'
import { farmSchema } from '../validation/schemas.js'
import { processReading } from '../pipeline/readingPipeline.js'

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function farmRoutes(fastify) {
  // GET /api/farms - list all farms with latest risk
  fastify.get('/api/farms', async (req, reply) => {
    const farms = await prisma.farm.findMany({
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        riskAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        alerts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    return farms
  })

  // GET /api/farms/:id - single farm detail
  fastify.get('/api/farms/:id', async (req, reply) => {
    const farm = await prisma.farm.findUnique({
      where: { id: req.params.id },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        riskAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        advisories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        agentRuns: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    })

    if (!farm) return reply.code(404).send({ error: 'Farm not found' })
    return farm
  })

  // POST /api/farms - create farm (+ optional initial reading for immediate risk calculation)
  fastify.post('/api/farms', async (req, reply) => {
    const parsed = farmSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues })
    }

    // Check for duplicate farm name in the same district
    const existing = await prisma.farm.findFirst({
      where: {
        farmName: { equals: parsed.data.farmName, mode: 'insensitive' },
        district: { equals: parsed.data.district, mode: 'insensitive' },
      },
    })
    if (existing) {
      return reply.code(409).send({
        error: 'A farm with this name already exists in this district.',
        existingId: existing.id,
      })
    }

    // Create the farm
    const farm = await prisma.farm.create({ data: parsed.data })

    // If initial salinity readings are provided, run them through the full pipeline
    const ir = req.body.initialReading
    if (
      ir &&
      typeof ir.soilEC === 'number' &&
      typeof ir.groundwaterEC === 'number' &&
      typeof ir.tds === 'number'
    ) {
      try {
        await processReading(
          {
            farmId: farm.id,
            soilEC: ir.soilEC,
            groundwaterEC: ir.groundwaterEC,
            tds: ir.tds,
            soilPH: typeof ir.soilPH === 'number' ? ir.soilPH : 7.0,
            moisture: typeof ir.moisture === 'number' ? ir.moisture : 40,
            waterLevel: typeof ir.waterLevel === 'number' ? ir.waterLevel : 5,
            source: 'MANUAL',
          },
          fastify.io,
        )
      } catch (pipelineErr) {
        // Non-fatal — farm is created, reading pipeline failed
        fastify.log.warn(`[Farm] Initial reading pipeline error for ${farm.id}: ${pipelineErr.message}`)
      }
    }

    // Return the complete farm object (matching GET /api/farms shape)
    const fullFarm = await prisma.farm.findUnique({
      where: { id: farm.id },
      include: {
        readings: { orderBy: { timestamp: 'desc' }, take: 1 },
        riskAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
        alerts: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
    return reply.code(201).send(fullFarm)
  })

  // PUT /api/farms/:id - update farm
  fastify.put('/api/farms/:id', async (req, reply) => {
    const parsed = farmSchema.partial().safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues })
    }

    const farm = await prisma.farm.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    return farm
  })

  // GET /api/farms/:id/readings - historical readings for charts
  fastify.get('/api/farms/:id/readings', async (req, reply) => {
    const limit = parseInt(req.query.limit || '100', 10)
    const readings = await prisma.salinityReading.findMany({
      where: { farmId: req.params.id },
      orderBy: { timestamp: 'asc' },
      take: limit,
    })
    return readings
  })

  // GET /api/farms/:id/advisories - advisories for farm
  fastify.get('/api/farms/:id/advisories', async (req, reply) => {
    const advisories = await prisma.advisory.findMany({
      where: { farmId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit || '20', 10),
    })
    return advisories
  })

  // GET /api/farms/:id/alerts - alerts for farm
  fastify.get('/api/farms/:id/alerts', async (req, reply) => {
    const alerts = await prisma.alert.findMany({
      where: { farmId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return alerts
  })

  // PUT /api/alerts/:id/resolve - resolve an alert
  fastify.put('/api/alerts/:id/resolve', async (req, reply) => {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    })
    return alert
  })

  // GET /api/farms/:id/agent-runs - agent run history
  fastify.get('/api/farms/:id/agent-runs', async (req, reply) => {
    const runs = await prisma.agentRun.findMany({
      where: { farmId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return runs
  })
}
