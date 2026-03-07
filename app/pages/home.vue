<template>
  <div class="flex-1 px-4 md:px-8 py-8 max-w-4xl mx-auto w-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">
          Good {{ greeting }}, {{ firstName }}!
        </h1>
        <p class="text-slate-400 text-sm mt-1">Ready for your next meeting?</p>
      </div>
      <AppButton variant="primary" size="md" @click="showCreateModal = true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Meeting
      </AppButton>
    </div>

    <!-- Quick join by link -->
    <div class="bg-dark-800/60 border border-white/10 rounded-2xl p-5 mb-8">
      <h2 class="text-sm font-semibold text-slate-300 mb-3">Join with a link</h2>
      <div class="flex gap-2">
        <input
          v-model="joinLink"
          type="text"
          placeholder="Paste meeting link or ID..."
          class="flex-1 bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          @keydown.enter="handleJoinByLink"
        />
        <AppButton variant="primary" :disabled="!joinLink.trim()" @click="handleJoinByLink">
          Join
        </AppButton>
      </div>
      <p v-if="joinError" class="mt-2 text-red-400 text-xs">{{ joinError }}</p>
    </div>

    <!-- Recent meetings -->
    <div>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Your meetings</h2>

      <div v-if="meetings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
        />
      </div>

      <div v-else class="text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-slate-400 text-sm">No meetings yet.</p>
        <p class="text-slate-500 text-xs mt-1">Create one to get started!</p>
      </div>
    </div>

    <!-- Create Meeting Modal -->
    <CreateMeetingModal
      v-model="showCreateModal"
      @created="handleMeetingCreated"
    />

    <!-- Toast -->
    <AppToast ref="toast" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { user } = useAuth()
const { meetings } = useMeeting()
const router = useRouter()

const showCreateModal = ref(false)
const joinLink = ref('')
const joinError = ref('')
const toast = ref<{ show: (msg: string, type?: string) => void } | null>(null)

const firstName = computed(() => user.value?.displayName.split(' ')[0] ?? 'there')
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
})

function handleMeetingCreated(meetingId: string) {
  toast.value?.show('Meeting created!', 'success')
  router.push(`/meet/${meetingId}`)
}

function handleJoinByLink() {
  joinError.value = ''
  const val = joinLink.value.trim()
  if (!val) return

  // Accept full URL or just ID
  let id = val
  try {
    const url = new URL(val)
    const parts = url.pathname.split('/')
    id = parts[parts.length - 1] ?? val
  }
  catch { /* not a URL, treat as ID */ }

  if (!id) {
    joinError.value = 'Invalid meeting link or ID.'
    return
  }
  router.push(`/meet/${id}`)
}
</script>
