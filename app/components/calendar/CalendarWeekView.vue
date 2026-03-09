<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- Day headers -->
    <div class="flex shrink-0 border-b border-white/10 bg-dark-800/40">
      <!-- Time gutter spacer -->
      <div class="w-14 shrink-0 border-r border-white/5" />
      <!-- Day labels -->
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="flex-1 text-center py-2 border-l border-white/5 first:border-l-0"
        :class="isToday(day) ? 'text-accent-400' : 'text-slate-400'"
      >
        <p class="text-[10px] font-medium uppercase tracking-wider">{{ dayName(day) }}</p>
        <p
          class="text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full transition-colors"
          :class="isToday(day) ? 'bg-accent-500 text-white' : 'text-white'"
        >
          {{ day.getDate() }}
        </p>
      </div>
    </div>

    <!-- Scrollable grid -->
    <div ref="scrollEl" class="flex-1 overflow-y-auto">
      <div class="flex" :style="{ height: totalHeight + 'px' }">
        <!-- Time gutter -->
        <div class="w-14 shrink-0 relative border-r border-white/5">
          <div
            v-for="h in 23"
            :key="h"
            class="absolute right-2 -translate-y-2 text-[10px] text-slate-500 select-none tabular-nums"
            :style="{ top: h * pxPerHour + 'px' }"
          >
            {{ formatHour(h) }}
          </div>
        </div>

        <!-- Day columns -->
        <CalendarDayColumn
          v-for="day in weekDays"
          :key="day.toISOString()"
          :day="day"
          :events="eventsForDay(day)"
          :px-per-hour="pxPerHour"
          @event-click="$emit('event-click', $event)"
          @slot-click="$emit('slot-click', $event.day, $event.hour, $event.minute)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CalendarEvent } from '~/types/event.types'

const props = defineProps<{
  weekDays: Date[]
  events: CalendarEvent[]
  pxPerHour?: number
}>()

const emit = defineEmits<{
  'event-click': [event: CalendarEvent]
  'slot-click': [day: Date, hour: number, minute: number]
}>()

const pxPerHour = computed(() => props.pxPerHour ?? 64)
const totalHeight = computed(() => pxPerHour.value * 24)
const scrollEl = ref<HTMLElement | null>(null)

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayName(d: Date) { return DAY_NAMES[d.getDay()] }

function isToday(d: Date) {
  const t = new Date()
  return d.toDateString() === t.toDateString()
}

function formatHour(h: number) {
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12} ${ampm}`
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
}

function eventsForDay(day: Date): CalendarEvent[] {
  return props.events.filter(e => isSameDay(new Date(e.startAt), day))
}

// Scroll to 7 AM on mount
onMounted(() => {
  if (scrollEl.value) {
    scrollEl.value.scrollTop = pxPerHour.value * 7
  }
})
</script>
