<template>
  <div class="bg-dark-800/80 border border-white/10 rounded-2xl p-5 hover:border-brand-500/40 transition-all duration-200 group">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="font-semibold text-white truncate text-base">{{ meeting.title }}</h3>
        <p class="text-slate-400 text-xs mt-1">Hosted by {{ meeting.hostName }}</p>
        <p v-if="meeting.createdAt" class="text-slate-500 text-xs mt-0.5">
          {{ formatRelativeTime(new Date(meeting.createdAt)) }}
        </p>
      </div>
      <!-- Video icon badge -->
      <div class="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center shrink-0 group-hover:bg-brand-600/30 transition-colors">
        <svg class="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4">
      <AppButton size="sm" variant="primary" class="flex-1" @click="joinMeeting">
        Join
      </AppButton>
      <AppButton size="sm" variant="secondary" :class="copied ? 'text-green-400' : ''" @click="copyLink">
        <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ copied ? 'Copied!' : 'Copy link' }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Meeting } from '~/types/meeting.types'
import { formatRelativeTime } from '~/utils/format-date'

const props = defineProps<{ meeting: Meeting }>()
const { copy, copied } = useClipboard()
const { getMeetingLink } = useMeeting()
const router = useRouter()

function joinMeeting() {
  router.push(`/meet/${props.meeting.id}`)
}

async function copyLink() {
  const link = getMeetingLink(props.meeting.id)
  await copy(link)
}
</script>
