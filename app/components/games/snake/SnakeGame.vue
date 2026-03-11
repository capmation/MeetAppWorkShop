<template>
  <div
    ref="gameRoot"
    class="flex flex-col items-center gap-4 outline-none select-none w-full"
    tabindex="0"
    @keydown="handleKey"
  >

    <!-- ══════════════════════════════════════════════════════════
         MOBILE layout  (<md)
    ═══════════════════════════════════════════════════════════════ -->
    <div class="flex flex-col items-center gap-3 w-full md:hidden">

      <!-- Compact stats row -->
      <div class="flex items-center gap-2 w-full max-w-xs">
        <div class="stat-pill flex-1">
          <span class="stat-label">Score</span>
          <span class="stat-val font-mono">{{ score.toLocaleString() }}</span>
        </div>
        <div class="stat-pill w-14">
          <span class="stat-label">Lv</span>
          <span class="stat-val">{{ level }}</span>
        </div>
        <div class="stat-pill w-14">
          <span class="stat-label">Food</span>
          <span class="stat-val">{{ eaten }}</span>
        </div>
        <div class="stat-pill w-14">
          <span class="stat-label">Len</span>
          <span class="stat-val">{{ snakeLength }}</span>
        </div>
      </div>

      <!-- Canvas + touch area -->
      <div
        class="relative touch-none"
        @touchstart.passive="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="onTouchEnd"
      >
        <canvas
          ref="canvasRefMobile"
          :width="COLS * CELL_M"
          :height="ROWS * CELL_M"
          class="rounded-xl border border-white/20 block bg-brand-900"
        />

        <!-- Overlays -->
        <Transition name="t-fade">
          <div
            v-if="gameState !== 'playing'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/88 backdrop-blur-sm"
          >
            <template v-if="gameState === 'idle'">
              <p class="text-5xl mb-3">🐍</p>
              <h3 class="text-lg font-bold text-white mb-1">Snake</h3>
              <p class="text-xs text-slate-400 mb-5 text-center px-6 leading-relaxed">
                Eat apples, grow longer,<br>don't hit the walls or yourself!
              </p>
              <p class="text-[11px] text-slate-500 mb-4 text-center leading-relaxed">
                👆 Swipe to change direction
              </p>
              <button class="btn-primary px-8 py-2.5" @click="startGame">Start Game</button>
            </template>
            <template v-else-if="gameState === 'paused'">
              <p class="text-5xl mb-3">⏸</p>
              <h3 class="text-lg font-bold text-white mb-5">Paused</h3>
              <button class="btn-primary px-8 py-2.5" @click="togglePause">▶ Resume</button>
            </template>
            <template v-else-if="gameState === 'gameover'">
              <p class="text-5xl mb-2">💀</p>
              <h3 class="text-lg font-bold text-white mb-1">Game Over</h3>
              <p class="text-2xl font-mono font-bold text-accent-400 mb-1">{{ score.toLocaleString() }}</p>
              <p class="text-xs text-slate-400 mb-2">Level {{ level }} · {{ eaten }} apples · length {{ snakeLength }}</p>
              <p v-if="saving" class="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                <AppLoader size="xs" /> Saving…
              </p>
              <p v-else-if="savedBest" class="text-xs text-yellow-400 mb-4">🏆 New personal best!</p>
              <p v-else class="text-xs text-slate-500 mb-4">Score saved</p>
              <button
                class="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="saving"
                @click="startGame"
              >
                ↺ Play Again
              </button>
            </template>
          </div>
        </Transition>
      </div>

      <!-- Speed bar -->
      <div class="flex gap-1 w-full max-w-xs items-center">
        <span class="text-[10px] text-slate-500 uppercase tracking-wide mr-1">Spd</span>
        <div
          v-for="l in 10"
          :key="l"
          :class="['flex-1 h-1.5 rounded-full transition-all duration-500', l <= level ? 'bg-accent-400' : 'bg-white/10']"
        />
      </div>

      <!-- Action buttons -->
      <div v-if="gameState === 'playing' || gameState === 'paused'" class="flex gap-3">
        <button class="btn-ghost px-5 py-2 text-sm" @click="togglePause">
          {{ gameState === 'paused' ? '▶ Resume' : '⏸ Pause' }}
        </button>
        <button class="btn-ghost px-5 py-2 text-sm" @click="startGame">↺ Restart</button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         DESKTOP layout  (md+)
    ═══════════════════════════════════════════════════════════════ -->
    <div class="hidden md:flex flex-col items-center gap-6">
      <div class="flex gap-4 items-start">

        <!-- Left panel: stats -->
        <div class="flex flex-col gap-3 w-28">
          <div class="info-panel">
            <p class="info-label">Score</p>
            <p class="info-value font-mono">{{ score.toLocaleString() }}</p>
          </div>
          <div class="info-panel">
            <p class="info-label">Level</p>
            <p class="info-value">{{ level }}</p>
          </div>
          <div class="info-panel">
            <p class="info-label">Apples</p>
            <p class="info-value">{{ eaten }}</p>
          </div>
          <div class="info-panel">
            <p class="info-label">Length</p>
            <p class="info-value">{{ snakeLength }}</p>
          </div>
          <div class="info-panel">
            <p class="info-label mb-2">Speed</p>
            <div class="flex flex-col gap-1">
              <div
                v-for="l in 10"
                :key="l"
                :class="['h-1.5 rounded-full transition-all duration-500', l <= level ? 'bg-accent-400' : 'bg-white/10']"
              />
            </div>
          </div>
        </div>

        <!-- Game canvas + overlays -->
        <div class="relative">
          <canvas
            ref="canvasRef"
            :width="COLS * CELL"
            :height="ROWS * CELL"
            class="rounded-xl border border-white/20 block bg-brand-900"
          />
          <Transition name="t-fade">
            <div
              v-if="gameState !== 'playing'"
              class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/88 backdrop-blur-sm"
            >
              <template v-if="gameState === 'idle'">
                <p class="text-5xl mb-4">🐍</p>
                <h3 class="text-xl font-bold text-white mb-1">Snake</h3>
                <p class="text-xs text-slate-400 mb-6 text-center px-6 leading-relaxed">
                  Eat apples, grow longer,<br>don't hit the walls or yourself!
                </p>
                <button class="btn-primary px-8 py-2.5" @click="startGame">Start Game</button>
              </template>
              <template v-else-if="gameState === 'paused'">
                <p class="text-5xl mb-4">⏸</p>
                <h3 class="text-xl font-bold text-white mb-6">Paused</h3>
                <button class="btn-primary px-8 py-2.5" @click="togglePause">▶ Resume</button>
              </template>
              <template v-else-if="gameState === 'gameover'">
                <p class="text-5xl mb-3">💀</p>
                <h3 class="text-xl font-bold text-white mb-1">Game Over</h3>
                <p class="text-2xl font-mono font-bold text-accent-400 mb-1">{{ score.toLocaleString() }}</p>
                <p class="text-xs text-slate-400 mb-2">Level {{ level }} · {{ eaten }} apples · length {{ snakeLength }}</p>
                <p v-if="saving" class="text-xs text-slate-400 mb-5 flex items-center gap-1.5">
                  <AppLoader size="xs" /> Saving score…
                </p>
                <p v-else-if="savedBest" class="text-xs text-yellow-400 mb-5">🏆 New personal best!</p>
                <p v-else class="text-xs text-slate-500 mb-5">Score saved</p>
                <button
                  class="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="saving"
                  @click="startGame"
                >
                  ↺ Play Again
                </button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Right panel: keys -->
        <div class="flex flex-col gap-3 w-28">
          <div class="info-panel text-left">
            <p class="info-label mb-2">Keys</p>
            <div class="space-y-1.5">
              <div v-for="c in CONTROLS_HINT" :key="c.key" class="flex items-start gap-1.5">
                <kbd class="mt-0.5 shrink-0 text-[9px] bg-brand-700 border border-white/10 px-1 py-0.5 rounded font-mono text-white leading-none">
                  {{ c.key }}
                </kbd>
                <span class="text-[10px] text-slate-400 leading-tight">{{ c.action }}</span>
              </div>
            </div>
          </div>

          <!-- Current direction indicator -->
          <div class="info-panel">
            <p class="info-label mb-2">Dir</p>
            <div class="grid grid-cols-3 gap-0.5 mx-auto w-fit">
              <div />
              <div :class="['dir-btn', currentDirection === 'up' ? 'dir-active' : '']">↑</div>
              <div />
              <div :class="['dir-btn', currentDirection === 'left' ? 'dir-active' : '']">←</div>
              <div :class="['dir-btn', 'text-[8px]']">·</div>
              <div :class="['dir-btn', currentDirection === 'right' ? 'dir-active' : '']">→</div>
              <div />
              <div :class="['dir-btn', currentDirection === 'down' ? 'dir-active' : '']">↓</div>
              <div />
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop bottom buttons -->
      <div class="flex gap-3">
        <button
          v-if="gameState === 'playing' || gameState === 'paused'"
          class="btn-ghost px-5 py-2 text-sm"
          @click="togglePause"
        >
          {{ gameState === 'paused' ? '▶ Resume' : '⏸ Pause' }}
        </button>
        <button
          v-if="gameState !== 'idle'"
          class="btn-ghost px-5 py-2 text-sm"
          @click="startGame"
        >
          ↺ Restart
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
// ── Constants ─────────────────────────────────────────────────────────
const COLS = 20
const ROWS = 20
const CELL = 24    // desktop cell size px
const CELL_M = 16  // mobile cell size px

