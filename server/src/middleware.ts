import type { NextFunction, Request, Response } from 'express'
import type { PrismaClient, UserRole } from '@prisma/client'
import { findSessionUser, readCookie, SESSION_COOKIE } from './auth.js'

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
}

export function requireAuth(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = readCookie(req, SESSION_COOKIE)
      if (!token) {
        res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } })
        return
      }

      const user = await findSessionUser(prisma, token)
      if (!user) {
        res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Your session is invalid or has expired.' } })
        return
      }

      res.locals.user = user satisfies AuthenticatedUser
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user as AuthenticatedUser | undefined
  if (!user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } })
    return
  }
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } })
    return
  }
  next()
}
