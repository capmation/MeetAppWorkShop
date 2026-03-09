<template>
  <div v-if="!pageReady" class="flex-1 flex items-center justify-center">
    <div class="flex flex-col items-center gap-4 text-slate-400">
      <AppLoader size="lg" />
      <p class="text-sm">Loading collaboration hub...</p>
    </div>
  </div>

  <div v-else class="flex-1 flex flex-col min-h-0">

    <!-- ── Mobile layout ── -->
    <div class="relative flex flex-col flex-1 min-h-0 overflow-hidden lg:hidden">

      <!-- List view (always rendered, slides left when chat opens) -->
      <div
        class="mobile-panel flex flex-col flex-1 min-h-0 px-4 py-6 gap-4 overflow-y-auto"
        :class="mobileChatOpen ? 'mobile-panel--hidden-left' : 'mobile-panel--visible'"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold">Teams</p>
            <h1 class="text-xl font-semibold text-white">Collaboration hub</h1>
          </div>
          <AppButton variant="ghost" size="sm" @click="router.push('/home')">
            ← Home
          </AppButton>
        </div>

        <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-white">Users</p>
            <span :class="['text-xs px-2 py-1 rounded-lg border', connectionStatus === 'connected' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' : 'text-slate-300 border-slate-500/40 bg-slate-500/10']">
              {{ connectionStatus === 'connected' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <UserList
            :users="usersForList"
            :selected="focusedUserUid"
            :unread="unreadCounts"
            @select="selectUserMobile($event.uid)"
          />
        </div>

        <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-white">Meetings</p>
            <span class="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10">{{ meetings.length }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <p v-if="!meetings.length" class="text-slate-500 text-sm py-4 text-center">No meetings loaded.</p>
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

      <!-- Chat view (slides in from right) -->
      <div
        class="mobile-panel absolute inset-0 flex flex-col bg-brand-950"
        :class="mobileChatOpen ? 'mobile-panel--visible' : 'mobile-panel--hidden-right'"
      >
        <div class="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-brand-900/80 shrink-0">
          <button type="button" class="text-slate-300 hover:text-white transition" @click="mobileChatOpen = false">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="min-w-0">
            <p class="text-white font-semibold text-sm truncate">{{ targetUser?.displayName ?? 'Chat' }}</p>
            <p class="text-xs" :class="targetUser?.status === 'online' ? 'text-emerald-400' : 'text-slate-500'">
              {{ targetUser?.status === 'online' ? 'Online' : targetUser?.status === 'away' ? 'Away' : 'Offline' }}
            </p>
          </div>
        </div>
        <TeamsChatPanel
          class="flex-1 min-h-0"
          :messages="chatMessages"
          :connected="connectionStatus === 'connected'"
          :room-id="callMeetingId"
          :target-user="targetUser"
          :call-enabled="callMeetingId !== null"
          @send="handleSendMessage"
          @call="handleJoinCall"
        />
      </div>

    </div>

    <!-- ── Desktop: side-by-side ── -->
    <div class="hidden lg:flex flex-1 min-h-0 px-8 py-8 flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400 font-semibold">Teams view</p>
          <h1 class="text-2xl font-semibold text-white">Collaboration hub</h1>
          <p class="text-sm text-slate-300/80">Connect, DM teammates, and jump into calls using your same room.</p>
        </div>
        <AppButton variant="ghost" size="sm" @click="router.push('/home')">
          Back to meetings
        </AppButton>
      </div>

      <div class="grid lg:grid-cols-[320px_1fr] gap-6 flex-1 min-h-0">
        <div class="flex flex-col gap-4 min-h-0">
          <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-white">Connected users</p>
              <span :class="['text-xs px-2 py-1 rounded-lg border', connectionStatus === 'connected' ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10' : 'text-slate-300 border-slate-500/40 bg-slate-500/10']">
                {{ connectionStatus === 'connected' ? 'Online' : 'Offline' }}
              </span>
            </div>
            <UserList
              :users="usersForList"
              :selected="focusedUserUid"
              :unread="unreadCounts"
              @select="selectUser($event.uid)"
            />
          </div>

          <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex-1 overflow-hidden flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-white">Meetings</p>
              <span class="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10">{{ meetings.length }}</span>
            </div>
            <div class="overflow-y-auto pr-1 flex flex-col gap-2">
              <p v-if="!meetings.length" class="text-slate-500 text-sm py-4 text-center">No meetings loaded.</p>
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

        <div class="flex flex-col min-h-0">
          <TeamsChatPanel
            class="flex-1"
            :messages="chatMessages"
            :connected="connectionStatus === 'connected'"
            :room-id="callMeetingId"
            :target-user="targetUser"
            :call-enabled="callMeetingId !== null"
            @send="handleSendMessage"
            @call="handleJoinCall"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import UserList from '~/components/teams/UserList.vue'
import TeamsChatPanel from '~/components/teams/TeamsChatPanel.vue'
import type { ChatMessage } from '~/types/chat.types'
import type { PresenceUser } from '~/types/socket.types'
import { useDmStore } from '~/stores/dm.store'

definePageMeta({ layout: 'default', middleware: 'auth' })

const router = useRouter()
const { user, idToken, loading: authLoading, refreshToken } = useAuth()
const { meetings, fetchMeetings } = useMeeting()
const { connect, getSocket, isConnected } = useSocket()
const dmStore = useDmStore()

const pageReady = ref(false)
const mobileChatOpen = ref(false)
const selectedMeetingId = ref('')
const presenceUsers = ref<PresenceUser[]>([])
const focusedUserUid = ref<string | null>(null)
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')
const callMeetingId = ref<string | null>(null)
const usersForList = computed(() => {
  const selfUid = user.value?.uid
  // Filter self out from presence list (race condition: self can arrive before user.value is set)
  const list: PresenceUser[] = presenceUsers.value.filter(u => u.uid !== selfUid)
  Object.entries(dmStore.userProfiles).forEach(([uid, profile]) => {
    if (uid === selfUid) return
    const existing = list.find(u => u.uid === uid)
    if (existing) {
      const merged = {
        ...existing,
        displayName: existing.displayName || profile.displayName,
        photoURL: existing.photoURL ?? profile.photoURL ?? null,
      }
      list.splice(list.indexOf(existing), 1, merged)
    }
    else {
      list.push({ uid, displayName: profile.displayName, photoURL: profile.photoURL ?? null, status: 'offline', socketIds: [] })
    }
  })
  // Deduplicate by uid (defensive)
  const seen = new Set<string>()
  return list.filter(u => seen.has(u.uid) ? false : seen.add(u.uid) && true)
})
const targetUser = computed(() => usersForList.value.find(u => u.uid === focusedUserUid.value) || null)
const chatMessages = computed(() => {
  if (!focusedUserUid.value) return []
  return dmStore.messagesByUser[focusedUserUid.value] ?? []
})
const unreadCounts = computed(() => dmStore.unreadByUser)
const currentStatus = ref<'online' | 'away'>('online')

const handleConnect = () => {
  connectionStatus.value = 'connected'
  presenceUsers.value = []
  focusedUserUid.value = null
}

const handleDisconnect = () => {
  connectionStatus.value = 'disconnected'
  // Keep last known users/messages so chat history stays visible
}

let idleTimer: ReturnType<typeof setTimeout> | null = null
const IDLE_MS = 5 * 60 * 1000
let emitPresenceFn: ((status: 'online' | 'away') => Promise<void>) | null = null

async function preloadAllUsers() {
  try {
    const token = idToken.value ?? await refreshToken()
    if (!token) return
    const users = await $fetch<{ uid: string; displayName: string; photoURL: string | null }[]>('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
    users?.forEach(u => dmStore.ensureKnownUser(u.uid, u.displayName ?? 'Unknown user', u.photoURL ?? null))
  }
  catch {
    // swallow preload errors; presence will still populate connected users
  }
}

function setFocusedToFirstAvailable() {
  if (!focusedUserUid.value && usersForList.value.length) {
    const first = usersForList.value[0]
    if (first) selectUser(first.uid)
  }
  if (focusedUserUid.value && !usersForList.value.find(u => u.uid === focusedUserUid.value)) {
    const fallback = usersForList.value[0]?.uid ?? null
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
  dmStore.handleIncoming(message, user.value.uid)
  if (!focusedUserUid.value) focusedUserUid.value = counterpartUid
  if (focusedUserUid.value === counterpartUid) dmStore.clearForUser(counterpartUid)
}

function waitForAuthReady(timeoutMs = 8000): Promise<void> {
  if (!authLoading.value) return Promise.resolve()
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs)
    const stop = watch(authLoading, (loading) => {
      if (!loading) {
        clearTimeout(timeout)
        stop()
        resolve()
      }
    })
  })
}

function cleanupRoomListeners() {
  if (!isConnected()) return
  const socket = getSocket()
  socket.off('presence:list', handlePresenceList)
  socket.off('presence:online', handlePresenceOnline)
  socket.off('presence:offline', handlePresenceOffline)
  socket.off('presence:status', handlePresenceOnline)
  socket.off('dm:message', handleDmMessage)
  socket.off('connect', handleConnect)
  socket.off('disconnect', handleDisconnect)
}

function leaveRoom() {
  cleanupRoomListeners()
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

  socket.on('connect', handleConnect)

  socket.on('disconnect', handleDisconnect)

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
  dmStore.setActiveUser(uid)
}

function selectUserMobile(uid: string) {
  selectUser(uid)
  mobileChatOpen.value = true
}

function handleJoinCall(meetingId?: string) {
  const target = meetingId ?? callMeetingId.value ?? selectedMeetingId.value
  if (!target) return
  router.push(`/meet/${target}`)
}

onMounted(async () => {
  await waitForAuthReady()
  await preloadAllUsers()
  if (user.value?.uid) dmStore.hydrate(user.value.uid)
  if (focusedUserUid.value) dmStore.setActiveUser(focusedUserUid.value)
  try {
    await fetchMeetings()
    if (!selectedMeetingId.value && meetings.value.length) {
      const first = meetings.value.at(0)
      if (first) {
        selectedMeetingId.value = first.id
        callMeetingId.value = first.id
      }
    }
  }
  catch {
    // swallow fetch error in this view; home already handles display.
  }

  await ensurePresenceConnection()
  startIdleWatcher()
  pageReady.value = true
})

onUnmounted(() => {
  leaveRoom()
  dmStore.setActiveUser(null)
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

<style scoped>
.mobile-panel {
  transition: transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.mobile-panel--visible {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.mobile-panel--hidden-right {
  transform: translateX(100%);
  opacity: 0.5;
  pointer-events: none;
}

.mobile-panel--hidden-left {
  transform: translateX(-30%);
  opacity: 0;
  pointer-events: none;
}
</style>
