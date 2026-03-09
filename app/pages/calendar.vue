<template>
  <div class="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

    <!-- Loading -->
    <div v-if="!pageReady" class="flex-1 flex items-center justify-center">
      <AppLoader size="lg" class="text-accent-400" />
    </div>

    <template v-else>
      <!-- Header toolbar -->
      <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-dark-800/60 shrink-0 flex-wrap">
        <!-- Prev / Next / Today -->
        <div class="flex items-center gap-1">
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
            @click="prevWeek"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
            @click="nextWeek"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span class="text-white font-semibold text-sm">{{ weekLabel }}</span>

        <button
          class="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-colors"
          @click="goToday"
        >
          Today
        </button>

        <!-- New event -->
        <button
          class="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-medium transition-colors"
          @click="openCreate()"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New event
        </button>
      </div>

      <!-- Error banner -->
      <div v-if="fetchError" class="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-400">
        {{ fetchError }}
      </div>

      <!-- Calendar grid (directional slide on week change) -->
      <Transition :name="weekDirection" mode="out-in">
        <CalendarWeekView
          :key="weekStart.toISOString()"
          :week-days="weekDays"
          :events="events"
          @event-click="openEdit"
          @slot-click="openCreate"
        />
      </Transition>
    </template>

    <!-- Modal -->
    <CalendarEventModal
      v-if="modalOpen"
      :event="selectedEvent"
      :prefill-date="prefillDate"
      :prefill-start="prefillStart"
      :prefill-end="prefillEnd"
      @save="handleSave"
      @delete="handleDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '~/types/event.types'

definePageMeta({ middleware: 'auth' })

const { idToken, loading: authLoading } = useAuth()
const { events, fetchEvents, createEvent, updateEvent, deleteEvent } = useCalendar()

// ── Auth wait ─────────────────────────────────────────────────────────────
const pageReady = ref(false)
const fetchError = ref('')

async function waitForAuth(): Promise<void> {
  if (!authLoading.value) return
  return new Promise((resolve) => {
    const stop = watch(authLoading, (loading) => {
      if (!loading) { stop(); resolve() }
    })
  })
}

// ── Week navigation ───────────────────────────────────────────────────────
function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const weekStart = ref(startOfWeek(new Date()))
const weekDirection = ref<'week-next' | 'week-prev'>('week-next')

const weekDays = computed<Date[]>(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const s = start.toLocaleDateString(undefined, opts)
  const e = end.toLocaleDateString(undefined, { ...opts, year: 'numeric' })
  return `${s} – ${e}`
})

function prevWeek() {
  weekDirection.value = 'week-prev'
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}

function nextWeek() {
  weekDirection.value = 'week-next'
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}

function goToday() {
  const today = startOfWeek(new Date())
  weekDirection.value = today > weekStart.value ? 'week-next' : 'week-prev'
  weekStart.value = today
}

// ── Fetch on week change ──────────────────────────────────────────────────
async function loadWeek() {
  fetchError.value = ''
  const from = weekDays.value[0].toISOString()
  const to = new Date(weekDays.value[6].getTime() + 86399999).toISOString()
  try {
    await fetchEvents(from, to)
  }
  catch {
    fetchError.value = 'Failed to load events'
  }
}

watch(weekStart, loadWeek)

// ── Modal state ───────────────────────────────────────────────────────────
const modalOpen = ref(false)
const selectedEvent = ref<CalendarEvent | null>(null)
const prefillDate = ref<string | undefined>()
const prefillStart = ref<string | undefined>()
const prefillEnd = ref<string | undefined>()

function openCreate(day?: Date, hour?: number, minute?: number) {
  selectedEvent.value = null
  if (day !== undefined && hour !== undefined) {
    const pad = (n: number) => String(n).padStart(2, '0')
    prefillDate.value = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
    prefillStart.value = `${pad(hour)}:${pad(minute ?? 0)}`
    const endH = hour + 1 > 23 ? 23 : hour + 1
    prefillEnd.value = `${pad(endH)}:${pad(minute ?? 0)}`
  }
  else {
    prefillDate.value = undefined
    prefillStart.value = undefined
    prefillEnd.value = undefined
  }
  modalOpen.value = true
}

function openEdit(event: CalendarEvent) {
  selectedEvent.value = event
  prefillDate.value = undefined
  prefillStart.value = undefined
  prefillEnd.value = undefined
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedEvent.value = null
}

async function handleSave(payload: CreateEventPayload | UpdateEventPayload, id?: string) {
  try {
    if (id) {
      await updateEvent(id, payload as UpdateEventPayload)
    }
    else {
      await createEvent(payload as CreateEventPayload)
    }
    closeModal()
  }
  catch {
    // Error shown via store
  }
}

async function handleDelete(id: string) {
  try {
    await deleteEvent(id)
    closeModal()
  }
  catch {
    // noop
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await waitForAuth()
  pageReady.value = true
  await loadWeek()
})
</script>
