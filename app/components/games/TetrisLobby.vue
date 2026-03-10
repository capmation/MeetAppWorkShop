<template>
  <div class="flex flex-col gap-6 max-w-lg mx-auto w-full">

    <!-- Your profile card -->
    <div class="rounded-2xl bg-brand-800/40 border border-white/10 p-5 flex items-center gap-4">
      <AppAvatar :name="user?.displayName || 'You'" :photo="user?.photoURL" size="md" />
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-white truncate">{{ user?.displayName || 'Anonymous' }}</p>
        <p class="text-xs text-slate-400">Ready to battle?</p>
      </div>
      <span class="inline-flex items-center gap-1.5 text-xs text-accent-400 font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
        Online
      </span>
    </div>

    <!-- Countdown overlay (shown when match is found) -->
    <Transition name="t-fade">
      <div
        v-if="matchFound"
        class="rounded-2xl bg-brand-900/95 border border-accent-400/30 p-8 text-center"
      >
        <p class="text-slate-400 text-sm mb-2">Match found! Starting in…</p>
        <p class="text-7xl font-black text-accent-400 font-mono leading-none mb-4">
          {{ countdown > 0 ? countdown : '🎮' }}
        </p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <div
            v-for="p in pendingPlayers"
            :key="p.uid"
            class="flex items-center gap-2 bg-brand-800/60 border border-white/10 px-3 py-1.5 rounded-xl"
          >
            <AppAvatar :name="p.displayName" :photo="p.photoURL" size="xs" />
            <span class="text-sm font-medium text-white">{{ p.displayName }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Queue section -->
    <div v-if="!matchFound" class="rounded-2xl bg-brand-800/40 border border-white/10 overflow-hidden">
      <div class="px-5 py-4 border-b border-white/5">
        <h3 class="font-semibold text-white flex items-center gap-2">
          <span>⚡</span> Public Queue
        </h3>
        <p class="text-xs text-slate-400 mt-0.5">2–4 players — match starts automatically</p>
      </div>

      <div class="p-5">
        <!-- Queue status bar -->
        <div class="flex items-center gap-3 mb-5">
          <div class="flex-1 h-2 bg-brand-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-accent-400 rounded-full transition-all duration-500"
              :style="{ width: `${(queueSize / 4) * 100}%` }"
            />
          </div>
          <span class="text-sm font-mono text-white shrink-0">{{ queueSize }}/4</span>
        </div>

        <!-- Join / Leave queue -->
        <button
          v-if="!inQueue"
          class="w-full btn-primary py-3 text-base font-semibold"
          :disabled="joining"
          @click="onJoinQueue"
        >
          <span v-if="joining" class="flex items-center justify-center gap-2">
            <AppLoader size="xs" /> Joining…
          </span>
          <span v-else>🎮 Join Queue</span>
        </button>

        <div v-else class="flex flex-col items-center gap-3">
          <div class="flex items-center gap-2 text-accent-400">
            <span class="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <span class="text-sm font-medium">Searching for opponents…</span>
          </div>
          <p v-if="queueSize >= 2" class="text-xs text-slate-400">
            {{ 4 - queueSize }} more player(s) can join · match starts in ~10s
          </p>
          <p v-else class="text-xs text-slate-400">Waiting for at least one more player</p>
          <button class="btn-ghost px-5 py-2 text-sm" @click="onLeaveQueue">
            Leave Queue
          </button>
        </div>
      </div>
    </div>

    <!-- Online players in lobby -->
    <div v-if="!matchFound && lobbyPlayers.length > 0" class="rounded-2xl bg-brand-800/40 border border-white/10 overflow-hidden">
      <div class="px-5 py-4 border-b border-white/5">
        <h3 class="font-semibold text-white flex items-center gap-2">
          <span>👥</span> In Lobby
          <span class="text-xs text-slate-500 font-normal ml-1">({{ lobbyPlayers.length }})</span>
        </h3>
      </div>
      <ul class="divide-y divide-white/5">
        <li
          v-for="p in lobbyPlayers"
          :key="p.uid"
          class="flex items-center gap-3 px-5 py-3"
        >
          <AppAvatar :name="p.displayName" :photo="p.photoURL" size="xs" />
          <span class="flex-1 text-sm text-white truncate">{{ p.displayName }}</span>
          <span
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              p.inQueue ? 'bg-accent-500/20 text-accent-400' : 'bg-white/5 text-slate-500',
            ]"
          >
            {{ p.inQueue ? 'In Queue' : 'Browsing' }}
          </span>
        </li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { TetrisLobbyPlayer, TetrisMatchPlayer } from '~/types/socket.types'

const emit = defineEmits<{
  matchStart: [{ matchId: string; players: TetrisMatchPlayer[] }]
}>()

const { user } = useAuth()
const { getSocket, connect } = useSocket()
const mp = useTetrisMultiplayer()

const lobbyPlayers = ref<TetrisLobbyPlayer[]>([])
const queueSize = ref(0)
const inQueue = ref(false)
const joining = ref(false)
const matchFound = ref(false)
const countdown = ref(3)
const pendingPlayers = ref<TetrisMatchPlayer[]>([])

// Filter self out of lobby display
const otherLobbyPlayers = computed(() =>
  lobbyPlayers.value.filter(p => p.uid !== user.value?.uid),
)

// Show all players including self
const allLobbyPlayers = computed(() => lobbyPlayers.value)

// Use computed to expose the right list
const visibleLobbyPlayers = computed(() =>
  lobbyPlayers.value.filter(p => p.uid !== user.value?.uid),
)

// Alias for template
const _lobbyPlayers = computed(() => lobbyPlayers.value.filter(p => p.uid !== user.value?.uid))

// expose as lobbyPlayers in template via computed
const lobbyPlayersComputed = _lobbyPlayers

function setupSocketListeners() {
  const s = getSocket()

  s.on('tetris:lobby-state', (players) => {
    lobbyPlayers.value = players
  })

  s.on('tetris:queue-size', (count) => {
    queueSize.value = count
  })

  s.on('tetris:match-found', ({ matchId, players }) => {
    matchFound.value = true
    pendingPlayers.value = players
    mp.matchId.value = matchId
    mp.matchPlayers.value = players
  })

  s.on('tetris:countdown', (n) => {
    countdown.value = n
  })

  s.on('tetris:match-start', (matchId) => {
    emit('matchStart', { matchId, players: pendingPlayers.value })
  })
}

function teardownSocketListeners() {
  const s = getSocket()
  s.off('tetris:lobby-state')
  s.off('tetris:queue-size')
  s.off('tetris:match-found')
  s.off('tetris:countdown')
  s.off('tetris:match-start')
}

async function onJoinQueue() {
  joining.value = true
  try {
    await mp.joinLobby()
    await nextTick()
    mp.joinQueue()
    inQueue.value = true
  }
  finally {
    joining.value = false
  }
}

function onLeaveQueue() {
  mp.leaveQueue()
  inQueue.value = false
}

onMounted(async () => {
  setupSocketListeners()
  await mp.joinLobby()
})

onUnmounted(() => {
  teardownSocketListeners()
  if (!matchFound.value) {
    mp.leaveLobby()
  }
})
</script>

<script lang="ts">
// Re-export lobbyPlayers as the filtered list for the template
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-ghost {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium transition-all duration-150;
}
.t-fade-enter-active, .t-fade-leave-active { transition: opacity 0.3s ease; }
.t-fade-enter-from, .t-fade-leave-to { opacity: 0; }
</style>
