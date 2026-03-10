<template>
  <div class="p-4 md:p-8 space-y-6">
    <div class="flex flex-wrap items-start gap-3">
      <div>
        <h1 class="text-2xl font-bold text-white">Time Off Manager</h1>
        <p class="text-slate-300 text-sm">POC to request and approve days off synced with the calendar.</p>
      </div>
      <div class="flex items-center gap-3 ml-auto">
        <label class="text-sm text-slate-300" for="month">Month</label>
        <input
          id="month"
          v-model="selectedMonth"
          type="month"
          class="form-input w-36"
          @change="reload"
        >
        <AppButton variant="primary" @click="modalOpen = true">
          New request
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="stat-card">
        <p class="stat-label">Available days</p>
        <p class="stat-value" :class="remainingDays === 0 ? 'text-rose-300' : 'text-emerald-200'">
          {{ remainingDays }} / 21
        </p>
        <p class="stat-sub">Approved: {{ approvedDays }} days</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Pending</p>
        <p class="stat-value text-amber-200">{{ pendingCount }}</p>
        <p class="stat-sub">Still awaiting decision.</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Warnings</p>
        <p class="stat-value text-amber-200">{{ shortNoticeCount }}</p>
        <p class="stat-sub">Requested with less than 15 days.</p>
      </div>
    </div>

    <div v-if="errorMsg" class="bg-rose-600/15 border border-rose-500/40 text-rose-100 px-4 py-3 rounded-xl text-sm">
      {{ errorMsg }}
    </div>

    <TimeOffRequestList
      :requests="requestsForMonth"
      :loading="actionLoading"
      @change-status="handleStatus"
      @delete="handleDelete"
    />

    <AppModal :model-value="modalOpen" title="Request time off" @update:model-value="modalOpen = $event">
      <TimeOffForm
        :types="types"
        :loading="actionLoading"
        :available-days="remainingDays"
        :short-notice-threshold="SHORT_NOTICE_DAYS"
        @submit="handleCreate"
        @add-type="handleAddType"
      />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import TimeOffForm from '~/components/timeoff/TimeOffForm.vue'
import TimeOffRequestList from '~/components/timeoff/TimeOffRequestList.vue'
import { useTimeOff } from '~/composables/useTimeOff'
import type { CreateTimeOffPayload, TimeOffStatus } from '~/types/timeoff.types'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ middleware: 'auth' })

const SHORT_NOTICE_DAYS = 15
const MONTHLY_ALLOWANCE = 21

const { requests, types, loading, fetchRequests, createRequest, updateStatus, deleteRequest, fetchTypes, addType } = useTimeOff()
const { loading: authLoading } = useAuth()

const modalOpen = ref(false)
const errorMsg = ref('')
const working = ref(false)
const actionLoading = computed(() => loading.value || working.value)

const selectedMonth = ref(currentMonthKey())

const requestsForMonth = computed(() => requests.value.filter(r => r.monthKey === selectedMonth.value))
const approvedDays = computed(() => requestsForMonth.value
  .filter(r => r.status === 'approved')
  .reduce((sum, r) => sum + (r.days ?? 0), 0))
const remainingDays = computed(() => Math.max(MONTHLY_ALLOWANCE - approvedDays.value, 0))
const pendingCount = computed(() => requestsForMonth.value.filter(r => r.status === 'pending').length)
const shortNoticeCount = computed(() => requestsForMonth.value.filter(r => r.shortNotice && r.status !== 'rejected').length)

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

async function reload() {
  errorMsg.value = ''
  try {
    await fetchRequests(selectedMonth.value)
  }
  catch (err) {
    errorMsg.value = (err as Error).message || 'Failed to load requests'
  }
}

async function init() {
  await waitForAuth()
  await Promise.allSettled([fetchTypes(), reload()])
}

onMounted(() => {
  init()
})

function waitForAuth(): Promise<void> | void {
  if (!authLoading.value) return
  return new Promise((resolve) => {
    const stop = watch(authLoading, (val) => {
      if (!val) { stop(); resolve() }
    })
  })
}

async function handleCreate(payload: CreateTimeOffPayload) {
  errorMsg.value = ''
  try {
    working.value = true
    await createRequest(payload)
    modalOpen.value = false
    await reload()
  }
  catch (err) {
    errorMsg.value = (err as Error).message || 'Could not create request'
  }
  finally {
    working.value = false
  }
}

async function handleStatus(id: string, status: TimeOffStatus) {
  errorMsg.value = ''
  try {
    working.value = true
    await updateStatus(id, status)
    await reload()
  }
  catch (err) {
    errorMsg.value = (err as Error).message || 'Could not update status'
  }
  finally {
    working.value = false
  }
}

async function handleDelete(id: string) {
  errorMsg.value = ''
  try {
    working.value = true
    await deleteRequest(id)
    await reload()
  }
  catch (err) {
    errorMsg.value = (err as Error).message || 'Could not delete request'
  }
  finally {
    working.value = false
  }
}

async function handleAddType(label: string) {
  try {
    await addType(label)
  }
  catch (err) {
    errorMsg.value = (err as Error).message || 'Could not add type'
  }
}
</script>

<style scoped>
.stat-card {
  @apply bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-sm shadow-black/30;
}
.stat-label {
  @apply text-slate-300 text-sm;
}
.stat-value {
  @apply text-2xl font-semibold;
}
.stat-sub {
  @apply text-xs text-slate-400;
}
.form-input {
  @apply bg-brand-900/70 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500;
}
</style>
