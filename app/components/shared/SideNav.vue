<template>
  <nav class="hidden md:flex flex-col items-center gap-3 w-16 py-6 bg-brand-900/80 border-r border-white/10 backdrop-blur-md sticky top-16 h-[calc(100vh-4rem)]">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="[
        'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border text-white shadow-sm shadow-black/30',
        route.path === item.to
          ? 'bg-accent-500 text-brand-900 border-accent-400'
          : 'bg-brand-800/60 border-white/10 hover:border-white/20 hover:-translate-y-0.5'
      ]"
      :title="item.label"
    >
      <div class="relative">
        <!-- Meetings -->
        <svg v-if="item.key === 'meet'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <!-- Calendar -->
        <svg v-else-if="item.key === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <!-- Projects -->
        <svg v-else-if="item.key === 'projects'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <!-- Teams -->
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 4a3 3 0 110 6 3 3 0 010-6zM6 9a3 3 0 110-6 3 3 0 010 6zM18 9a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
        <span
          v-if="item.key === 'chat' && unreadTotal"
          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center px-1 shadow-md shadow-black/30 border border-white/30"
        >
          {{ unreadTotal > 99 ? '99+' : unreadTotal }}
        </span>
      </div>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDmStore } from '~/stores/dm.store'

const route = useRoute()
const dmStore = useDmStore()

const unreadTotal = computed(() => dmStore.unreadTotal)

const items = [
  { key: 'meet', to: '/home', label: 'Meetings' },
  { key: 'chat', to: '/teams', label: 'Teams' },
  { key: 'calendar', to: '/calendar', label: 'Calendar' },
  { key: 'projects', to: '/projects', label: 'Projects' },
]
</script>
