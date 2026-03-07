import { createServer, Server as NodeHttpServer } from 'node:http'
import { defineNitroPlugin } from 'nitropack/runtime'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, RoomUser } from '../../app/types/socket.types'
import { joinRoom, leaveRoom, getRoomParticipants, getRoomSize, MAX_ROOM_SIZE } from '../utils/room'
import { getAdminAuth } from '../utils/firebase-admin'

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null

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

  io.on('connection', (socket) => {
    console.info('[socket.io] client connected', socket.id)

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

    socket.on('room:leave', () => handleDisconnect(socket.id))
    socket.on('disconnect', () => handleDisconnect(socket.id))

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

  function handleDisconnect(socketId: string) {
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
