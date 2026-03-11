<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 group',
      game.available
        ? 'bg-brand-800/40 border-white/10 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 cursor-pointer active:scale-[0.98]'
        : 'bg-brand-800/20 border-white/5 opacity-50 cursor-not-allowed',
    ]"
    @click="handleClick"
  >
    <!-- Background gradient -->
    <div :class="['absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', game.color]" />

    <!-- Loading overlay -->
    <Transition name="t-fade">
      <div
        v-if="loading"
        class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-brand-900/60 backdrop-blur-sm"
      >
        <AppLoader size="md" class="text-accent-400" />
      </div>
    </Transition>

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
          {{ loading ? '…' : 'Play →' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameDefinition } from '~/types/games.types'

const props = defineProps<{ game: GameDefinition }>()
const emit = defineEmits<{ play: [id: string] }>()

const loading = ref(false)

function handleClick() {
  if (!props.game.available || loading.value) return
  loading.value = true
  emit('play', props.game.id)
  // Reset after a short delay (parent will unmount this card)
  setTimeout(() => { loading.value = false }, 600)
}
</script>

<style scoped>
.t-fade-enter-active, .t-fade-leave-active { transition: opacity 0.15s ease; }
.t-fade-enter-from, .t-fade-leave-to { opacity: 0; }
</style>
