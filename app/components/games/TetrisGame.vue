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
        <div class="stat-pill w-16">
          <span class="stat-label">Lv</span>
          <span class="stat-val">{{ level }}</span>
        </div>
        <div class="stat-pill w-16">
          <span class="stat-label">Lines</span>
          <span class="stat-val">{{ lines }}</span>
        </div>
        <!-- Next piece mini -->
        <div class="stat-pill p-1.5 shrink-0">
          <canvas
            ref="nextCanvasRefMobile"
            :width="CELL_M * 4"
            :height="CELL_M * 4"
            class="block"
          />
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
              <p class="text-5xl mb-3">🎮</p>
              <h3 class="text-lg font-bold text-white mb-1">Tetris</h3>
              <p class="text-xs text-slate-400 mb-5 text-center px-6 leading-relaxed">
                Stack blocks, clear lines,<br>race through 10 speed levels!
              </p>
              <p class="text-[11px] text-slate-500 mb-4 text-center leading-relaxed">
                👆 Tap = Rotate &nbsp;·&nbsp; ↔ Drag = Move<br>
                ↓ Swipe = Drop &nbsp;·&nbsp; ↑ Swipe = Hard drop
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
              <p class="text-xs text-slate-400 mb-2">Level {{ level }} · {{ lines }} lines</p>
              <p v-if="saving" class="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                <AppLoader size="xs" /> Saving…
              </p>
              <p v-else-if="savedBest" class="text-xs text-yellow-400 mb-4">🏆 New personal best!</p>
              <p v-else class="text-xs text-slate-500 mb-4">Score saved</p>
              <button class="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="saving" @click="startGame">↺ Play Again</button>
            </template>
          </div>
        </Transition>
      </div>

      <!-- Speed bar (thin, below canvas) -->
      <div class="flex gap-1 w-full max-w-xs items-center">
        <span class="text-[10px] text-slate-500 uppercase tracking-wide mr-1">Spd</span>
        <div
          v-for="l in 10"
          :key="l"
          :class="['flex-1 h-1.5 rounded-full transition-all duration-500', l <= level ? 'bg-accent-400' : 'bg-white/10']"
        />
      </div>

      <!-- Action buttons row -->
      <div
        v-if="gameState === 'playing' || gameState === 'paused'"
        class="flex gap-3"
      >
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
            <p class="info-label">Lines</p>
            <p class="info-value">{{ lines }}</p>
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
                <p class="text-5xl mb-4">🎮</p>
                <h3 class="text-xl font-bold text-white mb-1">Tetris</h3>
                <p class="text-xs text-slate-400 mb-6 text-center px-6 leading-relaxed">
                  Stack blocks, clear lines,<br>race through 10 speed levels!
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
                <p class="text-xs text-slate-400 mb-2">Level {{ level }} · {{ lines }} lines</p>
                <p v-if="saving" class="text-xs text-slate-400 mb-5 flex items-center gap-1.5">
                  <AppLoader size="xs" /> Saving score…
                </p>
                <p v-else-if="savedBest" class="text-xs text-yellow-400 mb-5">🏆 New personal best!</p>
                <p v-else class="text-xs text-slate-500 mb-5">Score saved</p>
                <button class="btn-primary px-8 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="saving" @click="startGame">↺ Play Again</button>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Right panel: next piece + keys -->
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
const COLS = 10
const ROWS = 20
const CELL = 30    // desktop cell size
const CELL_M = 28  // mobile cell size (280px wide canvas)

const SPEEDS = [800, 700, 600, 500, 400, 300, 250, 200, 150, 100]
const SCORE_TABLE = [0, 100, 300, 500, 800]

const CONTROLS_HINT = [
  { key: '← →', action: 'Move' },
  { key: '↑ / Z', action: 'Rotate' },
  { key: '↓', action: 'Soft drop' },
  { key: 'Space', action: 'Hard drop' },
  { key: 'P', action: 'Pause' },
]

// ── Tetrominos ────────────────────────────────────────────────────────
type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00f0f0', O: '#f0d000', T: '#a000f0',
  S: '#00d000', Z: '#f00000', J: '#0000f0', L: '#f0a000',
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

type GameState = 'idle' | 'playing' | 'paused' | 'gameover'

interface Piece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

// ── Emits ─────────────────────────────────────────────────────────────
const emit = defineEmits<{
  scoreSaved: [score: number, isNewBest: boolean]
}>()

// ── Template refs ─────────────────────────────────────────────────────
const gameRoot = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)           // desktop
const nextCanvasRef = ref<HTMLCanvasElement | null>(null)       // desktop
const canvasRefMobile = ref<HTMLCanvasElement | null>(null)     // mobile
const nextCanvasRefMobile = ref<HTMLCanvasElement | null>(null) // mobile

// ── Reactive state ────────────────────────────────────────────────────
const gameState = ref<GameState>('idle')
const score = ref(0)
const level = ref(1)
const lines = ref(0)
const saving = ref(false)
const savedBest = ref(false)

// ── Composables ───────────────────────────────────────────────────────
const { saveScore } = useGames()
const { user } = useAuth()

// ── Mutable game state ────────────────────────────────────────────────
let board: (string | null)[][] = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null))
let currentPiece: Piece | null = null
let nextPieceType: PieceType | null = null
let animFrameId = 0
let lastTime = 0
let dropTimer = 0

// ── Helpers ───────────────────────────────────────────────────────────
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

// ── Board ops ─────────────────────────────────────────────────────────
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
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) board[ny][nx] = color
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
      r++
    }
  }
  return cleared
}

