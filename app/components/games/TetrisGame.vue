<template>
  <div
    ref="gameRoot"
    class="flex flex-col items-center gap-6 outline-none select-none"
    tabindex="0"
    @keydown="handleKey"
  >
    <!-- ── Main play area ─────────────────────────────────────────── -->
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
          <p class="info-label">Lines</p>
          <p class="info-value">{{ lines }}</p>
        </div>

        <!-- Speed bar -->
        <div class="info-panel">
          <p class="info-label mb-2">Speed</p>
          <div class="flex flex-col gap-1">
            <div
              v-for="l in 10"
              :key="l"
              :class="[
                'h-1.5 rounded-full transition-all duration-500',
                l <= level ? 'bg-accent-400' : 'bg-white/10',
              ]"
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

        <!-- State overlays -->
        <Transition name="t-fade">
          <div
            v-if="gameState !== 'playing'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/88 backdrop-blur-sm"
          >
            <!-- IDLE -->
            <template v-if="gameState === 'idle'">
              <p class="text-5xl mb-4">🎮</p>
              <h3 class="text-xl font-bold text-white mb-1">Tetris</h3>
              <p class="text-xs text-slate-400 mb-6 text-center px-6 leading-relaxed">
                Stack blocks, clear lines,<br>race through 10 speed levels!
              </p>
              <button class="btn-primary px-8 py-2.5" @click="startGame">
                Start Game
              </button>
            </template>

            <!-- PAUSED -->
            <template v-else-if="gameState === 'paused'">
              <p class="text-5xl mb-4">⏸</p>
              <h3 class="text-xl font-bold text-white mb-6">Paused</h3>
              <button class="btn-primary px-8 py-2.5" @click="togglePause">
                ▶ Resume
              </button>
            </template>

            <!-- GAME OVER -->
            <template v-else-if="gameState === 'gameover'">
              <p class="text-5xl mb-3">💀</p>
              <h3 class="text-xl font-bold text-white mb-1">Game Over</h3>
              <p class="text-2xl font-mono font-bold text-accent-400 mb-1">
                {{ score.toLocaleString() }}
              </p>
              <p class="text-xs text-slate-400 mb-2">
                Level {{ level }} · {{ lines }} lines
              </p>
              <p v-if="saving" class="text-xs text-slate-400 mb-5 flex items-center gap-1.5">
                <AppLoader size="xs" />
                Saving score…
              </p>
              <p v-else-if="savedBest" class="text-xs text-yellow-400 mb-5">
                🏆 New personal best!
              </p>
              <p v-else class="text-xs text-slate-500 mb-5">Score saved</p>
              <button class="btn-primary px-8 py-2.5" @click="startGame">
                ↺ Play Again
              </button>
            </template>
          </div>
        </Transition>
      </div>

      <!-- Right panel: next piece + controls -->
      <div class="flex flex-col gap-3 w-28">
        <div class="info-panel">
          <p class="info-label mb-2">Next</p>
          <canvas
            ref="nextCanvasRef"
            :width="CELL * 4"
            :height="CELL * 4"
            class="block mx-auto"
          />
        </div>

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
      </div>
    </div>

    <!-- ── Mobile on-screen controls ─────────────────────────────── -->
    <div class="flex flex-col items-center gap-2 md:hidden w-full max-w-xs">
      <button class="mobile-btn" @click="handleMobileAction('rotate')">↻ Rotate</button>
      <div class="flex gap-3 w-full">
        <button class="mobile-btn flex-1" @click="handleMobileAction('left')">← Left</button>
        <button class="mobile-btn flex-1" @click="handleMobileAction('right')">Right →</button>
      </div>
      <div class="flex gap-3 w-full">
        <button class="mobile-btn flex-1" @click="handleMobileAction('down')">↓ Drop</button>
        <button class="mobile-btn flex-1 bg-accent-500/20 border-accent-400/30 text-accent-300" @click="handleMobileAction('harddrop')">
          ⬇ Hard Drop
        </button>
      </div>
    </div>

    <!-- ── Bottom action buttons ───────────────────────────────────── -->
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
</template>

<script setup lang="ts">
// ── Constants ────────────────────────────────────────────────────────
const COLS = 10
const ROWS = 20
const CELL = 30

/** Drop interval in ms for each level (1–10) */
const SPEEDS = [800, 700, 600, 500, 400, 300, 250, 200, 150, 100]

/** Score for clearing 1/2/3/4 lines × current level */
const SCORE_TABLE = [0, 100, 300, 500, 800]

const CONTROLS_HINT = [
  { key: '← →', action: 'Move' },
  { key: '↑ / Z', action: 'Rotate' },
  { key: '↓', action: 'Soft drop' },
  { key: 'Space', action: 'Hard drop' },
  { key: 'P', action: 'Pause' },
]

