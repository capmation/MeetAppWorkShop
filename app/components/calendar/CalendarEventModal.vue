<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-[200] flex items-center justify-center px-4"
        @click.self="$emit('close')"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Panel with spring animation -->
        <Transition name="modal-panel" appear>
          <div class="relative w-full max-w-md bg-brand-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 class="text-white font-semibold text-base">
              {{ isEditing ? 'Edit event' : 'New event' }}
            </h2>
            <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-colors" @click="$emit('close')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="flex flex-col gap-4 p-5" @submit.prevent="handleSave">
            <!-- Title -->
            <div>
              <label class="block text-xs text-slate-400 mb-1.5 font-medium">Title *</label>
              <input
                v-model="form.title"
                type="text"
                required
                maxlength="80"
                placeholder="Event title"
                class="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-400/60 transition-colors"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
              <textarea
                v-model="form.description"
                rows="2"
                maxlength="300"
                placeholder="Optional description"
                class="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-400/60 transition-colors resize-none"
              />
            </div>

            <!-- Date + Times -->
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-3 sm:col-span-1">
                <label class="block text-xs text-slate-400 mb-1.5 font-medium">Date *</label>
                <input
                  v-model="form.date"
                  type="date"
                  required
                  class="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-400/60 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1.5 font-medium">Start *</label>
                <input
                  v-model="form.startTime"
                  type="time"
                  required
                  class="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-400/60 transition-colors"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1.5 font-medium">End *</label>
                <input
                  v-model="form.endTime"
                  type="time"
                  required
                  class="w-full bg-dark-700 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-400/60 transition-colors"
                />
              </div>
            </div>

            <!-- Color -->
            <div>
              <label class="block text-xs text-slate-400 mb-2 font-medium">Color</label>
              <div class="flex items-center gap-2">
                <button
                  v-for="c in COLORS"
                  :key="c.value"
                  type="button"
                  :class="['w-6 h-6 rounded-full border-2 transition-transform', c.bg, form.color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105']"
                  @click="form.color = c.value"
                />
              </div>
            </div>

            <!-- Virtual toggle -->
            <label class="flex items-center gap-3 cursor-pointer group">
              <div
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="form.isVirtual ? 'bg-accent-500' : 'bg-dark-600 border border-white/10'"
                @click="form.isVirtual = !form.isVirtual"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  :class="form.isVirtual ? 'translate-x-5' : 'translate-x-0'"
                />
              </div>
              <div>
                <p class="text-sm text-white font-medium">Virtual meeting</p>
                <p class="text-xs text-slate-400">Generates a video call room</p>
              </div>
            </label>

            <!-- Error -->
            <p v-if="error" class="text-xs text-rose-400">{{ error }}</p>

            <!-- Actions -->
            <div class="flex items-center gap-3 pt-1">
              <!-- Join button (edit mode + virtual + has meetingId) -->
              <button
                v-if="isEditing && event?.isVirtual && event?.meetingId"
                type="button"
                class="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition"
                @click="joinMeeting"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join
              </button>

              <!-- Delete (edit mode) -->
              <button
                v-if="isEditing"
                type="button"
                class="text-xs px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                :disabled="saving"
                @click="$emit('delete', event!.id)"
              >
                Delete
              </button>

              <div class="flex-1" />

              <button
                type="button"
                class="text-xs px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition"
                @click="$emit('close')"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="text-xs px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-medium transition disabled:opacity-50"
                :disabled="saving"
              >
                {{ saving ? 'Saving…' : (isEditing ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CalendarEvent, EventColor, CreateEventPayload, UpdateEventPayload } from '~/types/event.types'

const props = defineProps<{
  event?: CalendarEvent | null
  // Pre-fill date/time when clicking an empty slot
  prefillDate?: string  // YYYY-MM-DD
  prefillStart?: string // HH:MM
  prefillEnd?: string   // HH:MM
}>()

const emit = defineEmits<{
  save: [payload: CreateEventPayload | UpdateEventPayload, id?: string]
  delete: [id: string]
  close: []
}>()

const router = useRouter()
const saving = ref(false)
const error = ref('')
const isEditing = computed(() => !!props.event)

const COLORS = [
  { value: 'accent', bg: 'bg-accent-500' },
  { value: 'emerald', bg: 'bg-emerald-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'amber', bg: 'bg-amber-500' },
  { value: 'rose', bg: 'bg-rose-500' },
] as { value: EventColor, bg: string }[]

function defaultForm() {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const startH = pad(today.getHours())
  const endH = pad(today.getHours() + 1)
  return {
    title: '',
    description: '',
    date: props.prefillDate ?? todayStr,
    startTime: props.prefillStart ?? `${startH}:00`,
    endTime: props.prefillEnd ?? `${endH}:00`,
    isVirtual: false,
    color: 'accent' as EventColor,
  }
}

const form = ref(defaultForm())

// Populate form when editing
watch(() => props.event, (evt) => {
  if (!evt) {
    form.value = defaultForm()
    return
  }
  const start = new Date(evt.startAt)
  const end = new Date(evt.endAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  form.value = {
    title: evt.title,
    description: evt.description ?? '',
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    isVirtual: evt.isVirtual,
    color: evt.color ?? 'accent',
  }
}, { immediate: true })

// Also apply prefill when slot is clicked
watch(() => [props.prefillDate, props.prefillStart, props.prefillEnd], () => {
  if (!props.event) form.value = defaultForm()
})

function buildISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

async function handleSave() {
  error.value = ''
  const { title, description, date, startTime, endTime, isVirtual, color } = form.value
  if (!title.trim()) { error.value = 'Title is required'; return }
  if (startTime >= endTime) { error.value = 'End time must be after start time'; return }

  saving.value = true
  try {
    const startAt = buildISO(date, startTime)
    const endAt = buildISO(date, endTime)

    if (isEditing.value && props.event) {
      const patch: UpdateEventPayload = { title: title.trim(), description, startAt, endAt, color }
      emit('save', patch, props.event.id)
    }
    else {
      const payload: CreateEventPayload = { title: title.trim(), description, startAt, endAt, isVirtual, color }
      emit('save', payload)
    }
  }
  finally {
    saving.value = false
  }
}

function joinMeeting() {
  if (props.event?.meetingId) router.push(`/meet/${props.event.meetingId}`)
}
</script>

<style scoped>
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(0.6);
  cursor: pointer;
}
</style>
