import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatRelativeTime, formatTime } from '../../../app/utils/format-date'

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))
  })

  it('returns "just now" for <1 min ago', () => {
    const t = new Date('2024-01-01T11:59:30Z')
    expect(formatRelativeTime(t)).toBe('just now')
  })

  it('returns minutes for <1 hour ago', () => {
    const t = new Date('2024-01-01T11:30:00Z')
    expect(formatRelativeTime(t)).toBe('30m ago')
  })

  it('returns hours for <24 hours ago', () => {
    const t = new Date('2024-01-01T08:00:00Z')
    expect(formatRelativeTime(t)).toBe('4h ago')
  })

  it('returns date string for older dates', () => {
    const t = new Date('2023-12-30T12:00:00Z')
    expect(formatRelativeTime(t)).toMatch(/\d/)
  })

  it('accepts timestamp number', () => {
    const ts = new Date('2024-01-01T11:55:00Z').getTime()
    expect(formatRelativeTime(ts)).toBe('5m ago')
  })
})

describe('formatTime', () => {
  it('returns HH:MM format', () => {
    const ts = new Date('2024-01-01T14:30:00').getTime()
    const result = formatTime(ts)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})
