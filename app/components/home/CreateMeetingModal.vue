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

// Reset form when modal opens
watch(() => props.modelValue, (open) => {
  if (open) title.value = ''
})

async function handleSubmit() {
  if (!title.value.trim()) return
  try {
    const meeting = await createMeeting({ title: title.value.trim() })
    emit('created', meeting.id)
    emit('update:modelValue', false)
  }
  catch {
    // error is handled by the store
  }
}
</script>
