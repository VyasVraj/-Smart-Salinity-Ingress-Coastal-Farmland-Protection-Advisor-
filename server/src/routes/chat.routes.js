/**
 * AI chat advisory route
 */

import prisma from '../db/client.js'
import { chatSchema } from '../validation/schemas.js'
import { runChatAdvisor } from '../ai/agents/chatAdvisor.js'

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export async function chatRoutes(fastify) {
  fastify.post('/api/chat', async (req, reply) => {
    const parsed = chatSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Validation failed', details: parsed.error.issues })
    }

    const { farmId, question, language } = parsed.data

    const [farm, latestReading, latestRisk, recentAdvisories] = await Promise.all([
      prisma.farm.findUnique({ where: { id: farmId } }),
      prisma.salinityReading.findFirst({
        where: { farmId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.riskAssessment.findFirst({
        where: { farmId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.advisory.findMany({
        where: { farmId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    if (!farm) return reply.code(404).send({ error: 'Farm not found' })

    const result = await runChatAdvisor({
      question,
      farm,
      latestReading,
      latestRisk,
      recentAdvisories,
      language,
    })

    // Persist chat advisory
    await prisma.advisory.create({
      data: {
        farmId,
        type: 'CHAT',
        language,
        content: JSON.stringify({ question, answer: result.answer, isDemo: result.isDemo }),
      },
    })

    return {
      answer: result.answer,
      isDemo: result.isDemo,
      farm: { id: farm.id, farmName: farm.farmName, district: farm.district },
    }
  })
}
