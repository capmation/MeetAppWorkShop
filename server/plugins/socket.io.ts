import { createServer, Server as NodeHttpServer } from 'node:http'
import { defineNitroPlugin } from 'nitropack/runtime'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, RoomUser, PresenceUser } from '../../app/types/socket.types'
import type { ChatMessage } from '../../app/types/chat.types'
import { joinRoom, leaveRoom, getRoomParticipants, getRoomSize, MAX_ROOM_SIZE } from '../utils/room'
import { getAdminAuth } from '../utils/firebase-admin'

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null

type PresenceEntry = {
  user: PresenceUser
  sockets: Set<string>
}

const presence = new Map<string, PresenceEntry>()
const offlineDmQueue = new Map<string, ChatMessage[]>()

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
    catch {
      return
    }

    const existing = presence.get(user.uid)
    if (!existing) {
      presence.set(user.uid, {
        user: { ...user, status: user.status || 'online' },
        sockets: new Set([socketId]),
      })
      io.emit('presence:online', toPresenceUser(presence.get(user.uid)!))
    }
    else {
      existing.user = { ...user, status: user.status || existing.user.status || 'online' }
      existing.sockets.add(socketId)
      io.emit('presence:status', toPresenceUser(existing))
    }

    // Send full list to the newly announced socket
    const allUsers = Array.from(presence.values()).map(toPresenceUser)
    io.to(socketId).emit('presence:list', allUsers)

    const queued = offlineDmQueue.get(user.uid)
    if (queued?.length) {
      for (const msg of queued) {
        io.to(socketId).emit('dm:message', msg)
      }
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

  io.on('connection', (socket) => {
    console.info('[socket.io] client connected', socket.id)

    socket.on('presence:announce', ({ token, user, status }) => {
      handlePresenceAnnounce(socket.id, token, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        status: status ?? 'online',
        socketIds: [],
      })
    })

    socket.on('room:join', async ({ roomId, token, user }) => {
      try {
        const decoded = await (await getAdminAuth()).verifyIdToken(token)
        if (decoded.uid !== user.uid) {
          socket.emit('room:users', [])
          return
        }
      }
      catch {
        socket.emit('room:users', [])
        return
      }

      if (getRoomSize(roomId) >= MAX_ROOM_SIZE) {
        socket.emit('room:users', [])
        return
      }

      const participant = {
        socketId: socket.id,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }
      joinRoom(roomId, participant)
      socket.join(roomId)
      socket.to(roomId).emit('user:joined', participant as RoomUser)
      socket.emit('room:users', getRoomParticipants(roomId) as RoomUser[])
    })

    socket.on('call:ring', ({ toUid, meetingId, callerName, callerPhoto }) => {
      const caller = findPresenceBySocketId(socket.id)
      if (!caller) return
      const target = presence.get(toUid)
      if (!target || target.sockets.size === 0) {
        socket.emit('call:unavailable', { toUid })
        return
      }
      for (const sid of target.sockets) {
        io.to(sid).emit('call:incoming', {
          fromUid: caller.uid,
          fromName: callerName,
          fromPhoto: callerPhoto,
          meetingId,
        })
      }
    })

    socket.on('call:answer', ({ toUid, meetingId }) => {
      const answerer = findPresenceBySocketId(socket.id)
      if (!answerer) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) {
        io.to(sid).emit('call:answered', { meetingId, byUid: answerer.uid })
      }
    })

    socket.on('call:decline', ({ toUid }) => {
      const decliner = findPresenceBySocketId(socket.id)
      if (!decliner) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) {
        io.to(sid).emit('call:declined', { byUid: decliner.uid, byName: decliner.entry.user.displayName })
      }
    })

    socket.on('call:cancel', ({ toUid }) => {
      const canceller = findPresenceBySocketId(socket.id)
      if (!canceller) return
      const target = presence.get(toUid)
      if (!target) return
      for (const sid of target.sockets) {
        io.to(sid).emit('call:cancelled', { byUid: canceller.uid })
      }
    })

    socket.on('room:leave', () => handleRoomLeave(socket.id))
    socket.on('disconnect', () => {
      handleRoomLeave(socket.id)
      handlePresenceDisconnect(socket.id)
    })

    socket.on('chat:send', ({ roomId, text }) => {
      const sanitizedText = text.trim().slice(0, 2000)
      if (!sanitizedText) return

      const participants = getRoomParticipants(roomId)
      const sender = participants.find(p => p.socketId === socket.id)
      if (!sender) return

      io.to(roomId).emit('chat:message', {
        id: `${Date.now()}-${socket.id}`,
        roomId,
        userId: sender.uid,
        userName: sender.displayName,
        userPhoto: sender.photoURL,
        text: sanitizedText,
        timestamp: Date.now(),
      })
    })

    socket.on('dm:send', ({ toUid, text }) => {
      const sanitizedText = text.trim().slice(0, 2000)
      if (!sanitizedText) return

      const senderPresence = findPresenceBySocketId(socket.id)
      if (!senderPresence) return
      const sender = senderPresence.entry.user

      const recipientPresence = presence.get(toUid)

      const payload: ChatMessage = {
        id: `${Date.now()}-${socket.id}-dm`,
        roomId: 'dm',
        userId: sender.uid,
        userName: sender.displayName,
        userPhoto: sender.photoURL,
        text: sanitizedText,
        timestamp: Date.now(),
        toUserId: toUid,
        toUserName: recipientPresence?.user.displayName,
      }

      // Deliver to recipient if online; otherwise queue for later
      if (recipientPresence) {
        for (const sid of recipientPresence.sockets) {
          io.to(sid).emit('dm:message', payload)
        }
      }
      else {
        const queued = offlineDmQueue.get(toUid) ?? []
        offlineDmQueue.set(toUid, [...queued, payload])
      }
      for (const sid of senderPresence.entry.sockets) {
        io.to(sid).emit('dm:message', payload)
      }
    })

    socket.on('webrtc:offer', ({ to, offer }) => {
      socket.to(to).emit('webrtc:offer', { from: socket.id, offer })
    })

    socket.on('webrtc:answer', ({ to, answer }) => {
      socket.to(to).emit('webrtc:answer', { from: socket.id, answer })
    })

    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate })
    })
  })

  function handleRoomLeave(socketId: string) {
    const { roomId, participant } = leaveRoom(socketId)
    if (roomId && participant) {
      io.to(roomId).emit('user:left', socketId)
    }
  }
}

