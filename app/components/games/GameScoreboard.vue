<template>
  <div class="rounded-2xl bg-brand-800/40 border border-white/10 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <h3 class="font-semibold text-white flex items-center gap-2">
        <span>🏆</span> Leaderboard
      </h3>
      <button
        class="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
        :disabled="loading"
        @click="load"
      >
        <span v-if="loading" class="flex items-center gap-1">
          <AppLoader size="xs" /> Loading
        </span>
        <span v-else>↺ Refresh</span>
      </button>
    </div>

    <!-- Skeleton loading (first load) -->
    <div v-if="loading && scores.length === 0" class="divide-y divide-white/5">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-3 px-5 py-3"
      >
        <div class="w-7 h-4 rounded bg-white/5 animate-pulse shrink-0" />
        <div class="w-7 h-7 rounded-full bg-white/5 animate-pulse shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3 rounded bg-white/5 animate-pulse w-3/4" />
          <div class="h-2.5 rounded bg-white/5 animate-pulse w-1/2" />
        </div>
        <div class="w-16 h-3.5 rounded bg-white/5 animate-pulse shrink-0" />
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-10 px-4 text-center">
      <p class="text-2xl mb-3">⚠️</p>
      <p class="text-sm font-medium text-white mb-1">Could not load scores</p>
      <p class="text-xs text-slate-500 mb-4">{{ error }}</p>
      <button
        class="text-xs text-accent-400 hover:text-accent-300 underline underline-offset-2 transition-colors"
        @click="load"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="scores.length === 0" class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p class="text-3xl mb-3">🎯</p>
      <p class="text-sm font-medium text-white mb-1">No scores yet</p>
      <p class="text-xs text-slate-400">Be the first to play and set a record!</p>
    </div>

    <!-- Score list -->
    <ul v-else class="divide-y divide-white/5">
      <li
        v-for="(entry, i) in scores"
        :key="entry.uid"
        :class="[
          'flex items-center gap-3 px-5 py-3 transition-colors',
          entry.uid === currentUid ? 'bg-accent-500/10' : 'hover:bg-white/5',
        ]"
      >
        <!-- Rank -->
        <span :class="['w-7 text-center text-sm font-bold shrink-0', rankClass(i)]">
          {{ rankEmoji(i) }}
        </span>

        <!-- Avatar -->
        <AppAvatar :name="entry.displayName" :photo="entry.photoURL" size="xs" />

        <!-- Name + meta -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">
            {{ entry.displayName }}
            <span v-if="entry.uid === currentUid" class="text-[10px] text-accent-400 ml-1 font-normal">(you)</span>
          </p>
          <p class="text-[11px] text-slate-500 leading-tight">Lv.{{ entry.level }} · {{ entry.lines }} lines</p>
        </div>

        <!-- Score -->
        <span class="font-mono text-sm font-bold text-white shrink-0">
          {{ entry.score.toLocaleString() }}
        </span>
      </li>
    </ul>

    <!-- Subtle refresh indicator while list is already showing -->
    <div v-if="loading && scores.length > 0" class="flex items-center justify-center gap-2 px-5 py-2.5 border-t border-white/5">
      <AppLoader size="xs" class="text-slate-500" />
      <span class="text-xs text-slate-500">Updating…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameScore } from '~/types/games.types'

const props = defineProps<{
  gameId: string
  currentUid?: string
}>()

const { getTopScores } = useGames()
const { getSocket, connect } = useSocket()

const scores = ref<GameScore[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function rankEmoji(i: number): string {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `#${i + 1}`
}

function rankClass(i: number): string {
  if (i === 0) return 'text-yellow-400'
  if (i === 1) return 'text-slate-300'
  if (i === 2) return 'text-orange-400'
  return 'text-slate-500 text-xs'
}

async function load() {
  loading.value = true
  error.value = null
  try {
    scores.value = await getTopScores(props.gameId)
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  }
  finally {
    loading.value = false
  }
}

function handleScoreUpdate({ gameId, entry }: { gameId: string; entry: GameScore }) {
  if (gameId !== props.gameId) return
  const idx = scores.value.findIndex(s => s.uid === entry.uid)
  if (idx !== -1) {
    scores.value[idx] = entry
  }
  else {
    scores.value.push(entry)
  }
  scores.value = scores.value
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

onMounted(() => {
  load()
  const s = connect()
  s.emit('games:leaderboard-join', { gameId: props.gameId })
  s.on('games:score-update', handleScoreUpdate)
})

onUnmounted(() => {
  const s = getSocket()
  s.emit('games:leaderboard-leave', { gameId: props.gameId })
  s.off('games:score-update', handleScoreUpdate)
})

defineExpose({ reload: load })
</script>
