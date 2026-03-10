<template>
  <div class="flex-1 flex flex-col min-h-0 p-6 md:p-8 animate-fade-in">

    <!-- ── Hub view ─────────────────────────────────────────────────── -->
    <template v-if="!activeGame">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-white mb-1.5 flex items-center gap-3">
          <span>🎮</span> Games
        </h1>
        <p class="text-sm text-slate-400">
          Take a break, have fun, and compete with your teammates!
        </p>
      </div>

      <!-- Game cards grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GameCard
          v-for="game in GAME_DEFINITIONS"
          :key="game.id"
          :game="game"
          @play="launchGame"
        />
      </div>
    </template>

    <!-- ── Active game view ─────────────────────────────────────────── -->
    <template v-else>
      <!-- Back button + game title -->
      <div class="flex items-center gap-4 mb-8">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
          @click="closeGame"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Games
        </button>
        <span class="text-white/20">|</span>
        <h1 class="text-xl font-bold text-white">{{ activeGameDef?.title }}</h1>
      </div>

      <!-- Game + leaderboard layout -->
      <div class="flex flex-col xl:flex-row gap-8 items-start">
        <!-- Game component -->
        <div class="flex-1 flex justify-center">
          <TetrisGame
            v-if="activeGame === 'tetris'"
            @score-saved="onScoreSaved"
          />
        </div>

        <!-- Leaderboard -->
        <div class="w-full xl:w-80 shrink-0">
          <GameScoreboard
            ref="scoreboardRef"
            :game-id="activeGame"
            :current-uid="user?.uid"
          />
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { GAME_DEFINITIONS } from '~/stores/games.store'

definePageMeta({ layout: 'default' })

const { user } = useAuth()

const activeGame = ref<string | null>(null)
const scoreboardRef = ref<{ reload: () => void } | null>(null)

const activeGameDef = computed(() =>
  GAME_DEFINITIONS.find(g => g.id === activeGame.value) ?? null,
)

function launchGame(id: string) {
  activeGame.value = id
}

function closeGame() {
  activeGame.value = null
}

async function onScoreSaved(_score: number, _isNewBest: boolean) {
  await nextTick()
  scoreboardRef.value?.reload()
}
</script>
