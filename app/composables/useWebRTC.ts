import type { RoomUser } from '~/types/socket.types'
import { useSocket } from '~/composables/useSocket'

// Free STUN servers (no cost, no account needed)
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
]

export interface RemotePeer {
  socketId: string
  uid: string
  displayName: string
  photoURL: string | null
  stream: MediaStream | null
  connection: RTCPeerConnection
}

export const useWebRTC = () => {
  const peers = ref<Map<string, RemotePeer>>(new Map())
  const { getSocket } = useSocket()

  function createPeerConnection(socketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        getSocket().emit('webrtc:ice-candidate', { to: socketId, candidate: candidate.toJSON() })
      }
    }

    pc.ontrack = ({ streams }) => {
      const peer = peers.value.get(socketId)
      if (peer && streams[0]) {
        peers.value.set(socketId, { ...peer, stream: streams[0] })
      }
    }

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        closePeer(socketId)
      }
    }

    return pc
  }

  // Called when WE initiate the call to a new peer
  async function callPeer(remoteUser: RoomUser, localStream: MediaStream): Promise<void> {
    const pc = createPeerConnection(remoteUser.socketId)

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    peers.value.set(remoteUser.socketId, {
      socketId: remoteUser.socketId,
      uid: remoteUser.uid,
      displayName: remoteUser.displayName,
      photoURL: remoteUser.photoURL,
      stream: null,
      connection: pc,
    })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    getSocket().emit('webrtc:offer', { to: remoteUser.socketId, offer })
  }

  // Called when we RECEIVE an offer
  async function handleOffer(
    from: string,
    offer: RTCSessionDescriptionInit,
    remoteUser: RoomUser,
    localStream: MediaStream,
  ): Promise<void> {
    const pc = createPeerConnection(from)

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    peers.value.set(from, {
      socketId: from,
      uid: remoteUser.uid,
      displayName: remoteUser.displayName,
      photoURL: remoteUser.photoURL,
      stream: null,
      connection: pc,
    })

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    getSocket().emit('webrtc:answer', { to: from, answer })
  }

  async function handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = peers.value.get(from)
    if (!peer) return
    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async function handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = peers.value.get(from)
    if (!peer) return
    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    catch {
      // ICE candidate errors are non-fatal
    }
  }

  function closePeer(socketId: string): void {
    const peer = peers.value.get(socketId)
    if (!peer) return
    peer.connection.close()
    peers.value.delete(socketId)
  }

  function closeAllPeers(): void {
    peers.value.forEach(peer => peer.connection.close())
    peers.value.clear()
  }

  function listenToSignaling(localStream: MediaStream, roomUsers: Ref<RoomUser[]>): void {
    const socket = getSocket()

    socket.on('webrtc:offer', async ({ from, offer }) => {
      const remoteUser = roomUsers.value.find(u => u.socketId === from)
      if (!remoteUser) return
      await handleOffer(from, offer, remoteUser, localStream)
    })

    socket.on('webrtc:answer', async ({ from, answer }) => {
      await handleAnswer(from, answer)
    })

    socket.on('webrtc:ice-candidate', async ({ from, candidate }) => {
      await handleIceCandidate(from, candidate)
    })

    socket.on('user:left', (socketId) => {
      closePeer(socketId)
    })
  }

  function stopListeningToSignaling(): void {
    const socket = getSocket()
    socket.off('webrtc:offer')
    socket.off('webrtc:answer')
    socket.off('webrtc:ice-candidate')
    socket.off('user:left')
  }

  return {
    peers,
    callPeer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closePeer,
    closeAllPeers,
    listenToSignaling,
    stopListeningToSignaling,
  }
}
