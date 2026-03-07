import { io, type Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '~/types/socket.types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// Singleton socket instance shared across composable calls
let socket: AppSocket | null = null

export const useSocket = () => {
  const config = useRuntimeConfig()

  function getSocket(): AppSocket {
    if (!socket) {
      socket = io(config.public.socketUrl, {
        autoConnect: false,
        withCredentials: true,
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      })
    }
    return socket
  }

  function connect(): AppSocket {
    const s = getSocket()
    if (!s.connected) s.connect()
    return s
  }

  function disconnect(): void {
    if (socket?.connected) {
      socket.disconnect()
    }
    socket = null
  }

  function isConnected(): boolean {
    return socket?.connected ?? false
  }

  return { getSocket, connect, disconnect, isConnected }
}
