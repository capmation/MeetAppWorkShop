import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMeetingStore } from '../../../app/stores/meeting.store'
import type { Meeting } from '../../../app/types/meeting.types'

describe('useMeetingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockMeeting: Meeting = {
    id: 'abc123',
    title: 'Weekly Sync',
    hostUid: 'uid1',
    hostName: 'Alice',
    createdAt: new Date().toISOString(),
    visibility: 'private',
  }

  it('starts empty', () => {
    const store = useMeetingStore()
    expect(store.meetings).toHaveLength(0)
    expect(store.currentMeeting).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('sets meetings list', () => {
    const store = useMeetingStore()
    store.setMeetings([mockMeeting])
    expect(store.meetings).toHaveLength(1)
    expect(store.meetings[0].title).toBe('Weekly Sync')
  })

  it('prepends new meeting', () => {
    const store = useMeetingStore()
    store.setMeetings([mockMeeting])
    const newer: Meeting = { ...mockMeeting, id: 'xyz', title: 'New One' }
    store.addMeeting(newer)
    expect(store.meetings[0].id).toBe('xyz')
    expect(store.meetings).toHaveLength(2)
  })

  it('removes a meeting', () => {
    const store = useMeetingStore()
    const newer: Meeting = { ...mockMeeting, id: 'xyz', title: 'New One' }
    store.setMeetings([mockMeeting, newer])
    store.removeMeeting('abc123')
    expect(store.meetings).toHaveLength(1)
    expect(store.meetings[0].id).toBe('xyz')
  })

  it('sets current meeting', () => {
    const store = useMeetingStore()
    store.setCurrentMeeting(mockMeeting)
    expect(store.currentMeeting?.id).toBe('abc123')
  })

  it('sets and clears error', () => {
    const store = useMeetingStore()
    store.setError('Something went wrong')
    expect(store.error).toBe('Something went wrong')
    store.setError(null)
    expect(store.error).toBeNull()
  })
})
