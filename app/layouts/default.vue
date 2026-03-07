<template>
  <div class="min-h-screen bg-dark-900 text-white flex flex-col">
    <!-- Navbar -->
    <header class="h-16 border-b border-white/10 flex items-center px-4 md:px-8 shrink-0 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-30">
      <NuxtLink to="/home" class="flex items-center gap-2 group">
        <div class="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm group-hover:bg-brand-500 transition-colors">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="font-semibold text-white text-sm hidden sm:block">Capmation Meet</span>
      </NuxtLink>

      <div class="ml-auto flex items-center gap-3">
        <AppAvatar
          v-if="user"
          :name="user.displayName"
          :photo="user.photoURL"
          size="sm"
          class="cursor-pointer"
        />
        <button
          class="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
          @click="logout"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
</script>
