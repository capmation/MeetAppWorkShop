// @vitest-environment happy-dom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock h3 so createError (Nitro auto-import) is available
vi.mock('h3', async () => {
  const actual = await vi.importActual<typeof import('h3')>('h3')
  return { ...actual }
})

import {
  assertDate,
  normalizeDate,
  getMonthKey,
  getBusinessDates,
  isShortNotice,
  createCalendarEventsForRequest,
  deleteCalendarEvents,
} from '../../../../server/utils/timeoff'
import type { TimeOffRequest } from '../../../../app/types/timeoff.types'

// ─── assertDate ────────────────────────────────────────────────────────────────

describe('assertDate', () => {
  it('does not throw for a valid ISO date string', () => {
    expect(() => assertDate('2025-06-15', 'startDate')).not.toThrow()
  })

  it('does not throw for a date-time string', () => {
    expect(() => assertDate('2025-06-15T10:30:00.000Z', 'startDate')).not.toThrow()
  })

  it('throws 400 for an invalid date string', () => {
    expect(() => assertDate('not-a-date', 'startDate')).toThrow('startDate is invalid')
  })

  it('throws 400 for an empty string', () => {
    expect(() => assertDate('', 'endDate')).toThrow('endDate is invalid')
  })

  it('throws 400 for a numeric string that is not a date', () => {
    expect(() => assertDate('99999999999999999999', 'myDate')).toThrow('myDate is invalid')
  })
})

// ─── normalizeDate ─────────────────────────────────────────────────────────────

describe('normalizeDate', () => {
  it('returns a YYYY-MM-DD string from an ISO date', () => {
    expect(normalizeDate('2025-06-15')).toBe('2025-06-15')
  })

  it('strips the time portion from a datetime string', () => {
    expect(normalizeDate('2025-06-15T23:59:59.999Z')).toBe('2025-06-15')
  })

  it('throws for an invalid input (delegates to assertDate)', () => {
    expect(() => normalizeDate('bad')).toThrow()
  })
})

// ─── getMonthKey ───────────────────────────────────────────────────────────────

describe('getMonthKey', () => {
  it('returns YYYY-MM from a date string', () => {
    expect(getMonthKey('2025-06-15')).toBe('2025-06')
  })

  it('returns YYYY-MM from a datetime string', () => {
    expect(getMonthKey('2025-12-01T00:00:00Z')).toBe('2025-12')
  })
})

// ─── getBusinessDates ─────────────────────────────────────────────────────────

describe('getBusinessDates', () => {
  it('returns a single Monday', () => {
    // 2025-06-16 is a Monday
    const result = getBusinessDates('2025-06-16', '2025-06-16')
    expect(result).toEqual(['2025-06-16'])
  })

  it('excludes Saturday and Sunday from a full week', () => {
    // Mon 2025-06-16 … Sun 2025-06-22
    const result = getBusinessDates('2025-06-16', '2025-06-22')
    expect(result).toHaveLength(5)
    expect(result).not.toContain('2025-06-21') // Saturday
    expect(result).not.toContain('2025-06-22') // Sunday
  })

  it('returns an empty array when the range is entirely a weekend', () => {
    // 2025-06-21 (Sat) … 2025-06-22 (Sun)
    const result = getBusinessDates('2025-06-21', '2025-06-22')
    expect(result).toEqual([])
  })

  it('throws 400 when startDate is after endDate', () => {
    expect(() => getBusinessDates('2025-06-20', '2025-06-10')).toThrow(
      'startDate must be before endDate',
    )
  })

  it('handles a multi-week range correctly', () => {
    // Two full work weeks: Mon 2025-06-16 … Fri 2025-06-27
    const result = getBusinessDates('2025-06-16', '2025-06-27')
    expect(result).toHaveLength(10)
  })

  it('returns dates in ascending order', () => {
    const result = getBusinessDates('2025-06-16', '2025-06-20')
    const sorted = [...result].sort()
    expect(result).toEqual(sorted)
  })
})

// ─── isShortNotice ────────────────────────────────────────────────────────────

