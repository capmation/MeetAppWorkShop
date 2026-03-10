<template>
  <div ref="menuRef" class="relative">
    <!-- Trigger: avatar -->
    <button
      class="rounded-full ring-2 ring-white/10 hover:ring-accent-400/60 transition-all duration-150 focus:outline-none"
      :title="user?.displayName ?? 'Account'"
      @click="open = !open"
    >
      <AppAvatar
        :name="user?.displayName ?? '?'"
        :photo="user?.photoURL"
        size="sm"
      />
    </button>

    <!-- Dropdown -->
    <Transition name="menu-drop">
      <div
        v-if="open"
        class="absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-white/10 bg-brand-800/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
      >
        <!-- User info -->
        <div class="flex items-center gap-3 px-4 py-4 border-b border-white/8">
          <AppAvatar
            :name="user?.displayName ?? '?'"
            :photo="user?.photoURL"
            size="md"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ user?.displayName }}</p>
            <p class="text-xs text-slate-400 truncate">{{ user?.email }}</p>
          </div>
        </div>

        <!-- Actions -->
        <nav class="p-2">
          <NuxtLink
            to="/settings"
            class="menu-item"
            @click="open = false"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
            </svg>
            Settings
          </NuxtLink>

          <button
            class="menu-item w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            @click="handleLogout"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </nav>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function handleLogout() {
  open.value = false
  logout()
}

// Close on outside click
function onDocClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick, true))
onUnmounted(() => document.removeEventListener('click', onDocClick, true))
</script>

<style scoped>
.menu-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors duration-150 w-full text-left;
}

.menu-drop-enter-active,
.menu-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: top right;
}
.menu-drop-enter-from,
.menu-drop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}
</style>
