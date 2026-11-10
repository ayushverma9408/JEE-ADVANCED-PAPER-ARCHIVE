import 'dotenv/config'
import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

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
app.use(helmet())
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}))
app.use(express.json({ limit: '1mb' }))

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
