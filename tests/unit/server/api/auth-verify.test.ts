// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockVerifyIdToken = vi.hoisted(() => vi.fn())

vi.mock('../../../../server/utils/firebase-admin', () => ({
  getAdminAuth: vi.fn(() => Promise.resolve({ verifyIdToken: mockVerifyIdToken })),
  getAdminDb: vi.fn(),
}))

import { h3Mocks } from '../_h3'
import verifyHandler from '../../../../server/api/auth/verify.post'

const handler = verifyHandler as Function

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEvent() {
  return { context: {} as Record<string, unknown>, node: { req: {} } }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 400 when no token is provided in body', async () => {
    h3Mocks.readBody.mockResolvedValue({})
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Token is required',
    })
  })

  it('throws 400 when body is null', async () => {
    h3Mocks.readBody.mockResolvedValue(null)
    await expect(handler(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 401 when Firebase rejects the token', async () => {
    h3Mocks.readBody.mockResolvedValue({ token: 'invalid-jwt' })
    mockVerifyIdToken.mockRejectedValue(new Error('auth/argument-error'))
    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid token',
    })
  })

  it('returns valid=true with uid and email for a good token', async () => {
    h3Mocks.readBody.mockResolvedValue({ token: 'good-jwt' })
    mockVerifyIdToken.mockResolvedValue({ uid: 'u1', email: 'alice@test.com' })
    const result = await handler(makeEvent())
    expect(result).toEqual({ valid: true, uid: 'u1', email: 'alice@test.com' })
  })

  it('passes the token string to verifyIdToken', async () => {
    h3Mocks.readBody.mockResolvedValue({ token: 'my-token-123' })
    mockVerifyIdToken.mockResolvedValue({ uid: 'u2', email: 'bob@test.com' })
    await handler(makeEvent())
    expect(mockVerifyIdToken).toHaveBeenCalledWith('my-token-123')
  })
})
