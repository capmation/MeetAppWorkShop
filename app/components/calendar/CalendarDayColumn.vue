<template>
  <div
    class="relative flex-1 border-l border-white/5 min-w-0"
    :style="{ height: totalHeight + 'px' }"
  >
    <!-- Hour grid lines -->
    <template v-for="h in 24" :key="h">
      <div
        class="absolute w-full border-t border-white/[0.06]"
        :style="{ top: h * pxPerHour + 'px' }"
      />
      <div
        class="absolute w-full border-t border-white/[0.03]"
        :style="{ top: h * pxPerHour + pxPerHour / 2 + 'px' }"
      />
    </template>

    <!-- Current time indicator (today only) -->
    <div
      v-if="isToday"
      class="absolute left-0 right-0 z-20 pointer-events-none"
      :style="{ top: nowPx + 'px' }"
    >
      <div class="flex items-center">
        <span class="w-2 h-2 rounded-full bg-rose-400 shrink-0 -ml-1" />
        <div class="flex-1 h-px bg-rose-400" />
      </div>
    </div>

    <!-- Events -->
    <CalendarEventChip
      v-for="evt in events"
      :key="evt.id"
      :event="evt"
      :px-per-hour="pxPerHour"
      class="z-10"
      @click="$emit('event-click', evt)"
    />

    <!-- Clickable slot layer -->
    <div
      class="absolute inset-0 z-0"
      @click="handleSlotClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEvent } from '~/types/event.types'

const props = defineProps<{
  day: Date
  events: CalendarEvent[]
  pxPerHour: number
}>()

const emit = defineEmits<{
  'event-click': [event: CalendarEvent]
  'slot-click': [day: Date, hour: number, minute: number]
}>()

const totalHeight = computed(() => props.pxPerHour * 24)

const isToday = computed(() => {
  const today = new Date()
  return props.day.toDateString() === today.toDateString()
})

const nowPx = computed(() => {
  const now = new Date()
  return (now.getHours() * 60 + now.getMinutes()) * (props.pxPerHour / 60)
})

function handleSlotClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const relY = e.clientY - rect.top
  const totalMins = (relY / props.pxPerHour) * 60
  const hour = Math.floor(totalMins / 60)
  const minute = Math.floor((totalMins % 60) / 15) * 15
  emit('slot-click', props.day, Math.min(hour, 23), Math.min(minute, 45))
}
</script>
