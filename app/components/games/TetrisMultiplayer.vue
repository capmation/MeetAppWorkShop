<template>
  <div
    ref="gameRoot"
    class="flex flex-col items-center gap-4 outline-none select-none w-full"
    tabindex="0"
    @keydown="handleKey"
  >

    <!-- ── Opponent boards ───────────────────────────────────────────── -->
    <div v-if="opponents.length > 0" class="flex items-start gap-4 flex-wrap justify-center">
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

    <!-- ── Main play area ────────────────────────────────────────────── -->
    <div class="flex gap-4 items-start">

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

        <!-- Garbage incoming indicator -->
        <div class="info-panel">
          <p class="info-label mb-1.5">Incoming</p>
          <div class="flex flex-col gap-0.5">
            <div
              v-for="i in 8"
              :key="i"
              :class="[
                'h-1.5 rounded-full transition-all duration-200',
                i <= mp.pendingGarbage.value ? 'bg-rose-500' : 'bg-white/10',
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

        <!-- Waiting to start -->
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

        <!-- Eliminated overlay -->
        <Transition name="t-fade">
          <div
            v-if="gamePhase === 'eliminated'"
            class="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-900/90"
          >
            <p class="text-5xl mb-3">💀</p>
            <p class="text-lg font-bold text-white mb-1">Eliminated!</p>
            <p class="text-2xl font-mono font-bold text-rose-400 mb-1">
              {{ score.toLocaleString() }}
            </p>
            <p class="text-xs text-slate-400">Watching remaining players…</p>
          </div>
        </Transition>
      </div>

      <!-- Right: next piece -->
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

    <!-- ── Mobile controls ───────────────────────────────────────────── -->
    <div class="flex flex-col items-center gap-2 md:hidden w-full max-w-xs">
      <button class="mobile-btn" @click="handleMobileAction('rotate')">↻ Rotate</button>
      <div class="flex gap-3 w-full">
        <button class="mobile-btn flex-1" @click="handleMobileAction('left')">← Left</button>
        <button class="mobile-btn flex-1" @click="handleMobileAction('right')">Right →</button>
      </div>
      <div class="flex gap-3 w-full">
        <button class="mobile-btn flex-1" @click="handleMobileAction('down')">↓ Drop</button>
        <button class="mobile-btn flex-1 bg-accent-500/20 border-accent-400/30 text-accent-300" @click="handleMobileAction('harddrop')">
          ⬇ Hard
        </button>
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
          <h3 class="text-xl font-bold text-white mb-1">
            {{ isLocalWinner ? 'You Won!' : 'Match Over' }}
          </h3>
          <p class="text-sm text-slate-400 mb-6">Final Rankings</p>

          <ul class="space-y-2 mb-6 text-left">
            <li
              v-for="(r, i) in mp.rankings.value"
              :key="r.uid"
              :class="[
                'flex items-center gap-3 px-4 py-2.5 rounded-xl',
                r.uid === localUid ? 'bg-accent-500/15 border border-accent-400/20' : 'bg-white/5',
              ]"
            >
              <span class="w-6 text-center font-bold text-sm" :class="podiumClass(i)">
                {{ podiumEmoji(i) }}
              </span>
              <AppAvatar :name="r.displayName" :photo="r.photoURL" size="xs" />
              <span class="flex-1 text-sm text-white truncate">
                {{ r.displayName }}
                <span v-if="r.uid === localUid" class="text-[10px] text-accent-400 ml-1">(you)</span>
              </span>
              <span class="font-mono text-sm text-white shrink-0">{{ r.finalScore.toLocaleString() }}</span>
            </li>
          </ul>

          <button class="btn-primary w-full py-3" @click="onLeave">
            Back to Lobby
          </button>
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
const CELL = 28

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

// ── Reactive game state ───────────────────────────────────────────────
const score = ref(0)
const level = ref(1)
const lines = ref(0)
type GamePhase = 'waiting' | 'playing' | 'eliminated'
const gamePhase = ref<GamePhase>('waiting')

// ── Local info ────────────────────────────────────────────────────────
const localUid = computed(() => user.value?.uid ?? '')

const opponents = computed(() =>
  props.players.filter(p => p.uid !== localUid.value),
)

const isLocalWinner = computed(() =>
  mp.rankings.value.length > 0 && mp.rankings.value[0]?.uid === localUid.value,
)

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
      r++
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
  const y = 0

  currentPiece = { type, matrix, x, y }

  if (!isValid(matrix, x, y)) {
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

    // Send garbage to opponents
    const garb = GARBAGE_TABLE[cleared] ?? 0
    if (garb > 0) mp.sendGarbage(garb)
  }

  // Apply any pending garbage received
  const incoming = mp.takePendingGarbage()
  addGarbageLines(incoming)

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

// ── Rotation with wall kicks ───────────────────────────────────────────
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
function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, color: string, alpha = 1) {
  const x = col * CELL
  const y = row * CELL
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.fillRect(x + 1, y + 1, CELL - 2, 4)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(x + 1, y + CELL - 5, CELL - 2, 4)
  ctx.globalAlpha = 1
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke()
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawCell(ctx, c, r, board[r][c]!)
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
      if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, ghostY + r, color, 0.18)
    }
  }
}

function drawCurrent(ctx: CanvasRenderingContext2D) {
  if (!currentPiece) return
  drawGhost(ctx)
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) drawCell(ctx, currentPiece.x + c, currentPiece.y + r, color)
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
      if (matrix[r][c]) drawCell(ctx, offsetX + c, offsetY + r, color)
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

// ── Board snapshot for streaming ──────────────────────────────────────
function getBoardSnapshot(): (string | null)[][] {
  if (!currentPiece) return board

  // Clone board + overlay current piece
  const snapshot = board.map(row => [...row])
  const color = PIECE_COLORS[currentPiece.type]
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (!currentPiece.matrix[r][c]) continue
      const ny = currentPiece.y + r
      const nx = currentPiece.x + c
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        snapshot[ny][nx] = color
      }
    }
  }
  return snapshot
}

// ── Game loop ─────────────────────────────────────────────────────────
function gameLoop(timestamp: number) {
  if (gamePhase.value !== 'playing') return

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
  if (gamePhase.value !== 'playing' || !currentPiece) return

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
  if (gamePhase.value !== 'playing' || !currentPiece) return
  switch (action) {
    case 'left':
      if (isValid(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) currentPiece.x--; break
    case 'right':
      if (isValid(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) currentPiece.x++; break
    case 'rotate': tryRotate(); break
    case 'down': drop(); break
    case 'harddrop': hardDrop(); break
  }
  render()
}

// ── Game management ───────────────────────────────────────────────────
function startGame() {
  score.value = 0
  level.value = 1
  lines.value = 0
  dropTimer = 0

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

function onLeave() {
  emit('leave')
}

// ── Rankings helpers ──────────────────────────────────────────────────
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
    // Brief delay so the component settles before starting
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
.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/20;
}
.mobile-btn {
  @apply rounded-xl border border-white/10 bg-brand-800/60 text-white text-sm font-medium py-3 px-4 active:bg-white/10 transition-colors;
}
.t-fade-enter-active, .t-fade-leave-active { transition: opacity 0.25s ease; }
.t-fade-enter-from, .t-fade-leave-to { opacity: 0; }
</style>
