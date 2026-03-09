<template>
  <form class="flex gap-2 p-3 border-t border-white/10" @submit.prevent="handleSend">
    <input
      v-model="text"
      type="text"
      placeholder="Message..."
      maxlength="2000"
      autocomplete="off"
      :disabled="disabled"
      class="flex-1 bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
      @keydown.enter.exact.prevent="handleSend"
    />
    <button
      type="submit"
      :disabled="disabled || !text.trim()"
      class="w-9 h-9 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
    >
      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    </button>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ send: [text: string] }>()
const text = ref('')

function handleSend() {
  if (props.disabled) return
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('send', trimmed)
  text.value = ''
}
</script>
