<template>
  <div
    class="absolute left-0.5 right-0.5 rounded-lg px-1.5 overflow-hidden cursor-pointer select-none border border-white/10 transition-all hover:brightness-110 hover:z-10"
    :class="colorClass"
    :style="chipStyle"
    @click.stop="$emit('click', event)"
  >
    <p class="text-xs font-semibold text-white leading-tight truncate pt-0.5">{{ event.title }}</p>
    <p v-if="tallEnough" class="text-[10px] text-white/70 truncate">{{ timeRange }}</p>
    <span
      v-if="event.isVirtual && tallEnough"
      class="inline-flex items-center gap-0.5 text-[9px] text-white/60 mt-0.5"
    >
      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Virtual
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types/event.types'

const props = defineProps<{
  event: CalendarEvent
  pxPerHour: number
}>()

defineEmits<{ click: [event: CalendarEvent] }>()

const COLOR_MAP: Record<string, string> = {
  accent: 'bg-accent-600/80 border-accent-400/40',
  emerald: 'bg-emerald-600/80 border-emerald-400/40',
  blue: 'bg-blue-600/80 border-blue-400/40',
  amber: 'bg-amber-600/80 border-amber-400/40',
  rose: 'bg-rose-600/80 border-rose-400/40',
}

const colorClass = computed(() => COLOR_MAP[props.event.color ?? 'accent'] ?? COLOR_MAP.accent)

const topPx = computed(() => {
  const d = new Date(props.event.startAt)
  return (d.getHours() * 60 + d.getMinutes()) * (props.pxPerHour / 60)
})

const heightPx = computed(() => {
  const start = new Date(props.event.startAt).getTime()
  const end = new Date(props.event.endAt).getTime()
  const mins = Math.max((end - start) / 60000, 15)
  return Math.max(mins * (props.pxPerHour / 60), 20)
})

const tallEnough = computed(() => heightPx.value >= 42)

const chipStyle = computed(() => ({
  top: `${topPx.value}px`,
  height: `${heightPx.value}px`,
  minHeight: '20px',
}))

const timeRange = computed(() => {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${fmt(props.event.startAt)} – ${fmt(props.event.endAt)}`
})
</script>
