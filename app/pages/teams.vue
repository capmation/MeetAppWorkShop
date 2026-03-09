<template>
  <div class="flex-1 px-4 md:px-8 py-8 flex flex-col gap-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold">Teams view</p>
        <h1 class="text-2xl font-semibold text-white">Centro de colaboracion</h1>
        <p class="text-sm text-slate-300/80">Conecta, chatea de forma privada y entra a las llamadas usando tu misma sala.</p>
      </div>
      <AppButton variant="ghost" size="sm" @click="router.push('/home')">
        Volver a reuniones
      </AppButton>
    </div>

    <div class="grid lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-[70vh]">
      <div class="flex flex-col gap-4">
        <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-white">Usuarios conectados</p>
            <span :class="['text-xs px-2 py-1 rounded-lg border', connectionStatus === 'connected' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' : 'text-slate-300 border-slate-500/40 bg-slate-500/10']">
              {{ connectionStatus === 'connected' ? 'En línea' : 'Desconectado' }}
            </span>
          </div>
          <UserList
            :users="presenceUsers"
            :selected="focusedUserUid"
            :unread="unreadCounts"
            @select="selectUser($event.uid)"
          />
        </div>

        <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex-1 overflow-hidden flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-white">Reuniones</p>
            <span class="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10">{{ meetings.length }}</span>
          </div>
          <div class="overflow-y-auto pr-1 flex flex-col gap-2">
            <p v-if="!meetings.length" class="text-slate-500 text-sm py-4 text-center">Sin reuniones cargadas.</p>
            <button
              v-for="meeting in meetings"
              :key="meeting.id"
              type="button"
              class="w-full text-left px-3 py-2 rounded-xl border bg-brand-800/50 border-white/5 hover:border-accent-400/40 transition"
              @click="callMeetingId = meeting.id"
            >
              <p class="text-sm font-semibold text-white truncate">{{ meeting.title }}</p>
              <p class="text-xs text-slate-400">{{ meeting.id }}</p>
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <TeamsChatPanel
          class="flex-1"
          :messages="chatMessages"
          :connected="connectionStatus === 'connected'"
          :room-id="callMeetingId"
          :target-user="targetUser"
          :on-call="callMeetingId !== null"
          @send="handleSendMessage"
          @call="handleJoinCall"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, computed, onMounted, onUnmounted } from 'vue'
import UserList from '~/components/teams/UserList.vue'
import TeamsChatPanel from '~/components/teams/TeamsChatPanel.vue'
import type { ChatMessage } from '~/types/chat.types'
import type { PresenceUser } from '~/types/socket.types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const router = useRouter()
const { user, idToken, loading: authLoading, refreshToken } = useAuth()
const { meetings, fetchMeetings } = useMeeting()
const { connect, disconnect, getSocket, isConnected } = useSocket()

const selectedMeetingId = ref('')
const presenceUsers = ref<PresenceUser[]>([])
const focusedUserUid = ref<string | null>(null)
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')
const dmMessages = ref<Record<string, ChatMessage[]>>({})
const unreadCounts = ref<Record<string, number>>({})
const callMeetingId = ref<string | null>(null)
const targetUser = computed(() => presenceUsers.value.find(u => u.uid === focusedUserUid.value) || null)
const chatMessages = computed(() => {
  if (!focusedUserUid.value) return []
  return dmMessages.value[focusedUserUid.value] ?? []
})
const currentStatus = ref<'online' | 'away'>('online')

let idleTimer: ReturnType<typeof setTimeout> | null = null
const IDLE_MS = 5 * 60 * 1000
let emitPresenceFn: ((status: 'online' | 'away') => Promise<void>) | null = null

function setFocusedToFirstAvailable() {
  if (!focusedUserUid.value && presenceUsers.value.length) {
    selectUser(presenceUsers.value[0].uid)
  }
  if (focusedUserUid.value && !presenceUsers.value.find(u => u.uid === focusedUserUid.value)) {
    const fallback = presenceUsers.value[0]?.uid ?? null
    if (fallback) selectUser(fallback)
    else focusedUserUid.value = null
  }
}

function handlePresenceList(users: PresenceUser[]) {
  const incoming = users
    .filter(u => u.uid !== user.value?.uid)
    .map(u => ({ ...u, status: u.status || 'online' }))
  const offlineKept = presenceUsers.value.filter(u => u.status === 'offline' && !incoming.find(n => n.uid === u.uid))
  presenceUsers.value = [...incoming, ...offlineKept]
  setFocusedToFirstAvailable()
  connectionStatus.value = 'connected'
}

