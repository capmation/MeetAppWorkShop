<template>
  <div class="flex-1 px-4 md:px-8 py-10 max-w-4xl mx-auto w-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-10">
      <div>
        <h1 class="text-3xl font-semibold text-white">
          Good {{ greeting }}, {{ firstName }}!
        </h1>
        <p class="text-neutral-200/70 text-sm mt-2">Ready for your next meeting?</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" size="md" @click="router.push('/teams')">
          Teams view
        </AppButton>
        <AppButton variant="primary" size="md" @click="showCreateModal = true">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Meeting
        </AppButton>
      </div>
    </div>

    <!-- Quick join by link -->
    <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-5 mb-8 shadow-lg shadow-black/20">
      <h2 class="text-sm font-semibold text-neutral-100 mb-3">Join with a link</h2>
      <div class="flex gap-2">
        <input
          v-model="joinLink"
          type="text"
          placeholder="Paste meeting link or ID..."
          class="flex-1 bg-brand-800/80 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-300/70 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
          @keydown.enter="handleJoinByLink"
        />
        <AppButton variant="cta" class="px-6" :disabled="!joinLink.trim()" @click="handleJoinByLink">
          Join now
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </AppButton>
      </div>
      <p v-if="joinError" class="mt-2 text-red-400 text-xs">{{ joinError }}</p>
    </div>

    <!-- Recent meetings -->
    <div>
      <h2 class="text-sm font-semibold text-neutral-200 uppercase tracking-wider mb-4">Your meetings</h2>

      <div v-if="meetingsLoading" class="flex items-center gap-2 text-neutral-300 text-sm mb-4">
        <AppLoader size="sm" />
        <span>Loading your meetings...</span>
      </div>

      <div v-if="meetings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MeetingCard
          v-for="meeting in meetings"
          :key="meeting.id"
          :meeting="meeting"
          show-delete
          :deleting="deletingId === meeting.id"
          @delete="handleDeleteMeeting"
        />
      </div>

      <div v-else-if="hasFetchedMeetings" class="text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-brand-900 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner shadow-black/40">
          <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p class="text-neutral-200/80 text-sm">No meetings yet.</p>
        <p class="text-neutral-300/70 text-xs mt-1">Create one to get started!</p>
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

const { user, loading: authLoading } = useAuth()
const { meetings, fetchMeetings, deleteMeeting, loading: meetingsLoading } = useMeeting()
const router = useRouter()

const showCreateModal = ref(false)
const joinLink = ref('')
const joinError = ref('')
const toast = ref<{ show: (msg: string, type?: string) => void } | null>(null)
const hasFetchedMeetings = ref(false)
const lastFetchedUid = ref<string | null>(null)
const deletingId = ref<string | null>(null)

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

async function loadMeetings() {
  if (!user.value) return
  try {
    await fetchMeetings()
    lastFetchedUid.value = user.value.uid
  }
  catch (err) {
    const message = (err as Error).message || 'Unable to load meetings'
    toast.value?.show(message, 'error')
  }
  finally {
    hasFetchedMeetings.value = true
  }
}

async function handleDeleteMeeting(id: string) {
  if (deletingId.value) return
  const confirmed = window.confirm('Delete this meeting? This cannot be undone.')
  if (!confirmed) return

  deletingId.value = id
  try {
    await deleteMeeting(id)
    toast.value?.show('Meeting deleted', 'success')
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to delete meeting'
    toast.value?.show(message, 'error')
  }
  finally {
    deletingId.value = null
  }
}

watch(
  () => [authLoading.value, user.value?.uid],
  ([loading, uid]) => {
    if (!loading && uid && uid !== lastFetchedUid.value) {
      loadMeetings()
    }
  },
  { immediate: true },
)

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
