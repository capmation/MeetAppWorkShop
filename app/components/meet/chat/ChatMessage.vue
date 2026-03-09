<template>
  <div :class="['flex gap-2.5', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <AppAvatar
      :name="message.userName"
      :photo="message.userPhoto"
      size="xs"
      class="shrink-0 mt-0.5"
    />
    <div :class="['max-w-[75%] flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start']">
      <span v-if="!isOwn" class="text-xs text-slate-400 px-1">{{ message.userName }}</span>
      <div
        :class="[
          'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
          isOwn
            ? 'bg-brand-600 text-white rounded-tr-sm bubble bubble-own'
            : 'bg-dark-700 text-slate-100 rounded-tl-sm border border-white/5 bubble bubble-other',
        ]"
      >
        {{ message.text }}
      </div>
      <span class="text-xs text-slate-500 px-1 timestamp">{{ formatTime(message.timestamp) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat.types'
import { formatTime } from '~/utils/format-date'
import { useAuthStore } from '~/stores/auth.store'

const props = defineProps<{ message: ChatMessage }>()
const authStore = useAuthStore()
const isOwn = computed(() => props.message.userId === authStore.user?.uid)
</script>

<style scoped>
/* Bubble pop — own messages burst from bottom-right */
.bubble-own {
  animation: bubblePopOwn 0.42s cubic-bezier(0.34, 1.6, 0.64, 1) both;
  transform-origin: bottom right;
}

/* Bubble pop — incoming messages burst from bottom-left */
.bubble-other {
  animation: bubblePopOther 0.42s cubic-bezier(0.34, 1.6, 0.64, 1) both;
  transform-origin: bottom left;
}

@keyframes bubblePopOwn {
  0%   { opacity: 0; transform: scale(0.45) translate(6px, 6px); }
  100% { opacity: 1; transform: scale(1)    translate(0, 0); }
}

@keyframes bubblePopOther {
  0%   { opacity: 0; transform: scale(0.45) translate(-6px, 6px); }
  100% { opacity: 1; transform: scale(1)    translate(0, 0); }
}

/* Timestamp fades in slightly after the bubble */
.timestamp {
  animation: fadeSlide 0.3s 0.18s ease both;
}

@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(3px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
