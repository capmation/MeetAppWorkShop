// In-memory room state for the signaling server.
// This is volatile — it resets on server restart (acceptable for a POC).

export interface RoomParticipant {
  socketId: string
  uid: string
  displayName: string
  photoURL: string | null
}

// Map<roomId, Map<socketId, participant>>
const rooms = new Map<string, Map<string, RoomParticipant>>()

export function joinRoom(roomId: string, participant: RoomParticipant): void {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map())
  }
  rooms.get(roomId)!.set(participant.socketId, participant)
}

export function leaveRoom(socketId: string): { roomId: string | null; participant: RoomParticipant | null } {
  for (const [roomId, participants] of rooms.entries()) {
    if (participants.has(socketId)) {
      const participant = participants.get(socketId)!
      participants.delete(socketId)
      if (participants.size === 0) {
        rooms.delete(roomId)
      }
      return { roomId, participant }
    }
  }
  return { roomId: null, participant: null }
}

export function getRoomParticipants(roomId: string): RoomParticipant[] {
  return Array.from(rooms.get(roomId)?.values() ?? [])
}

export function getRoomSize(roomId: string): number {
  return rooms.get(roomId)?.size ?? 0
}

export const MAX_ROOM_SIZE = 4
