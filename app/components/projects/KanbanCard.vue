<template>
  <div
    draggable="true"
    :class="[
      'group relative rounded-xl border p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150',
      cardStyle,
      isDragging ? 'opacity-30 scale-95' : 'hover:border-white/20 hover:shadow-lg hover:shadow-black/30',
    ]"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="$emit('click')"
  >
    <!-- Color accent dot -->
    <div v-if="card.color && card.color !== 'slate'" :class="['absolute top-3 right-3 w-2 h-2 rounded-full shrink-0', dotColor]" />

    <p class="text-sm font-medium text-white leading-snug pr-4">{{ card.title }}</p>

    <p v-if="card.description" class="mt-1 text-xs text-slate-400 line-clamp-2">
      {{ card.description }}
    </p>

    <div v-if="card.dueDate" class="mt-2 flex items-center gap-1 text-xs" :class="isOverdue ? 'text-rose-400' : 'text-slate-500'">
      <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      {{ formatDue(card.dueDate) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KanbanCard } from '~/types/project.types'

const props = defineProps<{ card: KanbanCard; isDragging?: boolean }>()
const emit = defineEmits<{ click: []; dragstart: [card: KanbanCard]; dragend: [] }>()

const cardStyleMap: Record<string, string> = {
  slate: 'bg-brand-800/80 border-white/8',
  accent: 'bg-accent-900/20 border-accent-500/25',
  blue: 'bg-blue-900/20 border-blue-500/25',
  emerald: 'bg-emerald-900/20 border-emerald-500/25',
  rose: 'bg-rose-900/20 border-rose-500/25',
  amber: 'bg-amber-900/20 border-amber-500/25',
}

const dotColorMap: Record<string, string> = {
  accent: 'bg-accent-400',
  blue: 'bg-blue-400',
  emerald: 'bg-emerald-400',
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
}

const cardStyle = computed(() => cardStyleMap[props.card.color ?? 'slate'] ?? cardStyleMap.slate)
const dotColor = computed(() => dotColorMap[props.card.color ?? ''] ?? '')

const isOverdue = computed(() => {
  if (!props.card.dueDate) return false
  return new Date(props.card.dueDate) < new Date()
})

function formatDue(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.card.id)
  emit('dragstart', props.card)
}

function onDragEnd() {
  emit('dragend')
}
</script>
