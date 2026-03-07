import type { RoomUser } from '~/types/socket.types'
import { useSocket } from '~/composables/useSocket'

function buildIceServers(): RTCIceServer[] {
  const config = useRuntimeConfig()
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]

  // TURN server via env vars (required for production behind NAT)
  // Free tier at https://www.metered.ca/ (50 GB/month, no credit card)
  // Set in Render: NUXT_PUBLIC_TURN_HOST, NUXT_PUBLIC_TURN_USERNAME, NUXT_PUBLIC_TURN_CREDENTIAL
  const turnHost = (config.public as any).turnHost as string | undefined
  const turnUsername = (config.public as any).turnUsername as string | undefined
  const turnCredential = (config.public as any).turnCredential as string | undefined

  if (turnHost && turnUsername && turnCredential) {
    // Metered.ca STUN
    servers.push({ urls: `stun:stun.relay.metered.ca:80` })
    // All 4 TURN configurations for maximum NAT traversal
    servers.push({
      urls: [
        `turn:${turnHost}:80`,
        `turn:${turnHost}:80?transport=tcp`,
        `turn:${turnHost}:443`,
        `turns:${turnHost}:443?transport=tcp`,
      ],
      username: turnUsername,
      credential: turnCredential,
    })
  }

  return servers
}

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

  // Buffer ICE candidates received before setRemoteDescription is called
  const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()

  function createPeerConnection(socketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: buildIceServers() })

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

  async function flushPendingCandidates(socketId: string, pc: RTCPeerConnection) {
    const pending = pendingCandidates.get(socketId) ?? []
    pendingCandidates.delete(socketId)
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
      catch { /* non-fatal */ }
    }
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
    // Flush any ICE candidates that arrived before setRemoteDescription
    await flushPendingCandidates(from, pc)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    getSocket().emit('webrtc:answer', { to: from, answer })
  }

  async function handleAnswer(from: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = peers.value.get(from)
    if (!peer) return
    await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
    // Flush any ICE candidates that arrived before setRemoteDescription
    await flushPendingCandidates(from, peer.connection)
  }

  async function handleIceCandidate(from: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = peers.value.get(from)

    // Buffer the candidate if the peer connection isn't ready yet
    if (!peer || !peer.connection.remoteDescription) {
      const pending = pendingCandidates.get(from) ?? []
      pending.push(candidate)
      pendingCandidates.set(from, pending)
      return
    }

    try {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    catch { /* non-fatal */ }
  }

  function closePeer(socketId: string): void {
    const peer = peers.value.get(socketId)
    if (!peer) return
    peer.connection.close()
    peers.value.delete(socketId)
    pendingCandidates.delete(socketId)
  }

  function closeAllPeers(): void {
    peers.value.forEach(peer => peer.connection.close())
    peers.value.clear()
    pendingCandidates.clear()
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
