<template>
  <div
    ref="gameRoot"
    class="flex flex-col items-center gap-4 outline-none select-none w-full"
    tabindex="0"
    @keydown="handleKey"
  >

    <!-- ── Opponent boards ───────────────────────────────────────────── -->
    <div v-if="opponents.length > 0" class="flex items-start gap-3 flex-wrap justify-center">
      <OpponentMiniBoard
        v-for="opp in opponents"
        :key="opp.uid"
        :player="opp"
        :rows="mp.opponentBoards.value[opp.uid] ?? null"
        :eliminated="opp.uid in mp.eliminatedPlayers.value"
        :final-score="mp.eliminatedPlayers.value[opp.uid]"
        :is-winner="isWinner(opp.uid)"
      />
    </div>

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
          <span class="stat-label">Lines</span>
          <span class="stat-val">{{ lines }}</span>
        </div>
        <!-- Garbage indicator (mini) -->
        <div class="stat-pill px-1.5 py-1.5">
          <span class="stat-label mb-1">⚠️</span>
          <div class="flex flex-col gap-0.5">
            <div
              v-for="i in 5"
              :key="i"
              :class="['w-4 h-1 rounded-full', i <= mp.pendingGarbage.value ? 'bg-rose-500' : 'bg-white/10']"
            />
          </div>
        </div>
        <!-- Next piece -->
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

        <Transition name="t-fade">
          <div
            v-if="gamePhase === 'waiting'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/95"
          >
            <p class="text-4xl mb-2">⚔️</p>
            <p class="text-base font-bold text-white mb-1">Battle Tetris</p>
            <p class="text-xs text-slate-400">Starting…</p>
          </div>
        </Transition>

        <Transition name="t-fade">
          <div
            v-if="gamePhase === 'eliminated'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/90"
          >
            <p class="text-4xl mb-2">💀</p>
            <p class="text-base font-bold text-white mb-1">Eliminated!</p>
            <p class="text-xl font-mono font-bold text-rose-400 mb-1">{{ score.toLocaleString() }}</p>
            <p class="text-xs text-slate-400">Watching…</p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         DESKTOP layout  (md+)
    ═══════════════════════════════════════════════════════════════ -->
    <div class="hidden md:flex gap-4 items-start">

      <!-- Left: stats -->
      <div class="flex flex-col gap-3 w-24">
        <div class="info-panel">
          <p class="info-label">Score</p>
          <p class="info-value font-mono text-base">{{ score.toLocaleString() }}</p>
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
          <p class="info-label mb-1.5">Incoming</p>
          <div class="flex flex-col gap-0.5">
            <div
              v-for="i in 8"
              :key="i"
              :class="['h-1.5 rounded-full transition-all duration-200', i <= mp.pendingGarbage.value ? 'bg-rose-500' : 'bg-white/10']"
            />
          </div>
        </div>
      </div>

      <!-- Game canvas -->
      <div class="relative">
        <canvas
          ref="canvasRef"
          :width="COLS * CELL"
          :height="ROWS * CELL"
          class="rounded-xl border border-white/20 block bg-brand-900"
        />
        <Transition name="t-fade">
          <div
            v-if="gamePhase === 'waiting'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/95"
          >
            <p class="text-4xl mb-3">⚔️</p>
            <p class="text-lg font-bold text-white mb-1">Battle Tetris</p>
            <p class="text-xs text-slate-400">Starting…</p>
          </div>
        </Transition>
        <Transition name="t-fade">
          <div
            v-if="gamePhase === 'eliminated'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/90"
          >
            <p class="text-5xl mb-3">💀</p>
            <p class="text-lg font-bold text-white mb-1">Eliminated!</p>
            <p class="text-2xl font-mono font-bold text-rose-400 mb-1">{{ score.toLocaleString() }}</p>
            <p class="text-xs text-slate-400">Watching remaining players…</p>
          </div>
        </Transition>
      </div>

      <!-- Right: next piece + keys -->
      <div class="flex flex-col gap-3 w-24">
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
          <p class="info-label mb-1.5">Keys</p>
          <div class="space-y-1">
            <div v-for="c in CONTROLS_HINT" :key="c.key" class="flex items-start gap-1">
              <kbd class="mt-0.5 shrink-0 text-[9px] bg-brand-700 border border-white/10 px-1 py-0.5 rounded font-mono text-white leading-none">
                {{ c.key }}
              </kbd>
              <span class="text-[10px] text-slate-400 leading-tight">{{ c.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Match-end results overlay ─────────────────────────────────── -->
    <Transition name="t-fade">
      <div
        v-if="mp.matchEnded.value"
        class="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm p-4"
      >
        <div class="rounded-2xl bg-brand-800/95 border border-white/10 p-8 w-full max-w-sm text-center shadow-2xl">
          <p class="text-4xl mb-3">{{ isLocalWinner ? '🏆' : '🎮' }}</p>
          <h3 class="text-xl font-bold text-white mb-1">{{ isLocalWinner ? 'You Won!' : 'Match Over' }}</h3>
          <p class="text-sm text-slate-400 mb-6">Final Rankings</p>
          <ul class="space-y-2 mb-6 text-left">
            <li
              v-for="(r, i) in mp.rankings.value"
              :key="r.uid"
              :class="['flex items-center gap-3 px-4 py-2.5 rounded-xl', r.uid === localUid ? 'bg-accent-500/15 border border-accent-400/20' : 'bg-white/5']"
            >
              <span class="w-6 text-center font-bold text-sm" :class="podiumClass(i)">{{ podiumEmoji(i) }}</span>
              <AppAvatar :name="r.displayName" :photo="r.photoURL" size="xs" />
              <span class="flex-1 text-sm text-white truncate">
                {{ r.displayName }}
                <span v-if="r.uid === localUid" class="text-[10px] text-accent-400 ml-1">(you)</span>
              </span>
              <span class="font-mono text-sm text-white shrink-0">{{ r.finalScore.toLocaleString() }}</span>
            </li>
          </ul>
          <button class="btn-primary w-full py-3" @click="onLeave">Back to Lobby</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { TetrisMatchPlayer, TetrisRanking } from '~/types/socket.types'

// ── Props / Emits ─────────────────────────────────────────────────────
const props = defineProps<{
  matchId: string
  players: TetrisMatchPlayer[]
}>()

const emit = defineEmits<{
  leave: []
  matchEnd: [rankings: TetrisRanking[]]
}>()

// ── Constants ─────────────────────────────────────────────────────────
const COLS = 10
const ROWS = 20
const CELL = 28    // desktop
const CELL_M = 26  // mobile (260px wide — fits all phones)

const SPEEDS = [800, 700, 600, 500, 400, 300, 250, 200, 150, 100]
const SCORE_TABLE = [0, 100, 300, 500, 800]
const GARBAGE_TABLE = [0, 0, 1, 2, 4]

const CONTROLS_HINT = [
  { key: '← →', action: 'Move' },
  { key: '↑/Z', action: 'Rotate' },
  { key: '↓', action: 'Soft drop' },
  { key: 'Spc', action: 'Hard drop' },
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

interface Piece {
  type: PieceType
  matrix: number[][]
  x: number
  y: number
}

// ── Composables ───────────────────────────────────────────────────────
const mp = useTetrisMultiplayer()
const { user } = useAuth()

// ── Refs ──────────────────────────────────────────────────────────────
const gameRoot = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const nextCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRefMobile = ref<HTMLCanvasElement | null>(null)
const nextCanvasRefMobile = ref<HTMLCanvasElement | null>(null)

// ── Reactive state ────────────────────────────────────────────────────
const score = ref(0)
const level = ref(1)
const lines = ref(0)
type GamePhase = 'waiting' | 'playing' | 'eliminated'
const gamePhase = ref<GamePhase>('waiting')

// ── Computed ──────────────────────────────────────────────────────────
const localUid = computed(() => user.value?.uid ?? '')
const opponents = computed(() => props.players.filter(p => p.uid !== localUid.value))
const isLocalWinner = computed(() => mp.rankings.value.length > 0 && mp.rankings.value[0]?.uid === localUid.value)

function isWinner(uid: string): boolean {
  return mp.matchEnded.value && mp.rankings.value[0]?.uid === uid
}

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
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = matrix[r][c]
  return result
}

function isValid(matrix: number[][], px: number, py: number): boolean {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue
      const nx = px + c, ny = py + r
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
      const ny = currentPiece.y + r, nx = currentPiece.x + c
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
      cleared++; r++
    }
  }
  return cleared
}