function handlePresenceOnline(newUser: PresenceUser) {
  if (newUser.uid === user.value?.uid) return
  const existing = presenceUsers.value.find(u => u.uid === newUser.uid)
  if (existing) {
    presenceUsers.value = presenceUsers.value.map(u => u.uid === newUser.uid ? { ...newUser, status: newUser.status || 'online' } : u)
  }
  else {
    presenceUsers.value = [...presenceUsers.value, { ...newUser, status: newUser.status || 'online' }]
  }
  setFocusedToFirstAvailable()
}

function handlePresenceOffline(uid: string) {
  presenceUsers.value = presenceUsers.value.map(u => u.uid === uid ? { ...u, status: 'offline' } : u)
}

function handleDmMessage(message: ChatMessage) {
  if (!user.value) return
  const counterpartUid = message.userId === user.value.uid ? message.toUserId ?? null : message.userId
  if (!counterpartUid) return

  const existing = dmMessages.value[counterpartUid] ?? []
  dmMessages.value = {
    ...dmMessages.value,
    [counterpartUid]: [...existing, message],
  }

  if (!focusedUserUid.value) {
    focusedUserUid.value = counterpartUid
  }

  const isOwn = message.userId === user.value.uid
  if (!isOwn && focusedUserUid.value !== counterpartUid) {
    unreadCounts.value = {
      ...unreadCounts.value,
      [counterpartUid]: (unreadCounts.value[counterpartUid] ?? 0) + 1,
    }
  }
}

async function waitForAuthReady() {
  while (authLoading.value) {
    await nextTick()
  }
}

function cleanupRoomListeners() {
  if (!isConnected()) return
  const socket = getSocket()
  socket.off('presence:list', handlePresenceList)
  socket.off('presence:online', handlePresenceOnline)
  socket.off('presence:offline', handlePresenceOffline)
  socket.off('presence:status', handlePresenceOnline)
  socket.off('dm:message', handleDmMessage)
  socket.off('connect')
  socket.off('disconnect')
}

function leaveRoom() {
  cleanupRoomListeners()
  dmMessages.value = {}
  unreadCounts.value = {}
  connectionStatus.value = 'disconnected'
}

async function ensurePresenceConnection() {
  await waitForAuthReady()
  if (!user.value) return

  const socket = connect()
  cleanupRoomListeners()

  socket.on('presence:list', handlePresenceList)
  socket.on('presence:online', handlePresenceOnline)
  socket.on('presence:offline', handlePresenceOffline)
  socket.on('presence:status', handlePresenceOnline)
  socket.on('dm:message', handleDmMessage)
  emitPresenceFn = async (status: 'online' | 'away' = 'online') => {
    const token = idToken.value ?? await refreshToken()
    if (!token || !user.value) return
    socket.emit('presence:announce', {
      token,
      user: {
        uid: user.value.uid,
        displayName: user.value.displayName,
        photoURL: user.value.photoURL ?? null,
      },
      status,
    })
  }

  socket.on('connect', () => {
    connectionStatus.value = 'connected'
    presenceUsers.value = []
    focusedUserUid.value = null
  })

  socket.on('disconnect', () => {
    connectionStatus.value = 'disconnected'
    // Keep last known users/messages so chat history stays visible
  })

  await emitPresenceFn?.('online')
}

function handleSendMessage(text: string) {
  if (!targetUser.value || !isConnected()) return
  const socket = getSocket()
  socket.emit('dm:send', {
    toUid: targetUser.value.uid,
    text,
  })
  markActive()
}

function selectUser(uid: string) {
  focusedUserUid.value = uid
  unreadCounts.value = { ...unreadCounts.value, [uid]: 0 }
}

function handleJoinCall(meetingId?: string) {
  const target = meetingId ?? callMeetingId.value ?? selectedMeetingId.value
  if (!target) return
  router.push(`/meet/${target}`)
}

onMounted(async () => {
  await waitForAuthReady()
  try {
    await fetchMeetings()
    if (!selectedMeetingId.value && meetings.value.length) {
      selectedMeetingId.value = meetings.value[0].id
      callMeetingId.value = meetings.value[0].id
    }
  }
  catch {
    // swallow fetch error in this view; home already handles display.
  }

  await ensurePresenceConnection()
  startIdleWatcher()
})

onUnmounted(() => {
  leaveRoom()
  disconnect()
  stopIdleWatcher()
})

function markActive() {
  currentStatus.value = 'online'
  emitPresenceFn?.(currentStatus.value)
  resetIdleTimer()
}

function startIdleWatcher() {
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => window.addEventListener(evt, markActive))
  resetIdleTimer()
}

function stopIdleWatcher() {
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(evt => window.removeEventListener(evt, markActive))
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    currentStatus.value = 'away'
    emitPresenceFn?.('away')
  }, IDLE_MS)
}
</script>
