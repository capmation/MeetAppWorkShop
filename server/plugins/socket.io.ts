import { createServer } from 'node:http'
import { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, RoomUser } from '~/types/socket.types'
import { joinRoom, leaveRoom, getRoomParticipants, getRoomSize, MAX_ROOM_SIZE } from '../utils/room'
import { getAdminAuth } from '../utils/firebase-admin'

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null
console.info('[socket.io] plugin file loaded')

function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  if (io.engine?.on) {
    io.engine.on('connection_error', (err) => {
      console.warn('[socket.io] connection error', err.message)
    })
  }

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

  const origins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean)
    || ['http://localhost:3000', 'http://localhost:3001']

  const baseFallbackPort = Number(process.env.SOCKET_PORT || process.env.NUXT_PUBLIC_SOCKET_PORT || 4001)
  const globalAny = globalThis as any

  const maybeServer = (nitroApp as any).h3App?.server || (nitroApp as any).server
  const devServer = (nitroApp as any).devServer
  const devHttpServer = devServer?.server || devServer?.viteServer?.httpServer
  console.info('[socket.io] initial server snapshot', {
    hasH3Server: Boolean((nitroApp as any).h3App?.server),
    hasServer: Boolean((nitroApp as any).server),
    hasHooks: Boolean((nitroApp as any).hooks),
    hasOn: Boolean(maybeServer?.on),
    devServerKeys: devServer ? Object.keys(devServer) : [],
    hasDevHttp: Boolean(devHttpServer?.on),
  })

  if (devHttpServer?.on) {
    attachTo(devHttpServer, 'dev-http-server')
  }

  function attachTo(server: any, source: string) {
    if (ioInstance) return
    if (!server?.on) {
      // In dev, Nitro 2.13 doesn't expose the HTTP server to plugins — standalone fallback is expected
      if (process.env.NODE_ENV !== 'production') {
        console.info('[socket.io] dev mode: starting standalone socket server on port', baseFallbackPort)
        startStandalone()
      }
      else {
        console.error('[socket.io] production:', source, '- no HTTP server found, socket.io will not work')
      }
      return
    }
    console.info('[socket.io] attaching to HTTP server via', source)
    ioInstance = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
      path: '/socket.io',
      cors: {
        origin: origins,
        credentials: true,
      },
      pingInterval: 10_000,
      pingTimeout: 5_000,
    })
    setupSocketHandlers(ioInstance)
  }

  // Attach once the Nitro HTTP server is ready
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(nitroApp as any).hooks.hook('listen', (listener: any) => {
    console.info('[socket.io] listen hook fired', Boolean(listener), Object.keys(listener || {}))
    const nodeServer = listener?.server ?? listener
    attachTo(nodeServer, 'listen')
  })

  // Also try afterListen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(nitroApp as any).hooks.hook('afterListen', (listener: any) => {
    console.info('[socket.io] afterListen hook fired', Boolean(listener), Object.keys(listener || {}))
    const nodeServer = listener?.server ?? listener
    attachTo(nodeServer, 'afterListen')
  })


  // Fallback: try attaching after Nitro is ready using h3App.server
  nitroApp.hooks.hookOnce('ready', () => {
    if (ioInstance) return
    const fallbackServer = (nitroApp as any).h3App?.server || (nitroApp as any).server
    attachTo(fallbackServer, 'ready')
  })

  // Final fallback: delayed attach attempt in dev
  setTimeout(() => {
    if (ioInstance) return
    const delayedServer = (nitroApp as any).h3App?.server || (nitroApp as any).server
    attachTo(delayedServer, 'timeout-1s')
  }, 1000)

  // In dev, attempt a later attach to dev http server (vite) if available
  if (devHttpServer?.on) {
    setTimeout(() => {
      attachTo(devHttpServer, 'dev-http-server-late')
    }, 500)
  }

  function startStandalone(port = baseFallbackPort) {
    if (ioInstance) return
    if (globalAny.__ioHttpServer) {
      attachTo(globalAny.__ioHttpServer, 'standalone-reuse')
      return
    }
    try {
      const httpServer = createServer((req, res) => {
        res.writeHead(200)
        res.end('ok')
      })
      httpServer.listen(port, () => {
        console.info('[socket.io] standalone server listening on', port)
        globalAny.__ioHttpServer = httpServer
        attachTo(httpServer, 'standalone')
      })
      httpServer.on('error', (err: any) => {
        if (err?.code === 'EADDRINUSE') {
          console.error('[socket.io] standalone server port in use', port, '- stop and free this port or set SOCKET_PORT')
          return
        }
        console.error('[socket.io] standalone server error', err?.message || err)
      })
    }
    catch (err: any) {
      console.error('[socket.io] failed to start standalone server', err?.message || err)
    }
  }
})