function addGarbageLines(count: number) {
  if (count <= 0) return
  const hole = Math.floor(Math.random() * COLS)
  for (let i = 0; i < count; i++) {
    board.shift()
    const row = Array<string | null>(COLS).fill('#4a5568')
    row[hole] = null
    board.push(row)
  }
}

// ── Piece management ──────────────────────────────────────────────────
function spawnPiece() {
  const type = nextPieceType ?? randomType()
  nextPieceType = randomType()
  const matrix = cloneMatrix(PIECE_MATRICES[type])
  const x = Math.floor((COLS - matrix[0].length) / 2)
  currentPiece = { type, matrix, x, y: 0 }
  if (!isValid(matrix, x, 0)) { currentPiece = null; endGame() }
}

function placePiece() {
  lockPiece()
  const cleared = clearLines()
  if (cleared > 0) {
    score.value += SCORE_TABLE[cleared] * level.value
    lines.value += cleared
    level.value = Math.min(10, Math.floor(lines.value / 10) + 1)
    const garb = GARBAGE_TABLE[cleared] ?? 0
    if (garb > 0) mp.sendGarbage(garb)
  }
  addGarbageLines(mp.takePendingGarbage())
  spawnPiece()
  dropTimer = 0
}

// ── Drop ──────────────────────────────────────────────────────────────
function drop() {
  if (!currentPiece) return
  if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) currentPiece.y++
  else placePiece()
}

