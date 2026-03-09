<template>
  <div class="bg-brand-900/70 border border-white/10 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-semibold text-white">Connected users</p>
        <p class="text-xs text-slate-400">Select to focus the chat</p>
      </div>
      <span class="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10">{{ users.length }}</span>
    </div>

    <TransitionGroup v-if="users.length" tag="div" name="user" class="flex flex-col gap-2">
      <button
        v-for="(user, i) in users"
        :key="user.uid"
        type="button"
        :style="{ '--i': i }"
        :class="[
          'flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition-all duration-200 border relative',
          selected === user.uid
            ? 'bg-accent-500/20 border-accent-400/60 text-white shadow-sm shadow-accent-500/20'
            : 'bg-brand-800/60 border-white/5 hover:border-white/20 hover:bg-brand-700/60 text-neutral-100',
          user.status === 'offline' ? 'opacity-60' : ''
        ]"
        @click="$emit('select', user)">
        <AppAvatar :name="user.displayName" :photo="user.photoURL" size="sm" class="shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">{{ user.displayName }}</p>
          <p class="text-xs" :class="user.status === 'away' ? 'text-amber-300' : user.status === 'offline' ? 'text-slate-500' : 'text-slate-400'">
            {{ user.status === 'away' ? 'Away' : user.status === 'offline' ? 'Offline' : 'Online' }}
          </p>
        </div>
        <span
          v-if="unread[user.uid]"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-accent-500 text-brand-900 font-semibold shadow-sm shadow-accent-500/40"
        >
          {{ unread[user.uid] }}
        </span>
      </button>
    </TransitionGroup>

    <Transition name="msg">
      <p v-if="!users.length" class="text-slate-500 text-sm text-center py-6">No users to show.</p>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { PresenceUser } from '~/types/socket.types'

defineProps<{ users: PresenceUser[]; selected: string | null; unread: Record<string, number> }>()

defineEmits<{ select: [PresenceUser] }>()
</script>
