import { createServer, Server as NodeHttpServer } from 'node:http'
import { defineNitroPlugin } from 'nitropack/runtime'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, RoomUser, PresenceUser, TetrisMatchPlayer, TetrisRanking } from '../../app/types/socket.types'
import type { ChatMessage } from '../../app/types/chat.types'
import { joinRoom, leaveRoom, getRoomParticipants, getRoomSize, MAX_ROOM_SIZE } from '../utils/room'
import { getAdminAuth } from '../utils/firebase-admin'

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null

/** Allows API routes (e.g. scores.post.ts) to emit real-time events */
export function getIo() { return ioInstance }

type PresenceEntry = {
  user: PresenceUser
  sockets: Set<string>
}

const presence = new Map<string, PresenceEntry>()
const offlineDmQueue = new Map<string, ChatMessage[]>()

// ── Tetris in-memory state ────────────────────────────────────────────
interface TetrisLobbyEntry {
  uid: string
  displayName: string
  photoURL: string | null
  socketId: string
  inQueue: boolean
}

interface TetrisMatchState {
  matchId: string
  players: Map<string, {
    uid: string
    displayName: string
    photoURL: string | null
    socketId: string
    alive: boolean
    score: number
    level: number
    lines: number
  }>
  state: 'countdown' | 'playing' | 'ended'
  aliveCount: number
}

const tetrisLobby = new Map<string, TetrisLobbyEntry>()
const tetrisQueue: string[] = []
const tetrisMatches = new Map<string, TetrisMatchState>()
let queueTimer: ReturnType<typeof setTimeout> | null = null

function generateMatchId() {
  return 'tm-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────
const corsOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001']

function attachIoToServer(httpServer: any) {
  if (ioInstance) return
  console.info('[socket.io] attaching to HTTP server, CORS origins:', corsOrigins)
  ioInstance = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: '/socket.io',
    cors: { origin: corsOrigins, credentials: true },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  })
  setupSocketHandlers(ioInstance)
}

