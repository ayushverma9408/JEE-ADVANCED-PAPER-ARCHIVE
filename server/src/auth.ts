import { createHash, randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

export const SESSION_COOKIE = 'jee_archive_session'
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function createSessionToken() {
  return randomBytes(32).toString('hex')
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined

  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    const key = part.slice(0, separator).trim()
    if (key !== name) continue

    try {
      return decodeURIComponent(part.slice(separator + 1).trim())
    } catch {
      return undefined
    }
  }

  return undefined
}

export function setSessionCookie(res: Response, token: string, isProduction: boolean) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
  if (isProduction) attributes.push('Secure')
  res.setHeader('Set-Cookie', attributes.join('; '))
}

export function clearSessionCookie(res: Response, isProduction: boolean) {
  const attributes = [
    `${SESSION_COOKIE}=`,
    'Path=/api/auth',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]
  if (isProduction) attributes.push('Secure')
  res.setHeader('Set-Cookie', attributes.join('; '))
}

export async function findSessionUser(prisma: PrismaClient, token: string) {
  const tokenHash = hashSessionToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
    },
  })

  if (!session) return null
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined)
    return null
  }

  return session.user
}
