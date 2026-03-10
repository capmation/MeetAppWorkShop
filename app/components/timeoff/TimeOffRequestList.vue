<template>
  <div class="space-y-3">
    <div v-if="!requests.length" class="border border-dashed border-white/10 rounded-xl p-6 text-center text-slate-300">
      No requests yet.
    </div>

    <div
      v-for="request in requests"
      :key="request.id"
      class="border border-white/10 rounded-2xl bg-brand-900/70 p-4 flex flex-col gap-3 shadow-sm shadow-black/30"
    >
      <div class="flex flex-wrap items-start gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center h-8 px-3 rounded-full bg-accent-500/15 text-accent-200 text-sm font-semibold">
            {{ request.type }}
          </span>
          <span class="text-xs text-slate-400">{{ request.days }} days</span>
        </div>
        <div class="flex items-center gap-2 ml-auto text-sm text-white">
          <span class="font-semibold">{{ formatDate(request.startDate) }}</span>
          <span class="text-slate-500">→</span>
          <span class="font-semibold">{{ formatDate(request.endDate) }}</span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span :class="statusClass(request.status)" class="px-3 py-1 rounded-full font-semibold uppercase tracking-wide">
          {{ request.status }}
        </span>
        <span v-if="request.shortNotice" class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
          Less than 15 days notice
        </span>
        <span v-if="request.reason" class="text-slate-300 truncate max-w-md">{{ request.reason }}</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <AppButton
          size="sm"
          variant="primary"
          :disabled="request.status === 'approved' || loading"
          @click="$emit('change-status', request.id, 'approved')"
        >
          Approve and sync to calendar
        </AppButton>
        <AppButton
          size="sm"
          variant="secondary"
          :disabled="request.status === 'pending' || loading"
          @click="$emit('change-status', request.id, 'pending')"
        >
          Mark pending
        </AppButton>
        <AppButton
          size="sm"
          variant="danger"
          :disabled="request.status === 'rejected' || loading"
          @click="$emit('change-status', request.id, 'rejected')"
        >
          Reject
        </AppButton>
        <AppButton
          size="sm"
          variant="ghost"
          class="ml-auto"
          :disabled="loading"
          @click="$emit('delete', request.id)"
        >
          Delete
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimeOffRequest, TimeOffStatus } from '~/types/timeoff.types'

defineProps<{ requests: TimeOffRequest[]; loading?: boolean }>()

defineEmits<{ 'change-status': [id: string, status: TimeOffStatus]; delete: [id: string] }>()

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusClass(status: TimeOffStatus): string {
  if (status === 'approved') return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
  if (status === 'rejected') return 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
  return 'bg-amber-500/15 text-amber-100 border border-amber-500/30'
}
</script>
