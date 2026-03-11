// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockGetAdminDb = vi.hoisted(() => vi.fn())
const mockEmit = vi.hoisted(() => vi.fn())
const mockTo = vi.hoisted(() => vi.fn(() => ({ emit: mockEmit })))
const mockGetIo = vi.hoisted(() => vi.fn(() => ({ to: mockTo })))

vi.mock('../../../../server/utils/firebase-admin', () => ({
  getAdminDb: mockGetAdminDb,
  getAdminAuth: vi.fn(),
}))

vi.mock('../../../../server/plugins/socket.io', () => ({
  getIo: mockGetIo,
}))

import { h3Mocks } from '../_h3'
import scoresGetHandler from '../../../../server/api/games/[gameId]/scores.get'
import scoresPostHandler from '../../../../server/api/games/[gameId]/scores.post'

const AUTH_USER = { uid: 'user-1', email: 'alice@test.com', name: 'Alice' }

function makeEvent(user = AUTH_USER) {
  return { context: { user }, node: { req: {} } }
}
function noAuthEvent() {
  return { context: { user: null }, node: { req: {} } }
}

// ── GET /api/games/:gameId/scores ──────────────────────────────────────────

describe('GET /api/games/:gameId/scores', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    await expect((scoresGetHandler as Function)(noAuthEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when gameId is missing', async () => {
    h3Mocks.getRouterParam.mockReturnValue(undefined as any)
    await expect((scoresGetHandler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns the top 10 scores from Firestore', async () => {
    const scores = [
      { uid: 'u1', score: 9000, level: 5, lines: 100, displayName: 'Alice' },
      { uid: 'u2', score: 7500, level: 4, lines: 80, displayName: 'Bob' },
    ]
    const mockSnap = { docs: scores.map(s => ({ data: () => s })) }
    const mockScoresColl = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(mockSnap),
    }
    const mockGameDoc = { collection: vi.fn().mockReturnValue(mockScoresColl) }
    const mockGamesColl = { doc: vi.fn().mockReturnValue(mockGameDoc) }
    mockGetAdminDb.mockResolvedValue({ collection: vi.fn().mockReturnValue(mockGamesColl) })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    const result = await (scoresGetHandler as Function)(makeEvent())
    expect(result).toHaveLength(2)
    expect(result[0].score).toBe(9000)
    expect(mockScoresColl.orderBy).toHaveBeenCalledWith('score', 'desc')
    expect(mockScoresColl.limit).toHaveBeenCalledWith(10)
  })

  it('returns an empty array when no scores exist', async () => {
    const mockScoresColl = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    }
    const mockGameDoc = { collection: vi.fn().mockReturnValue(mockScoresColl) }
    mockGetAdminDb.mockResolvedValue({ collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockGameDoc) }) })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    expect(await (scoresGetHandler as Function)(makeEvent())).toEqual([])
  })

  it('uses the correct gameId when querying Firestore', async () => {
    const mockDocFn = vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }),
    })
    mockGetAdminDb.mockResolvedValue({ collection: vi.fn().mockReturnValue({ doc: mockDocFn }) })
    h3Mocks.getRouterParam.mockReturnValue('snake')
    await (scoresGetHandler as Function)(makeEvent())
    expect(mockDocFn).toHaveBeenCalledWith('snake')
  })
})

// ── POST /api/games/:gameId/scores ─────────────────────────────────────────

describe('POST /api/games/:gameId/scores', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 5000, level: 3, lines: 50 })
    await expect((scoresPostHandler as Function)(noAuthEvent())).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws 400 when gameId is missing', async () => {
    h3Mocks.getRouterParam.mockReturnValue(undefined as any)
    h3Mocks.readBody.mockResolvedValue({ score: 5000, level: 3, lines: 50 })
    await expect((scoresPostHandler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when score is not a number', async () => {
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }), set: vi.fn() }),
          }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 'not-a-number', level: 1, lines: 10 })
    await expect((scoresPostHandler as Function)(makeEvent())).rejects.toMatchObject({ statusCode: 400 })
  })

  it('saves a new best score and returns { saved: true, newBest: true }', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    const mockScoreRef = { get: vi.fn().mockResolvedValue({ exists: false }), set: mockSet }
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockScoreRef) }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 12000, level: 7, lines: 150, displayName: 'Alice', photoURL: null })
    const result = await (scoresPostHandler as Function)(makeEvent())
    expect(result).toEqual({ saved: true, newBest: true })
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ score: 12000, level: 7, lines: 150, uid: AUTH_USER.uid }),
    )
  })

  it('does not save when existing score is higher', async () => {
    const mockSet = vi.fn()
    const mockScoreRef = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ score: 20000 }) }), set: mockSet }
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockScoreRef) }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 5000, level: 2, lines: 40 })
    expect(await (scoresPostHandler as Function)(makeEvent())).toEqual({ saved: false, newBest: false })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('equal score is NOT a new best', async () => {
    const mockSet = vi.fn()
    const mockScoreRef = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ score: 5000 }) }), set: mockSet }
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockScoreRef) }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 5000, level: 3, lines: 50 })
    expect(await (scoresPostHandler as Function)(makeEvent())).toEqual({ saved: false, newBest: false })
  })

  it('emits a real-time update via Socket.io after saving', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    const mockScoreRef = { get: vi.fn().mockResolvedValue({ exists: false }), set: mockSet }
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockScoreRef) }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 8000, level: 5, lines: 90 })
    await (scoresPostHandler as Function)(makeEvent())
    expect(mockTo).toHaveBeenCalledWith('games-lb-tetris')
    expect(mockEmit).toHaveBeenCalledWith('games:score-update', expect.objectContaining({ gameId: 'tetris' }))
  })

  it('does not emit when score is not a new best', async () => {
    const mockScoreRef = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ score: 99999 }) }), set: vi.fn() }
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockScoreRef) }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 100, level: 1, lines: 5 })
    await (scoresPostHandler as Function)(makeEvent())
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('uses user.name as displayName fallback', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }), set: mockSet }),
          }),
        }),
      }),
    })
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 1000, level: 1, lines: 10, displayName: '', photoURL: null })
    await (scoresPostHandler as Function)(makeEvent())
    expect(mockSet.mock.calls[0][0].displayName).toBe('Alice')
  })

  it('falls back to Anonymous when displayName and name are absent', async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined)
    mockGetAdminDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: false }), set: mockSet }),
          }),
        }),
      }),
    })
    const event = { context: { user: { uid: 'u-anon', email: 'anon@test.com', name: '' } }, node: { req: {} } }
    h3Mocks.getRouterParam.mockReturnValue('tetris')
    h3Mocks.readBody.mockResolvedValue({ score: 500, level: 1, lines: 5, displayName: '' })
    await (scoresPostHandler as Function)(event)
    expect(mockSet.mock.calls[0][0].displayName).toBe('Anonymous')
  })
})