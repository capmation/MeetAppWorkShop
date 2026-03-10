<template>
  <div class="flex flex-col items-center gap-1.5">
    <!-- Player info -->
    <div class="flex items-center gap-1.5 w-full">
      <AppAvatar :name="player.displayName" :photo="player.photoURL" size="xs" />
      <span class="text-[11px] font-medium truncate" :class="eliminated ? 'text-slate-500 line-through' : 'text-white'">
        {{ player.displayName }}
      </span>
      <span v-if="eliminated" class="ml-auto text-[10px] text-rose-400 shrink-0">💀</span>
      <span v-else-if="isWinner" class="ml-auto text-[10px] text-yellow-400 shrink-0">👑</span>
    </div>

    <!-- Mini board canvas -->
    <div class="relative">
      <canvas
        ref="canvasRef"
        :width="COLS * CELL"
        :height="ROWS * CELL"
        class="rounded-lg border block"
        :class="eliminated ? 'border-white/5 opacity-40' : 'border-white/15'"
      />
      <div
        v-if="eliminated"
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-brand-900/60"
      >
        <span class="text-lg">💀</span>
      </div>
    </div>

    <!-- Score -->
    <p class="text-[11px] font-mono text-slate-400">
      {{ score.toLocaleString() }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TetrisMatchPlayer } from '~/types/socket.types'

const props = defineProps<{
  player: TetrisMatchPlayer
  rows: (string | null)[][] | null
  eliminated: boolean
  finalScore?: number
  isWinner?: boolean
}>()

const COLS = 10
const ROWS = 20
const CELL = 7 // small cell size for mini board

const canvasRef = ref<HTMLCanvasElement | null>(null)

const score = computed(() => props.finalScore ?? 0)

function render() {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#040f1f'
  ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

  if (!props.rows) return

  for (let r = 0; r < Math.min(props.rows.length, ROWS); r++) {
    const row = props.rows[r]
    if (!row) continue
    for (let c = 0; c < Math.min(row.length, COLS); c++) {
      const color = row[c]
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1)
      }
    }
  }
}

watch(() => props.rows, render, { deep: false })
onMounted(() => nextTick(render))
</script>
