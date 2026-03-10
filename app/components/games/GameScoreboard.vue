<template>
  <div class="rounded-2xl bg-brand-800/40 border border-white/10 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/5">
      <h3 class="font-semibold text-white flex items-center gap-2">
        <span>🏆</span> Leaderboard
      </h3>
      <button
        class="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        :disabled="loading"
        @click="load"
      >
        ↺ Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <AppLoader size="sm" />
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
  </div>
</template>

<script setup lang="ts">
import type { GameScore } from '~/types/games.types'

const props = defineProps<{
  gameId: string
  currentUid?: string
}>()

const { getTopScores } = useGames()

const scores = ref<GameScore[]>([])
const loading = ref(false)

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
  try {
    scores.value = await getTopScores(props.gameId)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

defineExpose({ reload: load })
</script>
