<template>
  <div class="flex flex-col h-full bg-dark-800 border-l border-white/10">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
      <h3 class="font-semibold text-white text-sm">In-call messages</h3>
      <button
        class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 md:hidden"
        @click="$emit('close')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth">
      <Transition name="msg" appear>
        <p v-if="!messages.length" class="text-center text-slate-500 text-xs mt-4">
          No messages yet. Say hi!
        </p>
      </Transition>
      <TransitionGroup name="msg" tag="div" class="flex flex-col gap-3">
        <ChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
        />
      </TransitionGroup>
    </div>

    <!-- Input -->
    <ChatInput @send="$emit('send', $event)" />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage as ChatMessageType } from '~/types/chat.types'

defineProps<{ messages: ChatMessageType[] }>()
defineEmits<{ send: [text: string]; close: [] }>()

const messagesEl = ref<HTMLElement | null>(null)

// Auto-scroll to bottom on new messages
watch(() => messagesEl.value?.children.length, () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
})
</script>
