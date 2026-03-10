<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="start-date">Start date</label>
        <input
          id="start-date"
          v-model="startDate"
          type="date"
          class="form-input"
          required
          @change="syncEndDate"
        >
      </div>
      <div>
        <label class="form-label" for="end-date">End date</label>
        <input
          id="end-date"
          v-model="endDate"
          type="date"
          class="form-input"
          required
        >
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="form-label" for="type">Day type</label>
        <select id="type" v-model="type" class="form-input" required>
          <option v-for="opt in types" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="new-type">Add new type</label>
        <div class="flex gap-2">
          <input
            id="new-type"
            v-model="newType"
            type="text"
            placeholder="e.g. Special PTO"
            class="form-input flex-1"
            maxlength="80"
          >
          <AppButton type="button" variant="secondary" size="sm" :disabled="!newTypeTrimmed" @click="handleAddType">
            Add
          </AppButton>
        </div>
      </div>
    </div>

    <div>
      <label class="form-label" for="reason">Notes</label>
      <textarea
        id="reason"
        v-model="reason"
        rows="3"
        class="form-input"
        placeholder="Contexto breve (opcional)"
        maxlength="500"
      ></textarea>
    </div>

    <div class="bg-brand-800/50 border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-2 text-sm">
      <div class="flex items-center justify-between text-white">
        <span class="font-semibold">Working days requested</span>
        <span class="font-mono text-base">{{ dayCount }}</span>
      </div>
      <div class="flex items-center justify-between text-slate-300">
      <span>Available this month</span>
        <span class="font-mono" :class="overLimit ? 'text-rose-300' : 'text-emerald-300'">
          {{ availableDays }}
        </span>
      </div>
    <p v-if="overLimit" class="text-xs text-rose-300">Request exceeds available days.</p>
    <p v-else-if="dayCount === 0" class="text-xs text-amber-300">No working days in the selected range.</p>
    <p v-if="shortNotice" class="text-xs text-amber-300">Heads-up: less than {{ threshold }} days notice.</p>
    </div>

    <p v-if="error" class="text-xs text-rose-300">{{ error }}</p>

    <div class="flex gap-3">
      <AppButton type="submit" class="flex-1" :loading="loading" :disabled="dayCount === 0 || overLimit">Save request</AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CreateTimeOffPayload } from '~/types/timeoff.types'

const props = defineProps<{ types: string[]; loading?: boolean; availableDays: number; shortNoticeThreshold?: number }>()
const emit = defineEmits<{ submit: [payload: CreateTimeOffPayload]; 'add-type': [label: string] }>()

const startDate = ref('')
const endDate = ref('')
const type = ref('')
const reason = ref('')
const error = ref('')
const newType = ref('')

const threshold = computed(() => props.shortNoticeThreshold ?? 15)

watch(() => props.types, (list) => {
  if (!type.value && list.length) type.value = list[0]
}, { immediate: true })

function syncEndDate() {
  if (endDate.value && startDate.value && endDate.value < startDate.value) {
    endDate.value = startDate.value
  }
}

const dayCount = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0
  let count = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
})

const overLimit = computed(() => dayCount.value > props.availableDays)

const shortNotice = computed(() => {
  if (!startDate.value) return false
  const start = new Date(startDate.value)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = start.getTime() - today.getTime()
  const days = Math.floor(diff / 86_400_000)
  return days < threshold.value
})

const newTypeTrimmed = computed(() => newType.value.trim())

function reset() {
  startDate.value = ''
  endDate.value = ''
  reason.value = ''
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  if (!startDate.value || !endDate.value || !type.value) {
    error.value = 'Please select dates and a type.'
    return
  }
  if (dayCount.value === 0) {
    error.value = 'Select valid working days.'
    return
  }
  emit('submit', {
    startDate: startDate.value,
    endDate: endDate.value,
    type: type.value,
    reason: reason.value.trim() || undefined,
  })
  reset()
}

function handleAddType() {
  const label = newTypeTrimmed.value
  if (!label) return
  emit('add-type', label)
  newType.value = ''
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-slate-300 mb-1.5;
}
.form-input {
  @apply w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-300/70 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition;
}
</style>
