/**
 * Salinity Shield AI - Fastify Server
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server as SocketIOServer } from 'socket.io'
import { spawnSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

import { config } from './config/env.js'
import { farmRoutes } from './routes/farm.routes.js'
import { readingRoutes } from './routes/reading.routes.js'
import { chatRoutes } from './routes/chat.routes.js'
import { analyticsRoutes } from './routes/analytics.routes.js'
import prisma from './db/client.js'
import { isIBMConfigured } from './config/env.js'

// ---- Kill any process already on our port (Windows) ----
;(function ensurePortFree(port) {
  try {
    const r = spawnSync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command',
      `$m = netstat -ano | Select-String ':${port}\\s.*LISTENING'; ` +
      `if ($m) { ($m -split '\\s+')[-1] }`
    ], { encoding: 'utf8', timeout: 5000 })
    const pid = (r.stdout || '').trim()
    if (pid && /^\d+$/.test(pid)) {
      spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' })
      console.log(`  Port ${port} was busy (PID ${pid}) - freed it.`)
      const deadline = Date.now() + 800
      while (Date.now() < deadline) { /* busy-wait */ }
    }
  } catch { /* not on Windows or port already free */ }
})(config.port)

// ---- Fastify instance ----
const fastify = Fastify({
  logger: { level: config.nodeEnv === 'development' ? 'info' : 'warn' },
})

// ---- CORS ----
await fastify.register(cors, {
  origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
})

// ---- Decorate with io placeholder before ready() ----
fastify.decorate('io', null)

// ---- Routes ----
await fastify.register(farmRoutes)
await fastify.register(readingRoutes)
await fastify.register(chatRoutes)
await fastify.register(analyticsRoutes)

fastify.get('/api/health', async () => ({
  status: 'ok',
  time: new Date().toISOString(),
  ibmConfigured: isIBMConfigured(),
  environment: config.nodeEnv,
}))

// ---- Graceful shutdown ----
const shutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, shutting down...`)
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

// ---- Start ----
try {
  // Listen first — this calls ready() internally
  await fastify.listen({ port: config.port, host: '0.0.0.0' })

  // Now attach Socket.IO to the live server
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://localhost:5174'],
      methods: ['GET', 'POST'],
    },
  })

  // Update the decorator value
  fastify.io = io

  io.on('connection', (socket) => {
    fastify.log.info(`[Socket.IO] Client connected: ${socket.id}`)
    socket.on('join:farm', (farmId) => {
      socket.join(`farm:${farmId}`)
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined farm:${farmId}`)
    })
    socket.on('leave:farm', (farmId) => socket.leave(`farm:${farmId}`))
    socket.on('disconnect', () => {
      fastify.log.info(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
  })

  console.log('\nSalinity Shield AI Server')
  console.log(`   Port:        ${config.port}`)
  console.log(`   Environment: ${config.nodeEnv}`)
  console.log(`   IBM Granite: ${isIBMConfigured() ? 'Configured' : 'Not configured (demo mode)'}`)
  console.log(`   API:         http://localhost:${config.port}/api/health`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
