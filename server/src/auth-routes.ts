import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import {
  clearSessionCookie,
  createSessionToken,
  findSessionUser,
  hashSessionToken,
  readCookie,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  setSessionCookie,
} from './auth.js'

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
})

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
})

type AuthRouterOptions = {
  prisma: PrismaClient
  isProduction: boolean
}

export function createAuthRouter({ prisma, isProduction }: AuthRouterOptions) {
  const router = Router()

  router.post('/register', async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Enter a valid name, email, and password of at least 8 characters.' },
      })
      return
    }

    try {
      const name = parsed.data.name
      const email = parsed.data.email.toLowerCase()
      const passwordHash = await bcrypt.hash(parsed.data.password, 12)
      const token = createSessionToken()

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          sessions: {
            create: {
              tokenHash: hashSessionToken(token),
              expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            },
          },
        },
        select: { id: true, name: true, email: true, createdAt: true },
      })

      setSessionCookie(res, token, isProduction)
      res.status(201).json({ user })
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        res.status(409).json({
          error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists.' },
        })
        return
      }
      next(error)
    }
  })

  router.post('/login', async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Enter a valid email and password.' },
      })
      return
    }

    try {
      const email = parsed.data.email.toLowerCase()
      const userRecord = await prisma.user.findUnique({ where: { email } })
      const passwordMatches = userRecord
        ? await bcrypt.compare(parsed.data.password, userRecord.passwordHash)
        : false

      if (!userRecord || !passwordMatches) {
        res.status(401).json({
          error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
        })
        return
      }

      const token = createSessionToken()
      await prisma.session.create({
        data: {
          userId: userRecord.id,
          tokenHash: hashSessionToken(token),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      })

      setSessionCookie(res, token, isProduction)
      res.status(200).json({
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          createdAt: userRecord.createdAt,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  router.post('/logout', async (req, res, next) => {
    try {
      const token = readCookie(req, SESSION_COOKIE)
      if (token) {
        await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } })
      }
      clearSessionCookie(res, isProduction)
      res.status(200).json({ message: 'Logged out successfully.' })
    } catch (error) {
      next(error)
    }
  })

  router.get('/me', async (req, res, next) => {
    try {
      const token = readCookie(req, SESSION_COOKIE)
      if (!token) {
        res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } })
        return
      }

      const user = await findSessionUser(prisma, token)
      if (!user) {
        clearSessionCookie(res, isProduction)
        res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } })
        return
      }

      res.status(200).json({ user })
    } catch (error) {
      next(error)
    }
  })

  return router
}
