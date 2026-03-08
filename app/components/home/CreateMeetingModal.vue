<template>
  <AppModal :model-value="modelValue" title="New Meeting" @update:model-value="$emit('update:modelValue', $event)">
    <form @submit.prevent="handleSubmit">
      <label class="block text-sm font-medium text-slate-300 mb-1.5" for="meeting-title">
        Meeting title
      </label>
      <input
        id="meeting-title"
        v-model="title"
        type="text"
        placeholder="e.g. Weekly Sync"
        maxlength="80"
        autocomplete="off"
        class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-300/70 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
      />
      <p v-if="error" class="mt-2 text-red-400 text-xs">{{ error }}</p>

      <div class="mt-6">
        <p class="text-sm font-medium text-slate-300 mb-2">Visibility</p>
        <div class="grid grid-cols-2 gap-3">
          <label class="border border-white/10 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:border-accent-500/60 transition" :class="visibility === 'private' ? 'border-accent-500/60 bg-brand-900/60' : ''">
            <input v-model="visibility" type="radio" value="private" class="mt-1" />
            <div class="min-w-0">
              <p class="text-white text-sm font-semibold">Private</p>
              <p class="text-slate-400 text-xs">Only invited or logged-in users can join.</p>
            </div>
          </label>
          <label class="border border-white/10 rounded-xl p-3 flex items-start gap-3 cursor-pointer hover:border-accent-500/60 transition" :class="visibility === 'public' ? 'border-accent-500/60 bg-brand-900/60' : ''">
            <input v-model="visibility" type="radio" value="public" class="mt-1" />
            <div class="min-w-0">
              <p class="text-white text-sm font-semibold">Public</p>
              <p class="text-slate-400 text-xs">Anyone with the link can join.</p>
            </div>
          </label>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <AppButton variant="ghost" class="flex-1" @click="$emit('update:modelValue', false)">
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" class="flex-1" :loading="loading">
          Create Meeting
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [meetingId: string]
}>()

const { createMeeting, loading, error } = useMeeting()
const title = ref('')
const visibility = ref<'private' | 'public'>('private')

// Reset form when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    title.value = ''
    visibility.value = 'private'
  }
})

async function handleSubmit() {
  if (!title.value.trim()) return
  try {
    const meeting = await createMeeting({ title: title.value.trim(), visibility: visibility.value })
    emit('created', meeting.id)
    emit('update:modelValue', false)
  }
  catch {
    // error is handled by the store
  }
}
</script>
