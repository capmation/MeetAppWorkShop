// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mocks (hoisted before any imports) ────────────────────────────────────────

const mockVerifyIdToken = vi.hoisted(() => vi.fn())

vi.mock('../../../../server/utils/firebase-admin', () => ({
  getAdminAuth: vi.fn(() => Promise.resolve({ verifyIdToken: mockVerifyIdToken })),
  getAdminDb: vi.fn(),
}))

import { h3Mocks } from '../_h3'
import authMiddleware from '../../../../server/middleware/auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent(path: string, method = 'GET', authHeader?: string) {
  h3Mocks.getRequestURL.mockReturnValue(new URL(`http://localhost${path}`))
  h3Mocks.getHeader.mockImplementation((_ev: unknown, name: string) =>
    name === 'authorization' ? authHeader : undefined,
  )
  return { context: {} as Record<string, unknown>, node: { req: { method } } }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Public routes bypass auth ──────────────────────────────────────────────

  it('skips auth for /api/auth/verify', async () => {
    const event = makeEvent('/api/auth/verify', 'POST')
    await expect(authMiddleware(event as any)).resolves.toBeUndefined()
    expect(mockVerifyIdToken).not.toHaveBeenCalled()
  })

  it('skips auth for /api/health', async () => {
    const event = makeEvent('/api/health', 'GET')
    await expect(authMiddleware(event as any)).resolves.toBeUndefined()
    expect(mockVerifyIdToken).not.toHaveBeenCalled()
  })

  it('skips auth for non-API routes', async () => {
    const event = makeEvent('/home', 'GET')
    await expect(authMiddleware(event as any)).resolves.toBeUndefined()
    expect(mockVerifyIdToken).not.toHaveBeenCalled()
  })

  // ── Unauthenticated GET /api/meetings/:id is allowed ──────────────────────

  it('allows unauthenticated GET on a meeting detail route', async () => {
    const event = makeEvent('/api/meetings/abc123', 'GET') // no auth header
    await expect(authMiddleware(event as any)).resolves.toBeUndefined()
    expect(event.context.user).toBeUndefined()
  })

  it('optionally attaches user for authenticated GET on meeting detail', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', name: 'Alice' })
    const event = makeEvent('/api/meetings/abc123', 'GET', 'Bearer valid-token')
    await authMiddleware(event as any)
    expect(event.context.user).toMatchObject({ uid: 'u1', email: 'a@b.com' })
  })

  it('proceeds unauthenticated if token is invalid on public meeting GET', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad token'))
    const event = makeEvent('/api/meetings/abc123', 'GET', 'Bearer bad-token')
    await expect(authMiddleware(event as any)).resolves.toBeUndefined()
    expect(event.context.user).toBeUndefined()
  })

  // ── Protected routes require a valid Bearer token ─────────────────────────

  it('throws 401 when Authorization header is missing on a protected route', async () => {
    const event = makeEvent('/api/projects', 'GET')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when Authorization header does not start with "Bearer "', async () => {
    const event = makeEvent('/api/projects', 'GET', 'Token abc')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 401 when the token is invalid or expired', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('auth/id-token-expired'))
    const event = makeEvent('/api/projects', 'GET', 'Bearer expired-token')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('attaches user context when token is valid', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'u2', email: 'bob@test.com', name: 'Bob' })
    const event = makeEvent('/api/projects', 'GET', 'Bearer valid-token')
    await authMiddleware(event as any)
    expect(event.context.user).toEqual({ uid: 'u2', email: 'bob@test.com', name: 'Bob' })
  })

  it('protects POST /api/meetings', async () => {
    const event = makeEvent('/api/meetings', 'POST')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('protects DELETE /api/meetings/:id', async () => {
    const event = makeEvent('/api/meetings/abc123', 'DELETE')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })

  it('protects /api/time-off endpoints', async () => {
    const event = makeEvent('/api/time-off', 'POST')
    await expect(authMiddleware(event as any)).rejects.toMatchObject({ statusCode: 401 })
  })
})