// ms per move per level (level 1 = slow, level 10 = fast)
const SPEEDS = [220, 195, 170, 145, 120, 100, 82, 65, 52, 40]
const FOODS_PER_LEVEL = 5

const CONTROLS_HINT = [
  { key: '↑ / W', action: 'Up' },
  { key: '↓ / S', action: 'Down' },
  { key: '← / A', action: 'Left' },
  { key: '→ / D', action: 'Right' },
  { key: 'P', action: 'Pause' },
]

// ── Colors ────────────────────────────────────────────────────────────
const COLOR_HEAD = '#9fbf1a'
const COLOR_BODY = '#6a8e10'
const COLOR_FOOD = '#f0a000'
const COLOR_BG = '#040f1f'

// ── Types ─────────────────────────────────────────────────────────────
type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = 'idle' | 'playing' | 'paused' | 'gameover'
interface Point { x: number; y: number }

// ── Emits ─────────────────────────────────────────────────────────────
const emit = defineEmits<{
  scoreSaved: [score: number, isNewBest: boolean]
}>()

// ── Template refs ─────────────────────────────────────────────────────
const gameRoot = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefMobile = ref<HTMLCanvasElement | null>(null)

// ── Reactive state ────────────────────────────────────────────────────
const gameState = ref<GameState>('idle')
const score = ref(0)
const level = ref(1)
const eaten = ref(0)
const snakeLength = ref(3)
const currentDirection = ref<Direction>('right')
const saving = ref(false)
const savedBest = ref(false)

