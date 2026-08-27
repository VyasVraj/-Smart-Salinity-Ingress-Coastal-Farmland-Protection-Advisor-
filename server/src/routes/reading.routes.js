/**
 * Reading routes — core data ingestion endpoint
 */

import { processReading } from '../pipeline/readingPipeline.js'
import { readingSchema } from '../validation/schemas.js'

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function readingRoutes(fastify) {
  // POST /api/readings - submit a new salinity reading
  fastify.post('/api/readings', async (req, reply) => {
    const parsed = readingSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: parsed.error.issues,
      })
    }

    try {
      const result = await processReading(parsed.data, fastify.io)
      return reply.code(201).send({
        reading: result.reading,
        riskAssessment: result.riskAssessment,
        message: 'Reading accepted and pipeline triggered',
      })
    } catch (err) {
      fastify.log.error(err)
      return reply.code(err.message.includes('not found') ? 404 : 500).send({
        error: err.message,
      })
    }
  })
}