// ── Piece management ──────────────────────────────────────────────────
function spawnPiece() {
  const type = nextPieceType ?? randomType()
  nextPieceType = randomType()
  const matrix = cloneMatrix(PIECE_MATRICES[type])
  const x = Math.floor((COLS - matrix[0].length) / 2)
  currentPiece = { type, matrix, x, y: 0 }
  if (!isValid(matrix, x, 0)) {
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

// ── Drop ──────────────────────────────────────────────────────────────
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

// ── Rotation ──────────────────────────────────────────────────────────
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

// ── Drawing ───────────────────────────────────────────────────────────
function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string, cell: number, alpha = 1) {
  const x = col * cell
  const y = row * cell
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.fillRect(x + 1, y + 1, cell - 2, 5)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x + 1, y + cell - 6, cell - 2, 5)
  ctx.globalAlpha = 1
}

function drawBoardToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, COLS * cell, ROWS * cell)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, ROWS * cell); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(COLS * cell, r * cell); ctx.stroke()
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]!, cell)
    }
  }
}

function drawGhostToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  if (!currentPiece) return
  let ghostY = currentPiece.y
  while (isValid(currentPiece.matrix, currentPiece.x, ghostY + 1)) ghostY++
  if (ghostY === currentPiece.y) return
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, ghostY + r, color, cell, 0.18)
    }
  }
}

function drawCurrentToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  if (!currentPiece) return
  drawGhostToCtx(ctx, cell)
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, currentPiece.y + r, color, cell)
    }
  }
}

function drawNextToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  if (!nextPieceType) return
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, cell * 4, cell * 4)
  const matrix = PIECE_MATRICES[nextPieceType]
  const color = PIECE_COLORS[nextPieceType]
  const offsetX = Math.floor((4 - matrix[0].length) / 2)
  const offsetY = Math.floor((4 - matrix.length) / 2)
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) drawCell(ctx, offsetX + c, offsetY + r, color, cell)
    }
  }
}

function render() {
  // Desktop
  const ctx = canvasRef.value?.getContext('2d')
  if (ctx) {
    drawBoardToCtx(ctx, CELL)
    drawCurrentToCtx(ctx, CELL)
  }
  const nctx = nextCanvasRef.value?.getContext('2d')
  if (nctx) drawNextToCtx(nctx, CELL)

  // Mobile
  const mctx = canvasRefMobile.value?.getContext('2d')
  if (mctx) {
    drawBoardToCtx(mctx, CELL_M)
    drawCurrentToCtx(mctx, CELL_M)
  }
  const mnctx = nextCanvasRefMobile.value?.getContext('2d')
  if (mnctx) drawNextToCtx(mnctx, CELL_M)
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

// ── Keyboard controls ─────────────────────────────────────────────────
function handleKey(e: KeyboardEvent) {
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    if (e.key === 'Enter') startGame()
    return
  }
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault(); togglePause(); return
  }
  if (gameState.value !== 'playing' || !currentPiece) return

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) currentPiece.x--
      break
    case 'ArrowRight':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) currentPiece.x++
      break
    case 'ArrowDown':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++; score.value += 1; dropTimer = 0
      }
      break
    case 'ArrowUp':
    case 'z':
    case 'Z':
      e.preventDefault(); tryRotate(); break
    case ' ':
      e.preventDefault(); hardDrop(); break
  }
}

// ── Touch controls ────────────────────────────────────────────────────
let touchStartX = 0
let touchStartY = 0
let touchStartTime = 0
let lastTouchX = 0
let lastTouchY = 0
let dragAccumX = 0  // sub-cell horizontal accumulator

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = lastTouchX = t.clientX
  touchStartY = lastTouchY = t.clientY
  touchStartTime = Date.now()
  dragAccumX = 0
}

function onTouchMove(e: TouchEvent) {
  if (gameState.value !== 'playing' || !currentPiece) return
  const t = e.touches[0]
  const dx = t.clientX - lastTouchX
  const dy = t.clientY - lastTouchY

  // Horizontal drag → move piece left/right
  dragAccumX += dx
  const colStep = Math.trunc(dragAccumX / CELL_M)
  if (colStep !== 0) {
    const dir = colStep > 0 ? 1 : -1
    const steps = Math.abs(colStep)
    for (let i = 0; i < steps; i++) {
      if (isValid(currentPiece.matrix, currentPiece.x + dir, currentPiece.y))
        currentPiece.x += dir
    }
    dragAccumX -= colStep * CELL_M
  }

  // Downward drag → soft drop (every half-cell of movement)
  if (dy > CELL_M * 0.5) {
    const rows = Math.floor(dy / (CELL_M * 0.5))
    for (let i = 0; i < rows; i++) {
      if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++
        score.value += 1
      }
    }
    dropTimer = 0
    lastTouchY = t.clientY
  }

  lastTouchX = t.clientX
}

function onTouchEnd(e: TouchEvent) {
  if (gameState.value === 'idle' || gameState.value === 'gameover') {
    startGame(); return
  }
  if (gameState.value === 'paused') {
    togglePause(); return
  }
  if (gameState.value !== 'playing' || !currentPiece) return

  const t = e.changedTouches[0]
  const totalDx = t.clientX - touchStartX
  const totalDy = t.clientY - touchStartY
  const dt = Date.now() - touchStartTime
  const absDx = Math.abs(totalDx)
  const absDy = Math.abs(totalDy)

  // Tap (very little movement, quick) → rotate
  if (absDx < 12 && absDy < 12 && dt < 300) {
    tryRotate()
    return
  }

  // Fast upward swipe → hard drop
  const velocityY = absDy / dt
  if (totalDy < -40 && velocityY > 0.4 && absDy > absDx) {
    hardDrop()
  }
}

// ── Game management ───────────────────────────────────────────────────
function startGame() {
  cancelAnimationFrame(animFrameId)
  score.value = 0; level.value = 1; lines.value = 0
  saving.value = false; savedBest.value = false; dropTimer = 0
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
