<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 group',
      game.available
        ? 'bg-brand-800/40 border-white/10 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 cursor-pointer'
        : 'bg-brand-800/20 border-white/5 opacity-50 cursor-not-allowed',
    ]"
    @click="game.available && emit('play', game.id)"
  >
    <!-- Background gradient -->
    <div :class="['absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', game.color]" />

    <div class="relative z-10">
      <!-- Emoji icon -->
      <div class="text-4xl mb-4">{{ game.emoji }}</div>

      <!-- Title -->
      <h3 class="font-bold text-white text-lg mb-1.5">{{ game.title }}</h3>

      <!-- Description -->
      <p class="text-sm text-slate-400 leading-relaxed mb-5">{{ game.description }}</p>

      <!-- Footer row -->
      <div class="flex items-center justify-between">
        <span
          v-if="game.available"
          class="inline-flex items-center gap-1.5 text-xs text-accent-400 font-medium"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
          Available
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 text-xs text-slate-500"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-slate-600" />
          Coming soon
        </span>

        <span
          v-if="game.available"
          class="text-xs text-slate-500 group-hover:text-accent-400 transition-colors duration-200 font-medium"
        >
          Play →
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameDefinition } from '~/types/games.types'

defineProps<{ game: GameDefinition }>()
const emit = defineEmits<{ play: [id: string] }>()
</script>