// ── Composables ───────────────────────────────────────────────────────
const { saveScore } = useGames()
const { user } = useAuth()

// ── Mutable game state (not reactive for perf) ────────────────────────
let snake: Point[] = []
let food: Point = { x: 0, y: 0 }
let direction: Direction = 'right'
let nextDirection: Direction = 'right'
let animFrameId = 0
let lastTime = 0
let moveTimer = 0

// ── Helpers ───────────────────────────────────────────────────────────
function isOpposite(a: Direction, b: Direction): boolean {
  return (a === 'up' && b === 'down') || (a === 'down' && b === 'up')
    || (a === 'left' && b === 'right') || (a === 'right' && b === 'left')
}

function randomFood(): Point {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  let p: Point
  // Prevent infinite loop on a full board (shouldn't happen in practice)
  let attempts = 0
  do {
    p = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    }
    attempts++
  } while (occupied.has(`${p.x},${p.y}`) && attempts < COLS * ROWS)
  return p
}

function initGame() {
  const startX = Math.floor(COLS / 2)
  const startY = Math.floor(ROWS / 2)
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ]
  direction = 'right'
  nextDirection = 'right'
  food = randomFood()
}

// ── Drawing ───────────────────────────────────────────────────────────
function drawSegment(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, cell: number) {
  const px = x * cell + 1
  const py = y * cell + 1
  const size = cell - 2
  ctx.fillStyle = color
  ctx.fillRect(px, py, size, size)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fillRect(px + 1, py + 1, size - 2, 4)
  ctx.fillStyle = 'rgba(0,0,0,0.20)'
  ctx.fillRect(px + 1, py + size - 4, size - 2, 3)
}