function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.engine.on('connection_error', (err) => {
    console.warn('[socket.io] connection error', err.message)
  })

  // ── Presence helpers ────────────────────────────────────────────────
  function toPresenceUser(entry: PresenceEntry): PresenceUser {
    return { ...entry.user, socketIds: Array.from(entry.sockets) }
  }

  function findPresenceBySocketId(socketId: string): { uid: string; entry: PresenceEntry } | null {
    for (const [uid, entry] of presence.entries()) {
      if (entry.sockets.has(socketId)) return { uid, entry }
    }
    return null
  }

  async function handlePresenceAnnounce(socketId: string, token: string, user: PresenceUser) {
    try {
      const decoded = await (await getAdminAuth()).verifyIdToken(token)
      if (decoded.uid !== user.uid) return
    }
    catch { return }

    const existing = presence.get(user.uid)
    if (!existing) {
      presence.set(user.uid, { user: { ...user, status: user.status || 'online' }, sockets: new Set([socketId]) })
      io.emit('presence:online', toPresenceUser(presence.get(user.uid)!))
    }
    else {
      existing.user = { ...user, status: user.status || existing.user.status || 'online' }
      existing.sockets.add(socketId)
      io.emit('presence:status', toPresenceUser(existing))
    }

    const allUsers = Array.from(presence.values()).map(toPresenceUser)
    io.to(socketId).emit('presence:list', allUsers)

    const queued = offlineDmQueue.get(user.uid)
    if (queued?.length) {
      for (const msg of queued) io.to(socketId).emit('dm:message', msg)
      offlineDmQueue.delete(user.uid)
    }
  }

  function handlePresenceDisconnect(socketId: string) {
    const found = findPresenceBySocketId(socketId)
    if (!found) return
    const { uid, entry } = found
    entry.sockets.delete(socketId)
    if (entry.sockets.size === 0) {
      entry.user = { ...entry.user, status: 'offline' }
      presence.delete(uid)
      io.emit('presence:offline', uid)
    }
  }

  // ── Tetris helpers ──────────────────────────────────────────────────
  function broadcastLobbyState() {
    const players = Array.from(tetrisLobby.values()).map(e => ({
      uid: e.uid,
      displayName: e.displayName,
      photoURL: e.photoURL,
      inQueue: e.inQueue,
    }))
    for (const entry of tetrisLobby.values()) {
      io.to(entry.socketId).emit('tetris:lobby-state', players)
    }
  }

  function broadcastQueueSize() {
    for (const entry of tetrisLobby.values()) {
      io.to(entry.socketId).emit('tetris:queue-size', tetrisQueue.length)
    }
  }

  function removeFromQueue(uid: string) {
    const idx = tetrisQueue.indexOf(uid)
    if (idx !== -1) tetrisQueue.splice(idx, 1)
    const entry = tetrisLobby.get(uid)
    if (entry) entry.inQueue = false
  }

  function startMatch(playerUids: string[]) {
    const matchId = generateMatchId()
    const matchPlayers = new Map<string, TetrisMatchState['players'] extends Map<string, infer V> ? V : never>()

    for (const uid of playerUids) {
      const entry = tetrisLobby.get(uid)
      if (!entry) continue
      matchPlayers.set(uid, { uid, displayName: entry.displayName, photoURL: entry.photoURL, socketId: entry.socketId, alive: true, score: 0, level: 1, lines: 0 })
      removeFromQueue(uid)
    }

    if (matchPlayers.size < 2) return

    tetrisMatches.set(matchId, { matchId, players: matchPlayers, state: 'countdown', aliveCount: matchPlayers.size })

    const matchPlayerList: TetrisMatchPlayer[] = Array.from(matchPlayers.values()).map(p => ({
      uid: p.uid, displayName: p.displayName, photoURL: p.photoURL,
    }))

    for (const player of matchPlayers.values()) {
      const sock = io.sockets.sockets.get(player.socketId)
      sock?.join(`tetris-match-${matchId}`)
      io.to(player.socketId).emit('tetris:match-found', { matchId, players: matchPlayerList })
    }

    broadcastLobbyState()
    broadcastQueueSize()

    let tick = 3
    const countdown = setInterval(() => {
      io.to(`tetris-match-${matchId}`).emit('tetris:countdown', tick)
      tick--
      if (tick < 0) {
        clearInterval(countdown)
        const match = tetrisMatches.get(matchId)
        if (match) match.state = 'playing'
        io.to(`tetris-match-${matchId}`).emit('tetris:match-start', matchId)
      }
    }, 1000)
  }

  function tryStartQueue() {
    if (tetrisQueue.length >= 4) {
      if (queueTimer) { clearTimeout(queueTimer); queueTimer = null }
      startMatch(tetrisQueue.splice(0, 4))
    }
    else if (tetrisQueue.length >= 2) {
      if (!queueTimer) {
        queueTimer = setTimeout(() => {
          queueTimer = null
          if (tetrisQueue.length >= 2) {
            startMatch(tetrisQueue.splice(0, Math.min(4, tetrisQueue.length)))
          }
        }, 10_000)
      }
    }
    else {
      if (queueTimer) { clearTimeout(queueTimer); queueTimer = null }
    }
    broadcastQueueSize()
  }

  function endMatch(matchId: string, triggerUid?: string) {
    const match = tetrisMatches.get(matchId)
    if (!match || match.state === 'ended') return
    match.state = 'ended'

    if (triggerUid) {
      const p = match.players.get(triggerUid)
      if (p && p.alive) {
        p.alive = false
        match.aliveCount--
        io.to(`tetris-match-${matchId}`).emit('tetris:player-out', { uid: triggerUid, displayName: p.displayName, finalScore: p.score })
      }
    }

    const sorted = Array.from(match.players.values()).sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1
      return b.score - a.score
    })

    const rankings: TetrisRanking[] = sorted.map((p, i) => ({
      uid: p.uid, displayName: p.displayName, photoURL: p.photoURL,
      score: p.score, level: p.level, lines: p.lines, place: i + 1,
    }))

    io.to(`tetris-match-${matchId}`).emit('tetris:match-end', { rankings })
    tetrisMatches.delete(matchId)
  }

  function handleTetrisDisconnect(socketId: string) {
    const entry = Array.from(tetrisLobby.values()).find(e => e.socketId === socketId)
    if (!entry) return
    removeFromQueue(entry.uid)
    tetrisLobby.delete(entry.uid)
    broadcastLobbyState()
    broadcastQueueSize()
    for (const match of tetrisMatches.values()) {
      if (match.players.has(entry.uid)) { endMatch(match.matchId, entry.uid); return }
    }
  }

  // ── Main connection ─────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.info('[socket.io] client connected', socket.id)

    socket.on('presence:announce', ({ token, user, status }) => {
      handlePresenceAnnounce(socket.id, token, { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, status: status ?? 'online', socketIds: [] })
    })

    socket.on('room:join', async ({ roomId, token, user }) => {
      try {
        const decoded = await (await getAdminAuth()).verifyIdToken(token)
        if (decoded.uid !== user.uid) { socket.emit('room:users', []); return }
      }
      catch { socket.emit('room:users', []); return }
      if (getRoomSize(roomId) >= MAX_ROOM_SIZE) { socket.emit('room:users', []); return }
      const participant = { socketId: socket.id, uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
      joinRoom(roomId, participant)
      socket.join(roomId)
      socket.to(roomId).emit('user:joined', participant as RoomUser)
      socket.emit('room:users', getRoomParticipants(roomId) as RoomUser[])
    })

    socket.on('call:ring', ({ toUid, meetingId, callerName, callerPhoto }) => {
      const caller = findPresenceBySocketId(socket.id)
      if (!caller) return
      const target = presence.get(toUid)
      if (!target || target.sockets.size === 0) { socket.emit('call:unavailable', { toUid }); return }
      for (const sid of target.sockets) io.to(sid).emit('call:incoming', { fromUid: caller.uid, fromName: callerName, fromPhoto: callerPhoto, meetingId })
    })

    socket.on('call:answer', ({ toUid, meetingId }) => {
      const answerer = findPresenceBySocketId(socket.id)
      if (!answerer) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) io.to(sid).emit('call:answered', { meetingId, byUid: answerer.uid })
    })

    socket.on('call:decline', ({ toUid }) => {
      const decliner = findPresenceBySocketId(socket.id)
      if (!decliner) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) io.to(sid).emit('call:declined', { byUid: decliner.uid, byName: decliner.entry.user.displayName })
    })

    socket.on('call:cancel', ({ toUid }) => {
      const canceller = findPresenceBySocketId(socket.id)
      if (!canceller) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) io.to(sid).emit('call:cancelled', { byUid: canceller.uid })
    })

    socket.on('chat:send', ({ roomId, text }) => {
      const sanitizedText = text.trim().slice(0, 2000)
      if (!sanitizedText) return
      const participants = getRoomParticipants(roomId)
      const sender = participants.find(p => p.socketId === socket.id)
      if (!sender) return
      io.to(roomId).emit('chat:message', { id: `${Date.now()}-${socket.id}`, roomId, userId: sender.uid, userName: sender.displayName, userPhoto: sender.photoURL, text: sanitizedText, timestamp: Date.now() })
    })

    socket.on('dm:send', ({ toUid, text }) => {
      const sanitizedText = text.trim().slice(0, 2000)
      if (!sanitizedText) return
      const senderPresence = findPresenceBySocketId(socket.id)
      if (!senderPresence) return
      const sender = senderPresence.entry.user
      const recipientPresence = presence.get(toUid)
      const payload: ChatMessage = { id: `${Date.now()}-${socket.id}-dm`, roomId: 'dm', userId: sender.uid, userName: sender.displayName, userPhoto: sender.photoURL, text: sanitizedText, timestamp: Date.now(), toUserId: toUid, toUserName: recipientPresence?.user.displayName }
      if (recipientPresence) { for (const sid of recipientPresence.sockets) io.to(sid).emit('dm:message', payload) }
      else { offlineDmQueue.set(toUid, [...(offlineDmQueue.get(toUid) ?? []), payload]) }
      for (const sid of senderPresence.entry.sockets) io.to(sid).emit('dm:message', payload)
    })

    socket.on('webrtc:offer', ({ to, offer }) => socket.to(to).emit('webrtc:offer', { from: socket.id, offer }))
    socket.on('webrtc:answer', ({ to, answer }) => socket.to(to).emit('webrtc:answer', { from: socket.id, answer }))
    socket.on('webrtc:ice-candidate', ({ to, candidate }) => socket.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate }))

    // ── Tetris Lobby ──────────────────────────────────────────────────
    socket.on('tetris:lobby-join', async ({ token, user }) => {
      try {
        const decoded = await (await getAdminAuth()).verifyIdToken(token)
        if (decoded.uid !== user.uid) return
      }
      catch { return }

      if (tetrisLobby.has(user.uid)) {
        tetrisLobby.get(user.uid)!.socketId = socket.id
      }
      else {
        tetrisLobby.set(user.uid, { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, socketId: socket.id, inQueue: false })
      }
      broadcastLobbyState()
      io.to(socket.id).emit('tetris:queue-size', tetrisQueue.length)
    })

    socket.on('tetris:lobby-leave', () => {
      const entry = Array.from(tetrisLobby.values()).find(e => e.socketId === socket.id)
      if (!entry) return
      removeFromQueue(entry.uid)
      tetrisLobby.delete(entry.uid)
      broadcastLobbyState()
      broadcastQueueSize()
    })

    socket.on('tetris:queue-join', () => {
      const entry = Array.from(tetrisLobby.values()).find(e => e.socketId === socket.id)
      if (!entry || entry.inQueue) return
      entry.inQueue = true
      if (!tetrisQueue.includes(entry.uid)) tetrisQueue.push(entry.uid)
      broadcastLobbyState()
      tryStartQueue()
    })

    socket.on('tetris:queue-leave', () => {
      const entry = Array.from(tetrisLobby.values()).find(e => e.socketId === socket.id)
      if (!entry) return
      removeFromQueue(entry.uid)
      broadcastLobbyState()
      tryStartQueue()
    })

    // ── Tetris In-Game ────────────────────────────────────────────────
    socket.on('tetris:board-update', ({ matchId, rows }) => {
      const match = tetrisMatches.get(matchId)
      if (!match || match.state !== 'playing') return
      const sender = Array.from(match.players.values()).find(p => p.socketId === socket.id)
      if (!sender) return
      socket.to(`tetris-match-${matchId}`).emit('tetris:opponent-board', { uid: sender.uid, rows })
    })

    socket.on('tetris:garbage-send', ({ matchId, lines }) => {
      const match = tetrisMatches.get(matchId)
      if (!match || match.state !== 'playing' || lines <= 0) return
      const sender = Array.from(match.players.values()).find(p => p.socketId === socket.id)
      if (!sender) return
      socket.to(`tetris-match-${matchId}`).emit('tetris:garbage-recv', { lines, fromUid: sender.uid })
    })

    socket.on('tetris:game-over', ({ matchId, score, level, lines }) => {
      const match = tetrisMatches.get(matchId)
      if (!match || match.state !== 'playing') return
      const player = Array.from(match.players.values()).find(p => p.socketId === socket.id)
      if (!player || !player.alive) return

      player.alive = false
      player.score = score
      player.level = level
      player.lines = lines
      match.aliveCount--

      io.to(`tetris-match-${matchId}`).emit('tetris:player-out', { uid: player.uid, displayName: player.displayName, finalScore: score })

      if (match.aliveCount <= 1) endMatch(matchId)
    })

    // ── Real-time Leaderboard ─────────────────────────────────────────
    socket.on('games:leaderboard-join', ({ gameId }) => socket.join(`games-lb-${gameId}`))
    socket.on('games:leaderboard-leave', ({ gameId }) => socket.leave(`games-lb-${gameId}`))

    // ── Disconnect ────────────────────────────────────────────────────
    socket.on('room:leave', () => handleRoomLeave(socket.id))
    socket.on('disconnect', () => {
      handleRoomLeave(socket.id)
      handlePresenceDisconnect(socket.id)
      handleTetrisDisconnect(socket.id)
    })
  })

  function handleRoomLeave(socketId: string) {
    const { roomId, participant } = leaveRoom(socketId)
    if (roomId && participant) io.to(roomId).emit('user:left', socketId)
  }
}

