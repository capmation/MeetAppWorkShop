// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockListUsers = vi.hoisted(() => vi.fn())
const mockGetAdminAuth = vi.hoisted(() => vi.fn())
const mockGetAdminDb = vi.hoisted(() => vi.fn())

vi.mock('../../../../server/utils/firebase-admin', () => ({
  getAdminAuth: mockGetAdminAuth,
  getAdminDb: mockGetAdminDb,
}))

import { h3Mocks } from '../_h3'
import usersListHandler from '../../../../server/api/users/index.get'
import usersMeGetHandler from '../../../../server/api/users/me.get'
import usersMePatchHandler from '../../../../server/api/users/me.patch'

function makeEvent(user) {
  return { context: { user: user ?? null }, node: { req: {} } }
}

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAdminAuth.mockResolvedValue({ listUsers: mockListUsers })
  })

  it('returns a mapped list of users', async () => {
    mockListUsers.mockResolvedValue({
      users: [
        { uid: 'u1', displayName: 'Alice', photoURL: 'https://example.com/alice.jpg' },
        { uid: 'u2', displayName: null, email: 'bob@test.com', photoURL: null },
      ],
    })
    const result = await usersListHandler(makeEvent())
    expect(result).toEqual([
      { uid: 'u1', displayName: 'Alice', photoURL: 'https://example.com/alice.jpg' },
      { uid: 'u2', displayName: 'bob@test.com', photoURL: null },
    ])
  })

  it('falls back to email when displayName is absent', async () => {
    mockListUsers.mockResolvedValue({
      users: [{ uid: 'u3', displayName: undefined, email: 'carol@test.com', photoURL: null }],
    })
    const result = await usersListHandler(makeEvent())
    expect(result[0].displayName).toBe('carol@test.com')
  })

  it('falls back to Unknown user when displayName and email are absent', async () => {
    mockListUsers.mockResolvedValue({
      users: [{ uid: 'u4', displayName: undefined, email: undefined, photoURL: null }],
    })
    const result = await usersListHandler(makeEvent())
    expect(result[0].displayName).toBe('Unknown user')
  })

  it('returns an empty array when listUsers throws', async () => {
    mockListUsers.mockRejectedValue(new Error('Firebase error'))
    const result = await usersListHandler(makeEvent())
    expect(result).toEqual([])
  })

  it('returns an empty array for an empty user list', async () => {
    mockListUsers.mockResolvedValue({ users: [] })
    const result = await usersListHandler(makeEvent())
    expect(result).toEqual([])
  })
})

describe('GET /api/users/me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 401 when user is not authenticated', async () => {
    await expect(usersMeGetHandler(makeEvent(null))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('returns default settings when no document exists', async () => {
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }) }),
      }),
    })
    const result = await usersMeGetHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    expect(result).toEqual({ homePage: null, onboardingDone: false })
  })

  it('returns settings from Firestore when document exists', async () => {
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ homePage: '/meet', onboardingDone: true }),
          }),
        }),
      }),
    })
    const result = await usersMeGetHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    expect(result).toEqual({ homePage: '/meet', onboardingDone: true })
  })

  it('handles missing fields in document with defaults', async () => {
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        }),
      }),
    })
    const result = await usersMeGetHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    expect(result).toEqual({ homePage: null, onboardingDone: false })
  })
})

describe('PATCH /api/users/me', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('throws 401 when user is not authenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({})
    await expect(usersMePatchHandler(makeEvent(null))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when no valid fields are provided', async () => {
    h3Mocks.readBody.mockResolvedValue({ unknownField: 'value' })
    await expect(
      usersMePatchHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' })),
    ).rejects.toMatchObject({ statusCode: 400, message: 'No valid fields to update' })
  })

  it('updates homePage when provided', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ set: mockSet }) }),
    })
    h3Mocks.readBody.mockResolvedValue({ homePage: '/calendar' })
    const result = await usersMePatchHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    expect(result).toEqual({ ok: true })
    expect(mockSet).toHaveBeenCalledWith({ homePage: '/calendar' }, { merge: true })
  })

  it('updates onboardingDone when provided', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ set: mockSet }) }),
    })
    h3Mocks.readBody.mockResolvedValue({ onboardingDone: true })
    await usersMePatchHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    expect(mockSet).toHaveBeenCalledWith({ onboardingDone: true }, { merge: true })
  })

  it('filters out disallowed fields silently', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue({ set: mockSet }) }),
    })
    h3Mocks.readBody.mockResolvedValue({ homePage: '/meet', evil: 'injection' })
    await usersMePatchHandler(makeEvent({ uid: 'u1', email: 'a@b.com', name: 'Alice' }))
    const setArg = mockSet.mock.calls[0][0]
    expect(setArg).not.toHaveProperty('evil')
    expect(setArg).toHaveProperty('homePage', '/meet')
  })

  it('uses the authenticated user uid as the document id', async () => {
    const mockDocFn = vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) })
    mockGetAdminDb.mockResolvedValue({ collection: vi.fn().mockReturnValue({ doc: mockDocFn }) })
    h3Mocks.readBody.mockResolvedValue({ onboardingDone: false })
    await usersMePatchHandler(makeEvent({ uid: 'my-uid-999', email: 'a@b.com', name: 'Alice' }))
    expect(mockDocFn).toHaveBeenCalledWith('my-uid-999')
  })
})
