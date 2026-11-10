import 'dotenv/config'
import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { createAuthRouter } from './auth-routes.js'
import { createAdminRouter } from './admin-routes.js'
import { createExamRouter } from './exam-routes.js'
import { createAnalyticsRouter } from './analytics-routes.js'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
})

const env = envSchema.parse(process.env)
const prisma = new PrismaClient()
const app = express()

app.disable('x-powered-by')
// Render terminates TLS at its edge proxy; trust the single forwarded client hop.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}))
app.use(express.json({ limit: '1mb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication requests. Please try again later.',
    },
  },
})

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many admin requests. Please try again later.',
    },
  },
})

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'jee-archive-api',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health/database', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ status: 'ok', database: 'connected' })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authLimiter, createAuthRouter({
  prisma,
  isProduction: env.NODE_ENV === 'production',
}))
app.use('/api/admin', adminLimiter, createAdminRouter(prisma))
app.use('/api/exams', createExamRouter(prisma))
app.use('/api/analytics', createAnalyticsRouter(prisma))

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } })
})

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (env.NODE_ENV !== 'production') {
    console.error(error)
  }
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  })
}

app.use(errorHandler)

const server = app.listen(env.PORT, () => {
  console.log(`JEE Archive API listening on http://localhost:${env.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
