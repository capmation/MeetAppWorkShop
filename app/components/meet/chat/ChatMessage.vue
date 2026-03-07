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
            ? 'bg-brand-600 text-white rounded-tr-sm'
            : 'bg-dark-700 text-slate-100 rounded-tl-sm border border-white/5',
        ]"
      >
        {{ message.text }}
      </div>
      <span class="text-xs text-slate-500 px-1">{{ formatTime(message.timestamp) }}</span>
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
