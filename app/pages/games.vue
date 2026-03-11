<template>
  <div class="flex-1 flex flex-col min-h-0 p-4 md:p-8 animate-fade-in">

    <!-- ── Hub view ─────────────────────────────────────────────────── -->
    <template v-if="!activeGame">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-white mb-1.5 flex items-center gap-3">
          <span>🎮</span> Games
        </h1>
        <p class="text-sm text-slate-400">
          Take a break, have fun, and compete with your teammates!
        </p>
      </div>

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

      <!-- Top bar: back + title -->
      <div class="flex items-center gap-3 mb-3">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 shrink-0"
          @click="closeGame"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="hidden sm:inline">Back</span>
        </button>
        <h1 class="text-lg md:text-xl font-bold text-white flex-1 min-w-0 truncate">
          {{ activeGameDef?.title }}
        </h1>
      </div>

      <!-- Mode toggle (below title on mobile, inline on desktop) -->
      <div v-if="activeGame === 'tetris'" class="flex mb-5">
        <div class="flex rounded-xl border border-white/10 overflow-hidden text-sm">
          <button
            :class="[
              'px-5 py-2 font-medium transition-colors',
              gameMode === 'single'
                ? 'bg-accent-500 text-brand-900'
                : 'text-slate-400 hover:text-white hover:bg-white/5',
            ]"
            @click="setMode('single')"
          >
            Solo
          </button>
          <button
            :class="[
              'px-5 py-2 font-medium transition-colors',
              gameMode === 'multi'
                ? 'bg-accent-500 text-brand-900'
                : 'text-slate-400 hover:text-white hover:bg-white/5',
            ]"
            @click="setMode('multi')"
          >
            ⚔️ Battle
          </button>
        </div>
      </div>

      <!-- ── Single player ─────────────────────────────────────────── -->
      <template v-if="gameMode === 'single'">
        <div class="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
          <div class="flex-1 flex justify-center w-full">
            <TetrisGame
              v-if="activeGame === 'tetris'"
              @score-saved="onScoreSaved"
            />
            <SnakeGame
              v-else-if="activeGame === 'snake'"
              @score-saved="onScoreSaved"
            />
          </div>
          <div class="w-full xl:w-80 shrink-0">
            <GameScoreboard
              ref="scoreboardRef"
              :game-id="activeGame"
              :current-uid="user?.uid"
            />
          </div>
        </div>
      </template>

      <!-- ── Multiplayer (Tetris only) ─────────────────────────────── -->
      <template v-else-if="activeGame === 'tetris'">
        <!-- Lobby -->
        <div v-if="!activeMatch" class="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
          <div class="flex-1 max-w-lg w-full">
            <TetrisLobby @match-start="onMatchStart" />
          </div>
          <div class="w-full xl:w-80 shrink-0">
            <GameScoreboard
              ref="multiScoreboardRef"
              :game-id="activeGame"
              :current-uid="user?.uid"
            />
          </div>
        </div>

        <!-- Active match -->
        <div v-else class="flex flex-col items-center gap-4 w-full">
          <TetrisMultiplayer
            :match-id="activeMatch.matchId"
            :players="activeMatch.players"
            @leave="onLeaveMatch"
            @match-end="onMatchEnd"
          />
        </div>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
import { GAME_DEFINITIONS } from '~/stores/games.store'
import type { TetrisMatchPlayer, TetrisRanking } from '~/types/socket.types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { user } = useAuth()

type GameMode = 'single' | 'multi'

const activeGame = ref<string | null>(null)
const gameMode = ref<GameMode>('single')
const scoreboardRef = ref<{ reload: () => void } | null>(null)
const multiScoreboardRef = ref<{ reload: () => void } | null>(null)
const activeMatch = ref<{ matchId: string; players: TetrisMatchPlayer[] } | null>(null)

const activeGameDef = computed(() =>
  GAME_DEFINITIONS.find(g => g.id === activeGame.value) ?? null,
)

function launchGame(id: string) {
  activeGame.value = id
  gameMode.value = 'single'
  activeMatch.value = null
}

function closeGame() {
  activeGame.value = null
  activeMatch.value = null
}

function setMode(mode: GameMode) {
  if (gameMode.value === mode) return
  gameMode.value = mode
  activeMatch.value = null
}

async function onScoreSaved(_score: number, _isNewBest: boolean) {
  await nextTick()
  scoreboardRef.value?.reload()
}

function onMatchStart(data: { matchId: string; players: TetrisMatchPlayer[] }) {
  activeMatch.value = data
}

function onLeaveMatch() {
  activeMatch.value = null
}

async function onMatchEnd(_rankings: TetrisRanking[]) {
  // Reload the multiplayer leaderboard when user returns to lobby
  await nextTick()
  multiScoreboardRef.value?.reload()
}
</script>
