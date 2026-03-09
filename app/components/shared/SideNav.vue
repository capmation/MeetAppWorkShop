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
      <svg v-if="item.key === 'meet'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 4a3 3 0 110 6 3 3 0 010-6zM6 9a3 3 0 110-6 3 3 0 010 6zM18 9a3 3 0 110-6 3 3 0 010 6z" />
      </svg>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const items = [
  { key: 'meet', to: '/home', label: 'Meetings' },
  { key: 'chat', to: '/teams', label: 'Teams view' },
]
</script>