function drawFood(ctx: CanvasRenderingContext2D, cell: number) {
  const cx = food.x * cell + cell / 2
  const cy = food.y * cell + cell / 2
  const r = Math.max(3, cell / 2 - 2)
  // Apple body
  ctx.fillStyle = COLOR_FOOD
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.beginPath()
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.32, 0, Math.PI * 2)
  ctx.fill()
}

function drawScene(ctx: CanvasRenderingContext2D, cell: number) {
  // Background
  ctx.fillStyle = COLOR_BG
  ctx.fillRect(0, 0, COLS * cell, ROWS * cell)

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, ROWS * cell); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(COLS * cell, r * cell); ctx.stroke()
  }

  // Food
  drawFood(ctx, cell)

  // Snake (draw tail-first so head is on top)
  for (let i = snake.length - 1; i >= 0; i--) {
    drawSegment(ctx, snake[i].x, snake[i].y, i === 0 ? COLOR_HEAD : COLOR_BODY, cell)
  }
}

function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (ctx) drawScene(ctx, CELL)
  const mctx = canvasRefMobile.value?.getContext('2d')
  if (mctx) drawScene(mctx, CELL_M)
}

// ── Game logic ────────────────────────────────────────────────────────
function move() {
  direction = nextDirection
  currentDirection.value = direction

  const head = snake[0]
  const newHead: Point = { x: head.x, y: head.y }
  if (direction === 'up') newHead.y--
  else if (direction === 'down') newHead.y++
  else if (direction === 'left') newHead.x--
  else newHead.x++

  // Wall collision
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    endGame(); return
  }

  // Self collision — skip the tail since it moves away this tick
  const bodyWithoutTail = snake.slice(0, -1)
  if (bodyWithoutTail.some(p => p.x === newHead.x && p.y === newHead.y)) {
    endGame(); return
  }

  snake.unshift(newHead)

  if (newHead.x === food.x && newHead.y === food.y) {
    eaten.value++
    score.value += level.value * 10
    level.value = Math.min(10, Math.floor(eaten.value / FOODS_PER_LEVEL) + 1)
    snakeLength.value = snake.length
    food = randomFood()
    // Don't pop tail → snake grows
  }
  else {
    snake.pop()
    snakeLength.value = snake.length
  }
}

// ── Game loop ─────────────────────────────────────────────────────────
function gameLoop(ts: number) {
  if (gameState.value !== 'playing') return
  const delta = ts - lastTime
  lastTime = ts
  moveTimer += delta
  const speed = SPEEDS[level.value - 1] ?? SPEEDS[0]
  if (moveTimer >= speed) {
    moveTimer = 0
    move()
  }
  if (gameState.value === 'playing') {
    render()
    animFrameId = requestAnimationFrame(gameLoop)
  }
}

// ── Controls ──────────────────────────────────────────────────────────
function changeDirection(dir: Direction) {
  if (!isOpposite(dir, direction)) {
    nextDirection = dir
  }
}

