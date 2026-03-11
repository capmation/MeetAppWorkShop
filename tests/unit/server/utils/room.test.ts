// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest'
import {
  joinRoom,
  leaveRoom,
  findParticipant,
  getRoomParticipants,
  getRoomSize,
  MAX_ROOM_SIZE,
  type RoomParticipant,
} from '../../../../server/utils/room'

// Helper to create a test participant
function makeParticipant(socketId: string, uid: string): RoomParticipant {
  return { socketId, uid, displayName: `User ${uid}`, photoURL: null }
}

// Collect room IDs used in tests so we can clean up
const usedRooms: Array<{ room: string; socket: string }> = []
function track(room: string, socket: string) {
  usedRooms.push({ room, socket })
  return { room, socket }
}

afterEach(() => {
  // Clean up all tracked participants
  while (usedRooms.length) {
    const { socket } = usedRooms.pop()!
    leaveRoom(socket)
  }
})

describe('MAX_ROOM_SIZE', () => {
  it('is 4', () => {
    expect(MAX_ROOM_SIZE).toBe(4)
  })
})

describe('joinRoom', () => {
  it('creates a new room and adds the participant', () => {
    const p = makeParticipant('s1', 'u1')
    track('room-join-1', 's1')
    joinRoom('room-join-1', p)
    expect(getRoomSize('room-join-1')).toBe(1)
    expect(getRoomParticipants('room-join-1')).toContainEqual(p)
  })

  it('adds multiple participants to the same room', () => {
    const p1 = makeParticipant('s2', 'u2')
    const p2 = makeParticipant('s3', 'u3')
    track('room-join-2', 's2')
    track('room-join-2', 's3')
    joinRoom('room-join-2', p1)
    joinRoom('room-join-2', p2)
    expect(getRoomSize('room-join-2')).toBe(2)
  })

  it('overwrites participant with same socketId', () => {
    const p1 = makeParticipant('s4', 'u4')
    const p2 = { ...p1, displayName: 'Updated Name' }
    track('room-join-3', 's4')
    joinRoom('room-join-3', p1)
    joinRoom('room-join-3', p2)
    expect(getRoomSize('room-join-3')).toBe(1)
    expect(getRoomParticipants('room-join-3')[0].displayName).toBe('Updated Name')
  })

  it('supports participants with photoURL', () => {
    const p = { socketId: 's5', uid: 'u5', displayName: 'Alice', photoURL: 'https://example.com/photo.jpg' }
    track('room-photo', 's5')
    joinRoom('room-photo', p)
    expect(getRoomParticipants('room-photo')[0].photoURL).toBe('https://example.com/photo.jpg')
  })
})

describe('leaveRoom', () => {
  it('returns the roomId and participant when found', () => {
    const p = makeParticipant('s10', 'u10')
    joinRoom('room-leave-1', p)
    const result = leaveRoom('s10')
    expect(result.roomId).toBe('room-leave-1')
    expect(result.participant).toEqual(p)
  })

  it('removes the participant from the room', () => {
    const p = makeParticipant('s11', 'u11')
    joinRoom('room-leave-2', p)
    leaveRoom('s11')
    expect(getRoomSize('room-leave-2')).toBe(0)
  })

  it('cleans up the room when last participant leaves', () => {
    const p = makeParticipant('s12', 'u12')
    joinRoom('room-leave-3', p)
    leaveRoom('s12')
    // Room should no longer exist — size returns 0 for non-existent rooms
    expect(getRoomSize('room-leave-3')).toBe(0)
    expect(getRoomParticipants('room-leave-3')).toEqual([])
  })

  it('keeps room alive when other participants remain', () => {
    const p1 = makeParticipant('s13', 'u13')
    const p2 = makeParticipant('s14', 'u14')
    track('room-leave-4', 's14') // s13 will be explicitly left
    joinRoom('room-leave-4', p1)
    joinRoom('room-leave-4', p2)
    leaveRoom('s13')
    expect(getRoomSize('room-leave-4')).toBe(1)
    expect(getRoomParticipants('room-leave-4')).toContainEqual(p2)
  })

  it('returns null roomId and participant for unknown socketId', () => {
    const result = leaveRoom('unknown-socket-xyz')
    expect(result.roomId).toBeNull()
    expect(result.participant).toBeNull()
  })
})

describe('findParticipant', () => {
  it('finds an existing participant by socketId', () => {
    const p = makeParticipant('s20', 'u20')
    track('room-find-1', 's20')
    joinRoom('room-find-1', p)
    const result = findParticipant('s20')
    expect(result.roomId).toBe('room-find-1')
    expect(result.participant).toEqual(p)
  })

  it('returns null for an unknown socketId', () => {
    const result = findParticipant('no-such-socket')
    expect(result.roomId).toBeNull()
    expect(result.participant).toBeNull()
  })

  it('does not mutate room state', () => {
    const p = makeParticipant('s21', 'u21')
    track('room-find-2', 's21')
    joinRoom('room-find-2', p)
    findParticipant('s21')
    expect(getRoomSize('room-find-2')).toBe(1)
  })
})

describe('getRoomParticipants', () => {
  it('returns empty array for a non-existent room', () => {
    expect(getRoomParticipants('no-such-room')).toEqual([])
  })

  it('returns all participants in the room', () => {
    const p1 = makeParticipant('s30', 'u30')
    const p2 = makeParticipant('s31', 'u31')
    track('room-participants', 's30')
    track('room-participants', 's31')
    joinRoom('room-participants', p1)
    joinRoom('room-participants', p2)
    const list = getRoomParticipants('room-participants')
    expect(list).toHaveLength(2)
    expect(list).toContainEqual(p1)
    expect(list).toContainEqual(p2)
  })
})

describe('getRoomSize', () => {
  it('returns 0 for a non-existent room', () => {
    expect(getRoomSize('ghost-room')).toBe(0)
  })

  it('returns the correct count after joins and leaves', () => {
    const p1 = makeParticipant('s40', 'u40')
    const p2 = makeParticipant('s41', 'u41')
    track('room-size', 's41')
    joinRoom('room-size', p1)
    joinRoom('room-size', p2)
    expect(getRoomSize('room-size')).toBe(2)
    leaveRoom('s40')
    expect(getRoomSize('room-size')).toBe(1)
  })
})