// ─── Production: intercept HttpServer.prototype.listen ────────────────────────
if (process.env.NODE_ENV === 'production') {
  const _origListen = NodeHttpServer.prototype.listen
  NodeHttpServer.prototype.listen = function (this: any, ...args: any[]) {
    NodeHttpServer.prototype.listen = _origListen
    const capturedServer = this
    const lastIdx = args.length - 1
    if (typeof args[lastIdx] === 'function') {
      const origCb = args[lastIdx]
      args[lastIdx] = function (...cbArgs: any[]) { attachIoToServer(capturedServer); origCb.apply(this, cbArgs) }
    }
    else { capturedServer.once('listening', () => attachIoToServer(capturedServer)) }
    return _origListen.apply(this, args as any)
  }
}

// ─── Nitro plugin ──────────────────────────────────────────────────────────────
export default defineNitroPlugin((_nitroApp) => {
  if (ioInstance) return
  if (process.env.NODE_ENV !== 'production') {
    const port = Number(process.env.SOCKET_PORT || 4001)
    const standalone = createServer()
    standalone.listen(port, () => {
      console.info('[socket.io] standalone server listening on port', port)
      attachIoToServer(standalone)
    })
    standalone.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') console.error(`[socket.io] port ${port} already in use`)
      else console.error('[socket.io] standalone server error:', err?.message)
    })
  }
})