function handleKey(e: KeyboardEvent) {
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    if (e.key === 'Enter') startGame()
    return
  }
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault(); togglePause(); return
  }
  if (gameState.value !== 'playing') return

  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W':
      e.preventDefault(); changeDirection('up'); break
    case 'ArrowDown': case 's': case 'S':
      e.preventDefault(); changeDirection('down'); break
    case 'ArrowLeft': case 'a': case 'A':
      e.preventDefault(); changeDirection('left'); break
    case 'ArrowRight': case 'd': case 'D':
      e.preventDefault(); changeDirection('right'); break
  }
}

// ── Touch controls ────────────────────────────────────────────────────
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
}

function onTouchMove(_e: TouchEvent) {
  // Handled on touchend to avoid accidental direction changes
}

function onTouchEnd(e: TouchEvent) {
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    startGame(); return
  }
  if (gameState.value === 'paused') {
    togglePause(); return
  }
  if (gameState.value !== 'playing') return

  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // Ignore taps
  if (absDx < 12 && absDy < 12) return

  if (absDx > absDy) {
    changeDirection(dx > 0 ? 'right' : 'left')
  }
  else {
    changeDirection(dy > 0 ? 'down' : 'up')
  }
}

// ── Game management ───────────────────────────────────────────────────
function startGame() {
  cancelAnimationFrame(animFrameId)
  score.value = 0
  level.value = 1
  eaten.value = 0
  snakeLength.value = 3
  saving.value = false
  savedBest.value = false
  moveTimer = 0
  currentDirection.value = 'right'
  initGame()
  gameState.value = 'playing'
  nextTick(() => {
    gameRoot.value?.focus()
    lastTime = performance.now()
    animFrameId = requestAnimationFrame(gameLoop)
  })
}

function togglePause() {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
    cancelAnimationFrame(animFrameId)
  }
  else if (gameState.value === 'paused') {
    gameState.value = 'playing'
    lastTime = performance.now()
    moveTimer = 0
    animFrameId = requestAnimationFrame(gameLoop)
  }
}

async function endGame() {
  gameState.value = 'gameover'
  cancelAnimationFrame(animFrameId)
  render()
  if (user.value && score.value > 0) {
    saving.value = true
    try {
      const isNewBest = await saveScore('snake', score.value, level.value, eaten.value)
      savedBest.value = isNewBest
      emit('scoreSaved', score.value, isNewBest)
    }
    catch (err) {
      console.error('[SnakeGame] Failed to save score:', err)
    }
    finally {
      saving.value = false
    }
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  nextTick(() => {
    gameRoot.value?.focus()
    render()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
/* ── Desktop panels ─────────────────────────── */
.info-panel {
  @apply rounded-xl bg-brand-800/60 border border-white/10 p-3 text-center;
}
.info-label {
  @apply text-[10px] text-slate-400 uppercase tracking-wide mb-1;
}
.info-value {
  @apply text-lg font-bold text-white;
}

/* ── Direction indicator ────────────────────── */
.dir-btn {
  @apply w-6 h-6 flex items-center justify-center text-[11px] rounded text-slate-500;
}
.dir-active {
  @apply bg-accent-500/20 text-accent-400 font-bold;
}

/* ── Mobile stat pills ─────────────────────── */
.stat-pill {
  @apply rounded-xl bg-brand-800/60 border border-white/10 px-2 py-1.5 text-center flex flex-col items-center justify-center;
}
.stat-label {
  @apply text-[9px] text-slate-500 uppercase tracking-wide leading-none mb-0.5;
}
.stat-val {
  @apply text-sm font-bold text-white leading-none;
}

/* ── Shared buttons ─────────────────────────── */
.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/20;
}
.btn-ghost {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium transition-all duration-150 px-4 py-2 text-sm;
}

/* ── Transitions ────────────────────────────── */
.t-fade-enter-active, .t-fade-leave-active { transition: opacity 0.2s ease; }
.t-fade-enter-from, .t-fade-leave-to { opacity: 0; }
</style>
