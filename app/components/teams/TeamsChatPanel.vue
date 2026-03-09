<template>
  <div class="flex flex-col h-full bg-dark-800 border border-white/10 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
    <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-dark-700/60">
      <div class="min-w-0">
        <p class="text-white font-semibold text-sm">{{ targetUser ? targetUser.displayName : 'Select a user' }}</p>
        <p class="text-slate-400 text-xs truncate">
          {{ connected ? (roomId ? 'Room ' + roomId : 'No room selected') : 'Offline' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="callEnabled && roomId"
          type="button"
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-accent-400/50 bg-accent-500/20 text-white hover:border-accent-300 transition"
          @click="$emit('call', roomId)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call
        </button>
        <span :class="['text-xs font-medium rounded-full px-2.5 py-1 border', connected ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-slate-500/40 text-slate-300 bg-slate-500/10']">
          {{ connected ? 'Conectado' : 'Offline' }}
        </span>
      </div>
    </div>

    <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      <p v-if="!messages.length" class="text-center text-slate-500 text-xs mt-6">
        {{ connected ? 'No messages yet. Say hi!' : 'Connect to chat.' }}
      </p>
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
    </div>

    <ChatInput :disabled="!connected || !targetUser" @send="$emit('send', $event)" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ChatInput from '~/components/meet/chat/ChatInput.vue'
import ChatMessage from '~/components/meet/chat/ChatMessage.vue'
import type { ChatMessage as ChatMessageType } from '~/types/chat.types'
import type { PresenceUser } from '~/types/socket.types'

const props = defineProps<{ messages: ChatMessageType[]; connected: boolean; roomId: string | null; targetUser: PresenceUser | null; callEnabled?: boolean }>()

const emit = defineEmits<{ send: [text: string]; call: [string] }>()

const messagesEl = ref<HTMLElement | null>(null)

watch(() => props.messages.length, () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
})
</script>