// ── Tetrominos ───────────────────────────────────────────────────────
type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0',
  O: '#f0d000',
  T: '#a000f0',
  S: '#00d000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000',
}

const PIECE_MATRICES: Record<PieceType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
}

const ALL_TYPES = Object.keys(PIECE_MATRICES) as PieceType[]

// ── Types ────────────────────────────────────────────────────────────
type GameState = 'idle' | 'playing' | 'paused' | 'gameover'

interface Piece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

// ── Emits ────────────────────────────────────────────────────────────
const emit = defineEmits<{
  scoreSaved: [score: number, isNewBest: boolean]
}>()

// ── Template refs ────────────────────────────────────────────────────
const gameRoot = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const nextCanvasRef = ref<HTMLCanvasElement | null>(null)

// ── Reactive state ───────────────────────────────────────────────────
const gameState = ref<GameState>('idle')
const score = ref(0)
const level = ref(1)
const lines = ref(0)
const saving = ref(false)
const savedBest = ref(false)

// ── Composables ──────────────────────────────────────────────────────
const { saveScore } = useGames()
const { user } = useAuth()

// ── Mutable game state (not reactive for perf) ───────────────────────
// Pre-fill board so render() is safe to call before startGame()
let board: (string | null)[][] = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null))
let currentPiece: Piece | null = null
let nextPieceType: PieceType | null = null
let animFrameId = 0
let lastTime = 0
let dropTimer = 0

// ── Helpers ──────────────────────────────────────────────────────────
function randomType(): PieceType {
  return ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]
}

function cloneMatrix(m: number[][]): number[][] {
  return m.map(row => [...row])
}

function rotateCW(matrix: number[][]): number[][] {
  const rows = matrix.length
  const cols = matrix[0].length
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = matrix[r][c]
    }
  }
  return result
}

function isValid(matrix: number[][], px: number, py: number): boolean {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue
      const nx = px + c
      const ny = py + r
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false
      if (ny >= 0 && board[ny][nx] !== null) return false
    }
  }
  return true
}

// ── Board ops ────────────────────────────────────────────────────────
function initBoard() {
  board = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null))
}

function lockPiece() {
  if (!currentPiece) return
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (!currentPiece.matrix[r][c]) continue
      const ny = currentPiece.y + r
      const nx = currentPiece.x + c
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        board[ny][nx] = color
      }
    }
  }
}

function clearLines(): number {
  let cleared = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      board.splice(r, 1)
      board.unshift(Array<string | null>(COLS).fill(null))
      cleared++
      r++ // recheck same row index after splice
    }
  }
  return cleared
}

// ── Piece management ─────────────────────────────────────────────────
function spawnPiece() {
  const type = nextPieceType ?? randomType()
  nextPieceType = randomType()

  const matrix = cloneMatrix(PIECE_MATRICES[type])
  const x = Math.floor((COLS - matrix[0].length) / 2)
  const y = 0

  currentPiece = { type, matrix, x, y }

  if (!isValid(matrix, x, y)) {
    // Board is full — game over
    currentPiece = null
    endGame()
  }
}

function placePiece() {
  lockPiece()
  const cleared = clearLines()
  if (cleared > 0) {
    score.value += SCORE_TABLE[cleared] * level.value
    lines.value += cleared
    level.value = Math.min(10, Math.floor(lines.value / 10) + 1)
  }
  spawnPiece()
  dropTimer = 0
}

// ── Drop ─────────────────────────────────────────────────────────────
function drop() {
  if (!currentPiece) return
  if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++
  }
  else {
    placePiece()
  }
}

function hardDrop() {
  if (!currentPiece) return
  while (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++
    score.value += 2
  }
  placePiece()
}

// ── Rotation with wall kicks ──────────────────────────────────────────
function tryRotate() {
  if (!currentPiece) return
  const rotated = rotateCW(currentPiece.matrix)
  for (const kick of [0, -1, 1, -2, 2]) {
    if (isValid(rotated, currentPiece.x + kick, currentPiece.y)) {
      currentPiece.matrix = rotated
      currentPiece.x += kick
      return
    }
  }
}

// ── Drawing ──────────────────────────────────────────────────────────
function drawCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  color: string,
  alpha = 1,
) {
  const x = col * CELL
  const y = row * CELL
  ctx.globalAlpha = alpha

  // Main fill
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)

  // Top shine
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.fillRect(x + 1, y + 1, CELL - 2, 5)

  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x + 1, y + CELL - 6, CELL - 2, 5)

  ctx.globalAlpha = 1
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  // Background
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath()
    ctx.moveTo(c * CELL, 0)
    ctx.lineTo(c * CELL, ROWS * CELL)
    ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * CELL)
    ctx.lineTo(COLS * CELL, r * CELL)
    ctx.stroke()
  }

  // Placed cells
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(ctx, c, r, board[r][c]!)
      }
    }
  }
}

