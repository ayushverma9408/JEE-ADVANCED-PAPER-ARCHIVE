export type AuthUser = {
  id: string
  name: string
  email: string
  createdAt: string
}

type AuthResponse = {
  user: AuthUser
}

type ApiError = {
  error?: {
    message?: string
  }
}

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/auth${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({})) as T & ApiError
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Authentication request failed.')
  }
  return payload
}

export async function getCurrentUser() {
  const response = await authRequest<AuthResponse>('/me')
  return response.user
}

export async function signIn(email: string, password: string) {
  const response = await authRequest<AuthResponse>('/login', { email, password })
  return response.user
}

export async function signUp(name: string, email: string, password: string) {
  const response = await authRequest<AuthResponse>('/register', { name, email, password })
  return response.user
}

export async function signOut() {
  await authRequest<{ message: string }>('/logout', {})
}