function hardDrop() {
  if (!currentPiece) return
  while (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
    currentPiece.y++; score.value += 2
  }
  placePiece()
}

function tryRotate() {
  if (!currentPiece) return
  const rotated = rotateCW(currentPiece.matrix)
  for (const kick of [0, -1, 1, -2, 2]) {
    if (isValid(rotated, currentPiece.x + kick, currentPiece.y)) {
      currentPiece.matrix = rotated; currentPiece.x += kick; return
    }
  }
}

// ── Drawing ───────────────────────────────────────────────────────────
function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string, cell: number, alpha = 1) {
  const x = col * cell, y = row * cell
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fillRect(x + 1, y + 1, cell - 2, 4)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(x + 1, y + cell - 5, cell - 2, 4)
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
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]!, cell)
}

function drawCurrentToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  if (!currentPiece) return
  // Ghost
  let ghostY = currentPiece.y
  while (isValid(currentPiece.matrix, currentPiece.x, ghostY + 1)) ghostY++
  if (ghostY !== currentPiece.y) {
    const gc = PIECE_COLORS[currentPiece.type]
    for (let r = 0; r < currentPiece.matrix.length; r++)
      for (let c = 0; c < currentPiece.matrix[r].length; c++)
        if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, ghostY + r, gc, cell, 0.18)
  }
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++)
    for (let c = 0; c < currentPiece.matrix[r].length; c++)
      if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, currentPiece.y + r, color, cell)
}

function drawNextToCtx(ctx: CanvasRenderingContext2D, cell: number) {
  if (!nextPieceType) return
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, cell * 4, cell * 4)
  const matrix = PIECE_MATRICES[nextPieceType]
  const color = PIECE_COLORS[nextPieceType]
  const ox = Math.floor((4 - matrix[0].length) / 2)
  const oy = Math.floor((4 - matrix.length) / 2)
  for (let r = 0; r < matrix.length; r++)
    for (let c = 0; c < matrix[r].length; c++)
      if (matrix[r][c]) drawCell(ctx, ox + c, oy + r, color, cell)
}

function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (ctx) { drawBoardToCtx(ctx, CELL); drawCurrentToCtx(ctx, CELL) }
  const nctx = nextCanvasRef.value?.getContext('2d')
  if (nctx) drawNextToCtx(nctx, CELL)

  const mctx = canvasRefMobile.value?.getContext('2d')
  if (mctx) { drawBoardToCtx(mctx, CELL_M); drawCurrentToCtx(mctx, CELL_M) }
  const mnctx = nextCanvasRefMobile.value?.getContext('2d')
  if (mnctx) drawNextToCtx(mnctx, CELL_M)
}

// ── Board snapshot ────────────────────────────────────────────────────
function getBoardSnapshot(): (string | null)[][] {
  if (!currentPiece) return board
  const snap = board.map(row => [...row])
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (!currentPiece.matrix[r][c]) continue
      const ny = currentPiece.y + r, nx = currentPiece.x + c
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) snap[ny][nx] = color
    }
  }
  return snap
}

