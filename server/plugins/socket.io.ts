import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, RoomUser } from '~/types/socket.types'
import { joinRoom, leaveRoom, getRoomParticipants, getRoomSize, MAX_ROOM_SIZE } from '../utils/room'
import { getAdminAuth } from '../utils/firebase-admin'

// Prevent double registration on hot reloads
let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null

function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.engine.on('connection_error', (err) => {
    console.warn('[socket.io] connection error', err.message)
  })

  io.on('connection', (socket) => {
    console.info('[socket.io] client connected', socket.id)

    // ── room:join ────────────────────────────────────────────────────────────
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

    // ── room:leave ───────────────────────────────────────────────────────────
    socket.on('room:leave', () => handleDisconnect(socket.id))

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => handleDisconnect(socket.id))

    // ── chat:send ────────────────────────────────────────────────────────────
    socket.on('chat:send', ({ roomId, text }) => {
      const sanitizedText = text.trim().slice(0, 2000)
      if (!sanitizedText) return

      const participants = getRoomParticipants(roomId)
      const sender = participants.find(p => p.socketId === socket.id)
      if (!sender) return

      const message = {
        id: `${Date.now()}-${socket.id}`,
        roomId,
        userId: sender.uid,
        userName: sender.displayName,
        userPhoto: sender.photoURL,
        text: sanitizedText,
        timestamp: Date.now(),
      }
      io.to(roomId).emit('chat:message', message)
    })

    // ── WebRTC signaling ─────────────────────────────────────────────────────
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

export default defineNitroPlugin((nitroApp) => {
  if (ioInstance) return

  const io = new Server<ClientToServerEvents, ServerToClientEvents>({
    path: '/socket.io',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  })
  ioInstance = io
  if (!io?.engine?.on) {
    console.error('[socket.io] engine missing; skipping socket setup')
    return
  }
  setupSocketHandlers(io)

  // Nitro 2.13 / Nuxt 4: attach socket.io once the HTTP server is listening
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(nitroApp as any).hooks.hook('listen', (listenOptions: any) => {
    const nodeServer = listenOptions?.server ?? listenOptions
    if (nodeServer?.on) {
      console.info('[socket.io] attaching to nitro HTTP server')
      io.attach(nodeServer)
    }
  })
})
