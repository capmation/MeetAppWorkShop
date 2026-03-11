// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ── Mocks (use vi.hoisted so they are available inside the mock factory) ──────

const mockGetAdminDb = vi.hoisted(() => vi.fn())


import { h3Mocks } from '../_h3'

vi.mock('../../../../server/utils/firebase-admin', () => ({
  getAdminDb: mockGetAdminDb,
  getAdminAuth: vi.fn(),
}))


import projectsGetHandler from '../../../../server/api/projects/index.get'
import projectsPostHandler from '../../../../server/api/projects/index.post'
import projectDeleteHandler from '../../../../server/api/projects/[id].delete'
import columnsGetHandler from '../../../../server/api/projects/[id]/columns/index.get'
import columnsPostHandler from '../../../../server/api/projects/[id]/columns/index.post'
import columnPatchHandler from '../../../../server/api/projects/[id]/columns/[colId].patch'
import columnDeleteHandler from '../../../../server/api/projects/[id]/columns/[colId].delete'
import cardsGetHandler from '../../../../server/api/projects/[id]/cards/index.get'
import cardsPostHandler from '../../../../server/api/projects/[id]/cards/index.post'
import cardPatchHandler from '../../../../server/api/projects/[id]/cards/[cardId].patch'
import cardDeleteHandler from '../../../../server/api/projects/[id]/cards/[cardId].delete'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUTH_USER = { uid: 'user-1', email: 'alice@test.com', name: 'Alice' }

function makeEvent(user = AUTH_USER) {
  return { context: { user }, node: { req: {} } }
}

function noAuthEvent() {
  return { context: { user: null }, node: { req: {} } }
}

/**
 * Builds a chainable Firestore mock.
 * Supports db.collection().doc().set|get|delete|update and subcollections.
 */
