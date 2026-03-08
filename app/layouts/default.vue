<template>
  <div class="min-h-screen text-white flex flex-col bg-brand-900/95 page-surface">
    <!-- Navbar -->
    <header class="h-16 border-b border-white/10 flex items-center px-4 md:px-8 shrink-0 bg-brand-800/80 backdrop-blur-md sticky top-0 z-30">
      <NuxtLink to="/home" class="flex items-center gap-3 group">
        <span class="inline-flex items-center justify-center rounded-xl px-2.5 py-1.5 shadow-md shadow-black/40 border border-white/10 bg-brand-900/90">
          <img src="/capmation-logo.svg" alt="Capmation" class="h-7 w-auto transition duration-200 group-hover:scale-[1.02]" />
        </span>
        <span class="font-semibold text-white text-sm hidden sm:block">Meet</span>
      </NuxtLink>

      <div class="ml-auto flex items-center gap-3">
        <AppAvatar
          v-if="user"
          :name="user.displayName"
          :photo="user.photoURL"
          size="sm"
          class="cursor-pointer ring-1 ring-white/5"
        />
        <button
          class="text-neutral-200 hover:text-white transition-colors text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/0 hover:border-white/10"
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
