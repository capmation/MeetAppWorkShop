import type { ChatMessage } from './chat.types'

export interface RoomUser {
  socketId: string
  uid: string
  displayName: string
  photoURL: string | null
}

export interface PresenceUser {
  uid: string
  displayName: string
  photoURL: string | null
  socketIds: string[]
  status: 'online' | 'away' | 'offline'
}

export interface ServerToClientEvents {
  'room:users': (users: RoomUser[]) => void
  'user:joined': (user: RoomUser) => void
  'user:left': (socketId: string) => void
  'chat:message': (message: ChatMessage) => void
  'dm:message': (message: ChatMessage) => void
  'presence:list': (users: PresenceUser[]) => void
  'presence:online': (user: PresenceUser) => void
  'presence:offline': (uid: string) => void
  'presence:status': (user: PresenceUser) => void
  'webrtc:offer': (data: { from: string; offer: RTCSessionDescriptionInit }) => void
  'webrtc:answer': (data: { from: string; answer: RTCSessionDescriptionInit }) => void
  'webrtc:ice-candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string; token: string; user: { uid: string; displayName: string; photoURL: string | null } }) => void
  'room:leave': () => void
  'chat:send': (data: { roomId: string; text: string }) => void
  'dm:send': (data: { toUid: string; text: string; roomId?: string }) => void
  'presence:announce': (data: { token: string; user: { uid: string; displayName: string; photoURL: string | null }; status?: 'online' | 'away' | 'offline' }) => void
  'webrtc:offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void
  'webrtc:answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void
  'webrtc:ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void
}