function drawGhost(ctx: CanvasRenderingContext2D) {
  if (!currentPiece) return
  let ghostY = currentPiece.y
  while (isValid(currentPiece.matrix, currentPiece.x, ghostY + 1)) ghostY++
  if (ghostY === currentPiece.y) return

  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) {
        drawCell(ctx, currentPiece.x + c, ghostY + r, color, 0.18)
      }
    }
  }
}

function drawCurrent(ctx: CanvasRenderingContext2D) {
  if (!currentPiece) return
  drawGhost(ctx)
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) {
        drawCell(ctx, currentPiece.x + c, currentPiece.y + r, color)
      }
    }
  }
}

function drawNextPiece() {
  const ctx = nextCanvasRef.value?.getContext('2d')
  if (!ctx || !nextPieceType) return

  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, CELL * 4, CELL * 4)

  const matrix = PIECE_MATRICES[nextPieceType]
  const color = PIECE_COLORS[nextPieceType]
  const offsetX = Math.floor((4 - matrix[0].length) / 2)
  const offsetY = Math.floor((4 - matrix.length) / 2)

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        drawCell(ctx, offsetX + c, offsetY + r, color)
      }
    }
  }
}

function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return
  drawBoard(ctx)
  drawCurrent(ctx)
  drawNextPiece()
}

// ── Game loop ─────────────────────────────────────────────────────────
function gameLoop(timestamp: number) {
  if (gameState.value !== 'playing') return

  const delta = timestamp - lastTime
  lastTime = timestamp
  dropTimer += delta

  const speed = SPEEDS[level.value - 1] ?? SPEEDS[0]

  if (dropTimer >= speed) {
    dropTimer = 0
    drop()
  }

  render()
  animFrameId = requestAnimationFrame(gameLoop)
}

// ── Controls ──────────────────────────────────────────────────────────
function handleKey(e: KeyboardEvent) {
  // Allow starting/restarting from overlay
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    if (e.key === 'Enter') startGame()
    return
  }

  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault()
    togglePause()
    return
  }

  if (gameState.value !== 'playing' || !currentPiece) return

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x - 1, currentPiece.y))
        currentPiece.x--
      break
    case 'ArrowRight':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x + 1, currentPiece.y))
        currentPiece.x++
      break
    case 'ArrowDown':
      e.preventDefault()
      // Soft drop: one row per keydown (browser key-repeat handles hold)
      if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++
        score.value += 1
        dropTimer = 0
      }
      break
    case 'ArrowUp':
    case 'z':
    case 'Z':
      e.preventDefault()
      tryRotate()
      break
    case ' ':
      e.preventDefault()
      hardDrop()
      break
  }
}


function handleMobileAction(action: string) {
  if (gameState.value !== 'playing' || !currentPiece) return
  switch (action) {
    case 'left':
      if (isValid(currentPiece.matrix, currentPiece.x - 1, currentPiece.y))
        currentPiece.x--
      break
    case 'right':
      if (isValid(currentPiece.matrix, currentPiece.x + 1, currentPiece.y))
        currentPiece.x++
      break
    case 'rotate':
      tryRotate()
      break
    case 'down':
      drop()
      break
    case 'harddrop':
      hardDrop()
      break
  }
  render()
}

// ── Game management ───────────────────────────────────────────────────
function startGame() {
  cancelAnimationFrame(animFrameId)

  score.value = 0
  level.value = 1
  lines.value = 0
  saving.value = false
  savedBest.value = false
  dropTimer = 0

  initBoard()
  nextPieceType = randomType()
  spawnPiece()

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
    dropTimer = 0
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
      const isNewBest = await saveScore('tetris', score.value, level.value, lines.value)
      savedBest.value = isNewBest
      emit('scoreSaved', score.value, isNewBest)
    }
    catch (err) {
      console.error('[TetrisGame] Failed to save score:', err)
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
    render() // draw empty board
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.info-panel {
  @apply rounded-xl bg-brand-800/60 border border-white/10 p-3 text-center;
}
.info-label {
  @apply text-[10px] text-slate-400 uppercase tracking-wide mb-1;
}
.info-value {
  @apply text-lg font-bold text-white;
}
.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/20;
}
.btn-ghost {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium transition-all duration-150 px-4 py-2 text-sm;
}
.mobile-btn {
  @apply rounded-xl border border-white/10 bg-brand-800/60 text-white text-sm font-medium py-3 px-4 active:bg-white/10 transition-colors;
}
.t-fade-enter-active,
.t-fade-leave-active {
  transition: opacity 0.2s ease;
}
.t-fade-enter-from,
.t-fade-leave-to {
  opacity: 0;
}
</style>