function makeDb(docOverride: Partial<{
  get: () => Promise<unknown>
  set: () => Promise<void>
  delete: () => Promise<void>
  update: () => Promise<void>
}> = {}) {
  const mockDocRef: Record<string, unknown> = {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    delete: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    ...docOverride,
  }
  const mockCollRef: Record<string, unknown> = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
    doc: vi.fn().mockReturnValue(mockDocRef),
  }
  ;(mockDocRef as any).collection = vi.fn().mockReturnValue(mockCollRef)
  const db = { collection: vi.fn().mockReturnValue(mockCollRef) }
  mockGetAdminDb.mockResolvedValue(db)
  return { db, mockDocRef, mockCollRef }
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/projects
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    await expect((projectsGetHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('returns an empty array when the user has no projects', async () => {
    const { mockCollRef } = makeDb()
    ;(mockCollRef as any).get = vi.fn().mockResolvedValue({ docs: [] })
    const result = await (projectsGetHandler as Function)(makeEvent())
    expect(result).toEqual([])
  })

  it('returns projects sorted by createdAt descending', async () => {
    const { mockCollRef } = makeDb()
    const docs = [
      { data: () => ({ id: 'p1', title: 'Alpha', createdAt: '2025-01-01T00:00:00Z' }) },
      { data: () => ({ id: 'p2', title: 'Beta', createdAt: '2025-03-01T00:00:00Z' }) },
      { data: () => ({ id: 'p3', title: 'Gamma', createdAt: '2025-02-01T00:00:00Z' }) },
    ]
    ;(mockCollRef as any).get = vi.fn().mockResolvedValue({ docs })
    const result = await (projectsGetHandler as Function)(makeEvent())
    expect(result[0].id).toBe('p2') // most recent first
    expect(result[1].id).toBe('p3')
    expect(result[2].id).toBe('p1')
  })

  it('filters by the authenticated user uid', async () => {
    const { mockCollRef } = makeDb()
    ;(mockCollRef as any).get = vi.fn().mockResolvedValue({ docs: [] })
    await (projectsGetHandler as Function)(makeEvent())
    expect((mockCollRef as any).where).toHaveBeenCalledWith('hostUid', '==', AUTH_USER.uid)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/projects
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({ title: 'My Project' })
    await expect((projectsPostHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 400 when title is missing', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({})
    await expect((projectsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when title is empty string', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: '   ' })
    await expect((projectsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when title exceeds 80 characters', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: 'x'.repeat(81) })
    await expect((projectsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('creates the project and returns it', async () => {
    const { mockDocRef } = makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: 'Sprint Board', description: 'Q3', color: 'blue' })
    const result = await (projectsPostHandler as Function)(makeEvent())
    expect(result.title).toBe('Sprint Board')
    expect(result.description).toBe('Q3')
    expect(result.color).toBe('blue')
    expect(result.hostUid).toBe(AUTH_USER.uid)
    expect(result.hostName).toBe('Alice')
    expect(result.id).toBeTruthy()
    expect((mockDocRef as any).set).toHaveBeenCalled()
  })

  it('creates exactly 3 default columns (To Do, In Progress, Done)', async () => {
    const subDocSet = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { set: subDocSet }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = {
      set: vi.fn().mockResolvedValue(undefined),
      collection: vi.fn().mockReturnValue(subCollRef),
    }
    const mainCollRef = { doc: vi.fn().mockReturnValue(mainDocRef) }
    const db = { collection: vi.fn().mockReturnValue(mainCollRef) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Board' })
    await (projectsPostHandler as Function)(makeEvent())

    expect(subDocSet).toHaveBeenCalledTimes(3)
    const titles = subDocSet.mock.calls.map((c: any[]) => c[0].title)
    expect(titles).toContain('To Do')
    expect(titles).toContain('In Progress')
    expect(titles).toContain('Done')
  })

  it('defaults color to "accent" when not provided', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: 'No Color' })
    const result = await (projectsPostHandler as Function)(makeEvent())
    expect(result.color).toBe('accent')
  })

  it('trims whitespace from the title', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: '  My Board  ' })
    const result = await (projectsPostHandler as Function)(makeEvent())
    expect(result.title).toBe('My Board')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/projects/:id
// ══════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/projects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((projectDeleteHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 404 when project does not exist', async () => {
    const { mockDocRef } = makeDb()
    ;(mockDocRef as any).get = vi.fn().mockResolvedValue({ exists: false })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((projectDeleteHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('throws 403 when user is not the owner', async () => {
    const { mockDocRef } = makeDb()
    ;(mockDocRef as any).get = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ hostUid: 'other-user' }),
    })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((projectDeleteHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('deletes the project and returns { ok: true }', async () => {
    const { mockDocRef } = makeDb()
    ;(mockDocRef as any).get = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ hostUid: AUTH_USER.uid }),
    })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (projectDeleteHandler as Function)(makeEvent())
    expect(result).toEqual({ ok: true })
    expect((mockDocRef as any).delete).toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/projects/:id/columns
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/projects/:id/columns', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((columnsGetHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('returns columns in order', async () => {
    const { mockDocRef } = makeDb()
    const subSnap = {
      docs: [
        { data: () => ({ id: 'col-1', title: 'To Do', order: 1000 }) },
        { data: () => ({ id: 'col-2', title: 'In Progress', order: 2000 }) },
      ],
    }
    ;(mockDocRef as any).collection = vi.fn().mockReturnValue({
      orderBy: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(subSnap),
    })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (columnsGetHandler as Function)(makeEvent())
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('To Do')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/projects/:id/columns
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/projects/:id/columns', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({ title: 'New Col' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((columnsPostHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 400 when title is missing', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({})
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((columnsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('creates column with order = maxOrder + 1000', async () => {
    const subDocSet = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { set: subDocSet }
    const subCollRef = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ order: 3000 }) }],
      }),
      doc: vi.fn().mockReturnValue(subDocRef),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Review' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (columnsPostHandler as Function)(makeEvent())
    expect(result.order).toBe(4000)
    expect(result.title).toBe('Review')
  })

  it('starts order at 1000 when there are no existing columns', async () => {
    const subDocSet = vi.fn().mockResolvedValue(undefined)
    const subCollRef = {
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      doc: vi.fn().mockReturnValue({ set: subDocSet }),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'First' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (columnsPostHandler as Function)(makeEvent())
    expect(result.order).toBe(1000)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/projects/:id/columns/:colId
// ══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/projects/:id/columns/:colId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({ title: 'New Title' })
    h3Mocks.getRouterParam.mockReturnValue('id-x')
    await expect((columnPatchHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('updates title and returns { ok: true }', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { update: mockUpdate }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Done ✓' })
    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('col-1')
    const result = await (columnPatchHandler as Function)(makeEvent())
    expect(result).toEqual({ ok: true })
    expect(mockUpdate).toHaveBeenCalledWith({ title: 'Done ✓' })
  })

  it('updates order when provided', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { update: mockUpdate }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ order: 5000 })
    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('col-1')
    await (columnPatchHandler as Function)(makeEvent())
    expect(mockUpdate).toHaveBeenCalledWith({ order: 5000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/projects/:id/columns/:colId
// ══════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/projects/:id/columns/:colId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('id-x')
    await expect((columnDeleteHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('deletes the column and all its cards, returning { ok: true }', async () => {
    const colDocDelete = vi.fn().mockResolvedValue(undefined)
    const cardRefDelete = vi.fn().mockResolvedValue(undefined)

    const cardsSnap = {
      docs: [
        { ref: { delete: cardRefDelete } },
        { ref: { delete: cardRefDelete } },
      ],
    }

    const cardsCollRef = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(cardsSnap),
    }

    const columnsCollRef = {
      doc: vi.fn().mockReturnValue({ delete: colDocDelete }),
    }

    const mainDocRef = {
      collection: vi.fn().mockImplementation((name: string) => {
        if (name === 'columns') return columnsCollRef
        if (name === 'cards') return cardsCollRef
        return {}
      }),
    }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('col-1')
    const result = await (columnDeleteHandler as Function)(makeEvent())

    expect(result).toEqual({ ok: true })
    expect(colDocDelete).toHaveBeenCalled()
    expect(cardRefDelete).toHaveBeenCalledTimes(2)
  })

  it('succeeds even when no cards exist in the column', async () => {
    const colDocDelete = vi.fn().mockResolvedValue(undefined)
    const cardsCollRef = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    }
    const mainDocRef = {
      collection: vi.fn().mockImplementation((name: string) => {
        if (name === 'columns') return { doc: vi.fn().mockReturnValue({ delete: colDocDelete }) }
        return cardsCollRef
      }),
    }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('col-1')
    await expect((columnDeleteHandler as Function)(makeEvent())).resolves.toEqual({ ok: true })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/projects/:id/cards
// ══════════════════════════════════════════════════════════════════════════════

describe('GET /api/projects/:id/cards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((cardsGetHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('returns cards ordered by order asc', async () => {
    const subSnap = {
      docs: [
        { data: () => ({ id: 'card-1', title: 'Fix bug', order: 1000 }) },
        { data: () => ({ id: 'card-2', title: 'Write tests', order: 2000 }) },
      ],
    }
    const subCollRef = {
      orderBy: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(subSnap),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (cardsGetHandler as Function)(makeEvent())
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('card-1')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/projects/:id/cards
// ══════════════════════════════════════════════════════════════════════════════

describe('POST /api/projects/:id/cards', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({ title: 'Task', columnId: 'col-1' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((cardsPostHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('throws 400 when title is missing', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ columnId: 'col-1' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((cardsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'Title required',
    })
  })

  it('throws 400 when columnId is missing', async () => {
    makeDb()
    h3Mocks.readBody.mockResolvedValue({ title: 'Task' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    await expect((cardsPostHandler as Function)(makeEvent())).rejects.toMatchObject({
      statusCode: 400,
      message: 'columnId required',
    })
  })

  it('creates the card with auto-order = maxOrder + 1000', async () => {
    const cardDocSet = vi.fn().mockResolvedValue(undefined)
    const cardsCollRef = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: false,
        docs: [{ data: () => ({ order: 2000 }) }],
      }),
      doc: vi.fn().mockReturnValue({ set: cardDocSet }),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(cardsCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'New Task', columnId: 'col-1' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (cardsPostHandler as Function)(makeEvent())
    expect(result.order).toBe(3000)
    expect(result.title).toBe('New Task')
    expect(result.columnId).toBe('col-1')
  })

  it('uses explicit order when provided in body', async () => {
    const cardDocSet = vi.fn().mockResolvedValue(undefined)
    const cardsCollRef = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      doc: vi.fn().mockReturnValue({ set: cardDocSet }),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(cardsCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Explicit', columnId: 'col-1', order: 9999 })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (cardsPostHandler as Function)(makeEvent())
    expect(result.order).toBe(9999)
  })

  it('defaults color to "slate" when not provided', async () => {
    const cardsCollRef = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
      doc: vi.fn().mockReturnValue({ set: vi.fn().mockResolvedValue(undefined) }),
    }
    const mainDocRef = { collection: vi.fn().mockReturnValue(cardsCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Card', columnId: 'col-1' })
    h3Mocks.getRouterParam.mockReturnValue('proj-1')
    const result = await (cardsPostHandler as Function)(makeEvent())
    expect(result.color).toBe('slate')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/projects/:id/cards/:cardId
// ══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/projects/:id/cards/:cardId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.readBody.mockResolvedValue({ title: 'Updated' })
    h3Mocks.getRouterParam.mockReturnValue('x')
    await expect((cardPatchHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('updates only provided fields', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { update: mockUpdate }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: 'Fixed title', color: 'red' })
    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('card-1')
    const result = await (cardPatchHandler as Function)(makeEvent())
    expect(result).toEqual({ ok: true })
    expect(mockUpdate).toHaveBeenCalledWith({ title: 'Fixed title', color: 'red' })
  })

  it('can move a card to a different column', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { update: mockUpdate }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ columnId: 'col-done', order: 500 })
    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('card-1')
    await (cardPatchHandler as Function)(makeEvent())
    expect(mockUpdate).toHaveBeenCalledWith({ columnId: 'col-done', order: 500 })
  })

  it('trims title when patching', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { update: mockUpdate }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.readBody.mockResolvedValue({ title: '  trimmed  ' })
    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('card-1')
    await (cardPatchHandler as Function)(makeEvent())
    expect(mockUpdate).toHaveBeenCalledWith({ title: 'trimmed' })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/projects/:id/cards/:cardId
// ══════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/projects/:id/cards/:cardId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when unauthenticated', async () => {
    h3Mocks.getRouterParam.mockReturnValue('x')
    await expect((cardDeleteHandler as Function)(noAuthEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('deletes the card and returns { ok: true }', async () => {
    const cardDelete = vi.fn().mockResolvedValue(undefined)
    const subDocRef = { delete: cardDelete }
    const subCollRef = { doc: vi.fn().mockReturnValue(subDocRef) }
    const mainDocRef = { collection: vi.fn().mockReturnValue(subCollRef) }
    const db = { collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mainDocRef) }) }
    mockGetAdminDb.mockResolvedValue(db)

    h3Mocks.getRouterParam
      .mockReturnValueOnce('proj-1')
      .mockReturnValueOnce('card-1')
    const result = await (cardDeleteHandler as Function)(makeEvent())
    expect(result).toEqual({ ok: true })
    expect(cardDelete).toHaveBeenCalled()
  })
})