// ─── Production: intercept HttpServer.prototype.listen ───────────────────────
// Nitro 2.13 node-server.mjs creates the HTTP server and calls server.listen()
// directly, without firing nitroApp.hooks.callHook('listen', ...).
// This plugin runs as part of useNitroApp() BEFORE server.listen() is called,
// so we can capture the server by patching the prototype.
if (process.env.NODE_ENV === 'production') {
  const _origListen = NodeHttpServer.prototype.listen
  NodeHttpServer.prototype.listen = function (this: any, ...args: any[]) {
    // Restore immediately so only one server is captured
    NodeHttpServer.prototype.listen = _origListen

    const capturedServer = this
    const lastIdx = args.length - 1

    if (typeof args[lastIdx] === 'function') {
      // Wrap the listen callback to attach socket.io once the server is ready
      const origCb = args[lastIdx]
      args[lastIdx] = function (...cbArgs: any[]) {
        attachIoToServer(capturedServer)
        origCb.apply(this, cbArgs)
      }
    }
    else {
      // No callback — listen on the 'listening' event
      capturedServer.once('listening', () => attachIoToServer(capturedServer))
    }

    return _origListen.apply(this, args as any)
  }
}

// ─── Nitro plugin ─────────────────────────────────────────────────────────────
export default defineNitroPlugin((_nitroApp) => {
  if (ioInstance) return

  // Dev mode: Nitro 2.13 dev worker doesn't expose the HTTP server to plugins.
  // Start a standalone socket.io server on a separate port (default 4001).
  // The client connects directly to this port (NUXT_PUBLIC_SOCKET_URL=http://localhost:4001).
  if (process.env.NODE_ENV !== 'production') {
    const port = Number(process.env.SOCKET_PORT || 4001)
    const standalone = createServer()

    standalone.listen(port, () => {
      console.info('[socket.io] standalone server listening on port', port)
      attachIoToServer(standalone)
    })

    standalone.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        console.error(`[socket.io] port ${port} already in use — free it or set SOCKET_PORT env var`)
      }
      else {
        console.error('[socket.io] standalone server error:', err?.message)
      }
    })
  }
})
