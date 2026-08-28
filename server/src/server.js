/**
 * Salinity Shield AI - Fastify Server
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server as SocketIOServer } from 'socket.io'
import { spawnSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

import { config, isIBMConfigured, logIBMDiagnostics } from './config/env.js'
import { farmRoutes } from './routes/farm.routes.js'
import { readingRoutes } from './routes/reading.routes.js'
import { chatRoutes } from './routes/chat.routes.js'
import { analyticsRoutes } from './routes/analytics.routes.js'
import prisma from './db/client.js'

// ---- Kill any process already on our port (Windows) ----
;(function ensurePortFree(port) {
  try {
    // Use netstat + findstr which is more reliable than PowerShell Select-String
    const r = spawnSync('cmd', [
      '/c',
      `netstat -ano | findstr /R ":${port}[^0-9].*LISTENING"`
    ], { encoding: 'utf8', timeout: 5000 })

    const lines = (r.stdout || '').trim().split('\n').filter(Boolean)
    const pids = new Set()
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid)
    }

    for (const pid of pids) {
      spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' })
      console.log(`  Port ${port} was busy (PID ${pid}) - freed it.`)
    }

    if (pids.size > 0) {
      // Wait for OS to release the port
      const deadline = Date.now() + 1200
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

fastify.get('/api/ai/health', async () => ({
  configured: isIBMConfigured(),
  provider: 'IBM watsonx.ai',
  model: config.ibm.modelId,
  projectConfigured: !!config.ibm.projectId,
  apiKeyConfigured: !!config.ibm.apiKey,
  url: config.ibm.aiUrl,
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
async function startListening(retries = 1) {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' })
  } catch (err) {
    if (err.code === 'EADDRINUSE' && retries > 0) {
      console.log(`  Port ${config.port} still busy — killing and retrying...`)
      spawnSync('cmd', ['/c', `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${config.port}') do taskkill /PID %a /F`], { stdio: 'ignore', shell: false })
      await new Promise(r => setTimeout(r, 1500))
      return startListening(retries - 1)
    }
    throw err
  }
}

try {
  await startListening()

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
  console.log(`   IBM Granite: ${isIBMConfigured() ? '✓ Configured' : '✗ Not configured (demo mode)'}`)
  console.log(`   API:         http://localhost:${config.port}/api/health`)
  console.log(`   AI Health:   http://localhost:${config.port}/api/ai/health`)
  logIBMDiagnostics()
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
