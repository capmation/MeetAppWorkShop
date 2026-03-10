import type { ChatMessage } from './chat.types'
import type { GameScore } from './games.types'

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

export interface CallPayload {
  fromUid: string
  fromName: string
  fromPhoto: string | null
  meetingId: string
}

// ── Tetris multiplayer types ──────────────────────────────────────────
export interface TetrisLobbyPlayer {
  uid: string
  displayName: string
  photoURL: string | null
  inQueue: boolean
}

export interface TetrisMatchPlayer {
  uid: string
  displayName: string
  photoURL: string | null
}

export interface TetrisRanking {
  uid: string
  displayName: string
  photoURL: string | null
  score: number
  level: number
  lines: number
  place: number
}

// ── Event maps ────────────────────────────────────────────────────────
export interface ServerToClientEvents {
  // Meetings / presence / chat (existing)
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
  'call:incoming': (data: CallPayload) => void
  'call:answered': (data: { meetingId: string; byUid: string }) => void
  'call:declined': (data: { byUid: string; byName: string }) => void
  'call:cancelled': (data: { byUid: string }) => void
  'call:unavailable': (data: { toUid: string }) => void

  // Tetris lobby
  'tetris:lobby-state': (players: TetrisLobbyPlayer[]) => void
  'tetris:queue-size': (count: number) => void

  // Tetris match lifecycle
  'tetris:match-found': (data: { matchId: string; players: TetrisMatchPlayer[] }) => void
  'tetris:countdown': (seconds: number) => void
  'tetris:match-start': (matchId: string) => void

  // Tetris in-game
  'tetris:opponent-board': (data: { uid: string; rows: (string | null)[][] }) => void
  'tetris:garbage-recv': (data: { lines: number; fromUid: string }) => void
  'tetris:player-out': (data: { uid: string; displayName: string; finalScore: number }) => void
  'tetris:match-end': (data: { rankings: TetrisRanking[] }) => void

  // Games real-time leaderboard
  'games:score-update': (data: { gameId: string; entry: GameScore }) => void
}

export interface ClientToServerEvents {
  // Meetings / presence / chat (existing)
  'room:join': (data: { roomId: string; token: string; user: { uid: string; displayName: string; photoURL: string | null } }) => void
  'room:leave': () => void
  'chat:send': (data: { roomId: string; text: string }) => void
  'dm:send': (data: { toUid: string; text: string; roomId?: string }) => void
  'presence:announce': (data: { token: string; user: { uid: string; displayName: string; photoURL: string | null }; status?: 'online' | 'away' | 'offline' }) => void
  'webrtc:offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void
  'webrtc:answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void
  'webrtc:ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void
  'call:ring': (data: { toUid: string; meetingId: string; callerName: string; callerPhoto: string | null }) => void
  'call:answer': (data: { toUid: string; meetingId: string }) => void
  'call:decline': (data: { toUid: string }) => void
  'call:cancel': (data: { toUid: string }) => void

  // Tetris lobby
  'tetris:lobby-join': (data: { token: string; user: { uid: string; displayName: string; photoURL: string | null } }) => void
  'tetris:lobby-leave': () => void
  'tetris:queue-join': () => void
  'tetris:queue-leave': () => void

  // Tetris in-game
  'tetris:board-update': (data: { matchId: string; rows: (string | null)[][] }) => void
  'tetris:garbage-send': (data: { matchId: string; lines: number }) => void
  'tetris:game-over': (data: { matchId: string; score: number; level: number; lines: number }) => void

  // Games real-time leaderboard
  'games:leaderboard-join': (data: { gameId: string }) => void
  'games:leaderboard-leave': (data: { gameId: string }) => void
}
