<template>
  <div class="h-screen bg-dark-900 flex flex-col overflow-hidden">

    <!-- Loading state -->
    <div v-if="pageState === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <AppLoader size="lg" class="text-brand-500 mx-auto mb-4" />
        <p class="text-slate-400 text-sm">Joining meeting...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="pageState === 'error'" class="flex-1 flex items-center justify-center px-4">
      <div class="text-center max-w-sm">
        <div class="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-600/30 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-white font-semibold mb-2">{{ errorMessage }}</h2>
        <AppButton variant="primary" @click="navigateTo('/home')">Back to Home</AppButton>
      </div>
    </div>

    <!-- In call -->
    <template v-else-if="pageState === 'incall'">
      <!-- Top bar -->
      <div class="h-14 bg-dark-800/80 border-b border-white/10 backdrop-blur-sm flex items-center px-4 shrink-0 gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-white font-semibold text-sm truncate">{{ meeting?.title ?? 'Meeting' }}</p>
          <p class="text-slate-400 text-xs">{{ participantCount }} participant{{ participantCount !== 1 ? 's' : '' }}</p>
        </div>
        <!-- Meeting ID badge -->
        <div class="hidden sm:flex items-center gap-1.5 bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5">
          <span class="text-slate-400 text-xs font-mono">{{ roomId }}</span>
        </div>
      </div>

      <!-- Main area: video + optional chat panel -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Video area -->
        <div :class="['flex-1 flex flex-col overflow-hidden transition-all duration-300', chatOpen ? 'hidden md:flex' : 'flex']">
          <VideoGrid
            :local-stream="localStream"
            :local-user="user"
            :remote-peers="remotePeersArray"
            :is-mic-on="isMicOn"
            class="flex-1"
          />
        </div>

        <!-- Chat panel -->
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="translate-x-full opacity-0"
          enter-to-class="translate-x-0 opacity-100"
          leave-active-class="transition duration-150"
          leave-from-class="translate-x-0 opacity-100"
          leave-to-class="translate-x-full opacity-0"
        >
          <div v-if="chatOpen" class="w-full md:w-80 shrink-0 flex flex-col">
            <ChatPanel
              :messages="messages"
              @send="sendMessage"
              @close="closeChat"
            />
          </div>
        </Transition>
      </div>

      <!-- Controls bar -->
      <MeetControls
        :is-mic-on="isMicOn"
        :is-camera-on="isCameraOn"
        :chat-open="chatOpen"
        :unread-count="unreadCount"
        :link-copied="linkCopied"
        @toggle-mic="toggleMic"
        @toggle-camera="toggleCamera"
        @toggle-chat="toggleChat"
        @copy-link="handleCopyLink"
        @leave="handleLeave"
      />
    </template>

    <!-- Camera permission error overlay -->
    <div
      v-if="permissionError"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
    >
      <div class="bg-dark-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
        <p class="text-white font-semibold mb-2">Camera/Mic access required</p>
        <p class="text-slate-400 text-sm mb-4">{{ permissionError }}</p>
        <AppButton variant="primary" class="w-full" @click="navigateTo('/home')">
          Go back
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RoomUser } from '~/types/socket.types'

definePageMeta({ layout: false, middleware: 'auth' })

const route = useRoute()
const roomId = route.params.id as string

const { user, idToken } = useAuth()
const { fetchMeeting } = useMeeting()
const { getSocket, connect, disconnect } = useSocket()
const { startMedia, toggleCamera, toggleMic, stopMedia, localStream, isCameraOn, isMicOn, permissionError } = useMedia()
const { peers, callPeer, listenToSignaling, stopListeningToSignaling, closeAllPeers } = useWebRTC()
const { sendMessage, listenToMessages, stopListening, messages, isOpen: chatOpen, unreadCount, toggleChat, closeChat, clearMessages } = useChat(roomId)
const { copy, copied: linkCopied } = useClipboard()

const meeting = ref<{ title: string } | null>(null)
const pageState = ref<'loading' | 'incall' | 'error'>('loading')
const errorMessage = ref('Meeting not found.')
const roomUsers = ref<RoomUser[]>([])

const remotePeersArray = computed(() => Array.from(peers.value.values()))
const participantCount = computed(() => 1 + remotePeersArray.value.length)

async function handleCopyLink() {
  const origin = window.location.origin
  await copy(`${origin}/meet/${roomId}`)
}

async function handleLeave() {
  getSocket().emit('room:leave')
  cleanup()
  await navigateTo('/home')
}

function cleanup() {
  stopListeningToSignaling()
  stopListening()
  closeAllPeers()
  stopMedia()
  clearMessages()
  disconnect()
}

onMounted(async () => {
  // 1. Verify meeting exists
  const meetingData = await fetchMeeting(roomId)
  if (!meetingData) {
    errorMessage.value = 'Meeting not found or you do not have access.'
    pageState.value = 'error'
    return
  }
  meeting.value = meetingData

  // 2. Get camera/mic
  let stream: MediaStream
  try {
    stream = await startMedia()
  }
  catch {
    pageState.value = 'error'
    errorMessage.value = 'Camera or microphone access is required to join this meeting.'
    return
  }

  // 3. Connect socket
  const socket = connect()
  listenToMessages()

  // 4. Listen for room events
  socket.on('room:users', async (users: RoomUser[]) => {
    roomUsers.value = users
    pageState.value = 'incall'

    // Call all existing participants (we are the newcomer)
    for (const remoteUser of users) {
      if (remoteUser.socketId !== socket.id) {
        await callPeer(remoteUser, stream)
      }
    }
  })

  socket.on('user:joined', async (remoteUser: RoomUser) => {
    roomUsers.value.push(remoteUser)
    // The new user will send us an offer; we wait via listenToSignaling
  })

  socket.on('user:left', (socketId: string) => {
    roomUsers.value = roomUsers.value.filter(u => u.socketId !== socketId)
  })

  // 5. Listen to WebRTC signaling
  listenToSignaling(stream, roomUsers)

  // 6. Join the room
  socket.emit('room:join', {
    roomId,
    token: idToken.value!,
    user: {
      uid: user.value!.uid,
      displayName: user.value!.displayName,
      photoURL: user.value!.photoURL,
    },
  })
})

onUnmounted(() => {
  cleanup()
})

// Handle browser tab close
if (process.client) {
  window.addEventListener('beforeunload', cleanup)
  onUnmounted(() => window.removeEventListener('beforeunload', cleanup))
}
</script>