// ── Game loop ─────────────────────────────────────────────────────────
function gameLoop(timestamp: number) {
  if (gamePhase.value !== 'playing') return
  const delta = timestamp - lastTime
  lastTime = timestamp
  dropTimer += delta
  const speed = SPEEDS[level.value - 1] ?? SPEEDS[0]
  if (dropTimer >= speed) { dropTimer = 0; drop() }
  render()
  animFrameId = requestAnimationFrame(gameLoop)
}

// ── Keyboard ──────────────────────────────────────────────────────────
function handleKey(e: KeyboardEvent) {
  if (gamePhase.value !== 'playing' || !currentPiece) return
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) currentPiece.x--; break
    case 'ArrowRight':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) currentPiece.x++; break
    case 'ArrowDown':
      e.preventDefault()
      if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++; score.value += 1; dropTimer = 0
      }
      break
    case 'ArrowUp': case 'z': case 'Z':
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
let dragAccumX = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = lastTouchX = t.clientX
  touchStartY = lastTouchY = t.clientY
  touchStartTime = Date.now()
  dragAccumX = 0
}

function onTouchMove(e: TouchEvent) {
  if (gamePhase.value !== 'playing' || !currentPiece) return
  const t = e.touches[0]
  const dx = t.clientX - lastTouchX
  const dy = t.clientY - lastTouchY

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

  if (dy > CELL_M * 0.5) {
    const rows = Math.floor(dy / (CELL_M * 0.5))
    for (let i = 0; i < rows; i++) {
      if (isValid(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++; score.value += 1
      }
    }
    dropTimer = 0
    lastTouchY = t.clientY
  }

  lastTouchX = t.clientX
}

function onTouchEnd(e: TouchEvent) {
  if (gamePhase.value !== 'playing' || !currentPiece) return
  const t = e.changedTouches[0]
  const totalDx = t.clientX - touchStartX
  const totalDy = t.clientY - touchStartY
  const dt = Date.now() - touchStartTime
  const absDx = Math.abs(totalDx)
  const absDy = Math.abs(totalDy)

  // Tap → rotate
  if (absDx < 12 && absDy < 12 && dt < 300) {
    tryRotate(); return
  }
  // Fast upward swipe → hard drop
  if (totalDy < -40 && absDy / dt > 0.4 && absDy > absDx) {
    hardDrop()
  }
}

// ── Game management ───────────────────────────────────────────────────
function startGame() {
  score.value = 0; level.value = 1; lines.value = 0; dropTimer = 0
  initBoard()
  nextPieceType = randomType()
  spawnPiece()
  gamePhase.value = 'playing'
  mp.registerBoardSource(getBoardSnapshot)
  mp.startBoardUpdates()
  nextTick(() => {
    gameRoot.value?.focus()
    lastTime = performance.now()
    animFrameId = requestAnimationFrame(gameLoop)
  })
}

function endGame() {
  gamePhase.value = 'eliminated'
  cancelAnimationFrame(animFrameId)
  render()
  mp.notifyGameOver(score.value, level.value, lines.value)
}

function onLeave() { emit('leave') }

function podiumEmoji(i: number): string {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `#${i + 1}`
}

function podiumClass(i: number): string {
  if (i === 0) return 'text-yellow-400'
  if (i === 1) return 'text-slate-300'
  if (i === 2) return 'text-orange-400'
  return 'text-slate-500 text-xs'
}

// ── Watch match end ───────────────────────────────────────────────────
watch(() => mp.matchEnded.value, (ended) => {
  if (ended) {
    cancelAnimationFrame(animFrameId)
    emit('matchEnd', mp.rankings.value)
  }
})

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  mp.matchId.value = props.matchId
  mp.matchPlayers.value = props.players
  mp.registerEvents()
  nextTick(() => {
    render()
    setTimeout(startGame, 500)
  })
})

onUnmounted(() => {
  cancelAnimationFrame(animFrameId)
  mp.unregisterEvents()
  mp.stopBoardUpdates()
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
.stat-pill {
  @apply rounded-xl bg-brand-800/60 border border-white/10 px-2 py-1.5 text-center flex flex-col items-center justify-center;
}
.stat-label {
  @apply text-[9px] text-slate-500 uppercase tracking-wide leading-none mb-0.5;
}
.stat-val {
  @apply text-sm font-bold text-white leading-none;
}
.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/20;
}
.t-fade-enter-active, .t-fade-leave-active { transition: opacity 0.25s ease; }
.t-fade-enter-from, .t-fade-leave-to { opacity: 0; }
</style>