describe('isShortNotice', () => {
  beforeEach(() => {
    // Pin "today" to 2025-06-01
    vi.setSystemTime(new Date('2025-06-01'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true when start date is fewer than 15 days away', () => {
    expect(isShortNotice('2025-06-10')).toBe(true) // 9 days away
  })

  it('returns true when start date is today', () => {
    expect(isShortNotice('2025-06-01')).toBe(true)
  })

  it('returns false when start date is exactly 15 days away', () => {
    expect(isShortNotice('2025-06-16')).toBe(false) // 15 days away — NOT short notice
  })

  it('returns false when start date is well in advance', () => {
    expect(isShortNotice('2025-07-01')).toBe(false) // 30 days away
  })

  it('respects a custom threshold', () => {
    expect(isShortNotice('2025-06-06', 10)).toBe(true) // 5 days away, threshold=10
    expect(isShortNotice('2025-06-12', 10)).toBe(false) // 11 days away, threshold=10
  })
})

// ─── createCalendarEventsForRequest ───────────────────────────────────────────

describe('createCalendarEventsForRequest', () => {
  it('creates one calendar event per business day in the request range', async () => {
    const mockDocRef = {
      set: vi.fn().mockResolvedValue(undefined),
    }
    const mockCollRef = {
      doc: vi.fn().mockReturnValue(mockDocRef),
    }
    const mockDb = {
      collection: vi.fn().mockReturnValue(mockCollRef),
    } as any

    const request: TimeOffRequest = {
      id: 'req1',
      userUid: 'u1',
      userName: 'Alice',
      userEmail: 'alice@test.com',
      startDate: '2025-06-16', // Monday
      endDate: '2025-06-18', // Wednesday (3 business days)
      type: 'PTO',
      reason: 'Vacation',
      status: 'approved',
      days: 3,
      shortNotice: false,
      monthKey: '2025-06',
      createdAt: new Date().toISOString(),
      eventIds: [],
    }

    const user = { uid: 'u1', name: 'Alice', email: 'alice@test.com' }
    const eventIds = await createCalendarEventsForRequest(mockDb, request, user)

    expect(eventIds).toHaveLength(3)
    expect(mockDocRef.set).toHaveBeenCalledTimes(3)
    // Each set call should include the PTO type in the title
    const firstCall = mockDocRef.set.mock.calls[0][0]
    expect(firstCall.title).toContain('PTO')
    expect(firstCall.color).toBe('amber')
    expect(firstCall.hostUid).toBe('u1')
  })

  it('returns an empty array for a weekend-only range', async () => {
    const mockDb = { collection: vi.fn() } as any

    const request: TimeOffRequest = {
      id: 'req2',
      userUid: 'u2',
      userName: 'Bob',
      userEmail: 'bob@test.com',
      startDate: '2025-06-21', // Saturday
      endDate: '2025-06-22', // Sunday
      type: 'PTO',
      reason: '',
      status: 'approved',
      days: 0,
      shortNotice: false,
      monthKey: '2025-06',
      createdAt: new Date().toISOString(),
      eventIds: [],
    }

    const user = { uid: 'u2' }
    const eventIds = await createCalendarEventsForRequest(mockDb, request, user)
    expect(eventIds).toHaveLength(0)
  })

  it('uses fallback hostName from email when name is absent', async () => {
    const mockDocRef = { set: vi.fn().mockResolvedValue(undefined) }
    const mockDb = {
      collection: vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockDocRef) }),
    } as any

    const request: TimeOffRequest = {
      id: 'req3',
      userUid: 'u3',
      userName: '',
      userEmail: 'carol@test.com',
      startDate: '2025-06-16',
      endDate: '2025-06-16',
      type: 'Unpaid day',
      reason: '',
      status: 'approved',
      days: 1,
      shortNotice: false,
      monthKey: '2025-06',
      createdAt: new Date().toISOString(),
      eventIds: [],
    }

    const user = { uid: 'u3', email: 'carol@test.com' }
    await createCalendarEventsForRequest(mockDb, request, user)

    const setCall = mockDocRef.set.mock.calls[0][0]
    expect(setCall.hostName).toBe('carol@test.com')
  })
})

// ─── deleteCalendarEvents ─────────────────────────────────────────────────────

describe('deleteCalendarEvents', () => {
  it('deletes events that belong to the user', async () => {
    const mockRef = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ hostUid: 'u1' }),
        ref: { delete: vi.fn().mockResolvedValue(undefined) },
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    // Make ref.get().ref point back to the same mockRef for deletion
    mockRef.get = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ hostUid: 'u1' }),
    })
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockRef),
      }),
    } as any

    await deleteCalendarEvents(mockDb, ['ev1', 'ev2'], 'u1')
    expect(mockRef.delete).toHaveBeenCalledTimes(2)
  })

  it('does not delete events that belong to another user', async () => {
    const mockRef = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ hostUid: 'other-user' }),
      }),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockRef),
      }),
    } as any

    await deleteCalendarEvents(mockDb, ['ev1'], 'u1')
    expect(mockRef.delete).not.toHaveBeenCalled()
  })

  it('skips non-existent events gracefully', async () => {
    const mockRef = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      delete: vi.fn(),
    }
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue(mockRef),
      }),
    } as any

    await expect(deleteCalendarEvents(mockDb, ['ghost-ev'], 'u1')).resolves.not.toThrow()
    expect(mockRef.delete).not.toHaveBeenCalled()
  })

  it('does nothing when eventIds is empty', async () => {
    const mockDb = { collection: vi.fn() } as any
    await expect(deleteCalendarEvents(mockDb, [], 'u1')).resolves.not.toThrow()
    expect(mockDb.collection).not.toHaveBeenCalled()
  })

  it('does nothing when eventIds is undefined/null', async () => {
    const mockDb = { collection: vi.fn() } as any
    // @ts-expect-error — testing defensive branch
    await expect(deleteCalendarEvents(mockDb, null, 'u1')).resolves.not.toThrow()
    expect(mockDb.collection).not.toHaveBeenCalled()
  })
})
