<template>
  <div class="min-h-screen text-white flex flex-col bg-brand-900/95 page-surface">
    <!-- Navbar -->
    <header class="h-16 border-b border-white/10 flex items-center px-4 md:px-8 shrink-0 bg-brand-800/80 backdrop-blur-md sticky top-0 z-30">
      <!-- Hamburger (mobile only) -->
      <button
        v-if="user"
        class="md:hidden mr-3 w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-white/5 transition-colors"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        @click="menuOpen = !menuOpen"
      >
        <span class="hamburger-bar" :class="menuOpen ? 'bar-top-open' : 'bar-top'" />
        <span class="hamburger-bar" :class="menuOpen ? 'bar-mid-open' : 'bar-mid'" />
        <span class="hamburger-bar" :class="menuOpen ? 'bar-bot-open' : 'bar-bot'" />
      </button>

      <NuxtLink to="/home" class="flex items-center gap-3 group">
        <span class="inline-flex items-center justify-center">
          <img src="/capmation-logo.svg" alt="Capmation" class="h-7 w-auto transition duration-200 group-hover:scale-[1.02]" />
        </span>
        <span class="font-semibold text-white text-sm hidden sm:block">Teams</span>
      </NuxtLink>

      <div class="ml-auto flex items-center">
        <div v-if="user" ref="userMenuRef" class="relative">
          <button
            class="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors"
            @click="userMenuOpen = !userMenuOpen"
          >
            <AppAvatar :name="user.displayName || 'User'" :photo="user.photoURL" size="sm" />
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="fade-overlay">
            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-brand-900/95 shadow-xl shadow-black/30 p-3 z-50"
            >
              <div class="flex items-center gap-3 pb-3 border-b border-white/5">
                <AppAvatar :name="user.displayName || 'User'" :photo="user.photoURL" size="sm" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-white truncate">{{ user.displayName }}</p>
                  <p class="text-xs text-slate-400 truncate">{{ user.email }}</p>
                </div>
              </div>

              <div class="py-2 space-y-1">
                <NuxtLink
                  to="/settings"
                  class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-200"
                  @click="userMenuOpen = false"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.066z" />
                  </svg>
                  Settings
                </NuxtLink>

                <button
                  class="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-rose-200"
                  @click="logout"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- Mobile drawer overlay -->
    <Transition name="fade-overlay">
      <div
        v-if="menuOpen"
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        @click="menuOpen = false"
      />
    </Transition>

    <!-- Mobile drawer -->
    <div
      class="mobile-drawer fixed top-16 left-0 bottom-0 z-50 w-64 bg-brand-900 border-r border-white/10 flex flex-col md:hidden"
      :class="menuOpen ? 'drawer-open' : 'drawer-closed'"
    >
      <nav class="flex flex-col gap-2 p-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200"
          :class="route.path === item.to
            ? 'bg-accent-500/20 border-accent-400/50 text-white'
            : 'bg-brand-800/60 border-white/5 text-neutral-300 hover:border-white/20 hover:text-white'"
          @click="menuOpen = false"
        >
          <!-- Meetings icon -->
          <svg v-if="item.key === 'meet'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <!-- Calendar icon -->
          <svg v-else-if="item.key === 'calendar'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <!-- Projects icon -->
          <svg v-else-if="item.key === 'projects'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <!-- Teams icon -->
          <div v-else class="relative shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 4a3 3 0 110 6 3 3 0 010-6zM6 9a3 3 0 110-6 3 3 0 010 6zM18 9a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            <span
              v-if="unreadTotal"
              class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-[9px] font-semibold text-white flex items-center justify-center px-1"
            >
              {{ unreadTotal > 99 ? '99+' : unreadTotal }}
            </span>
          </div>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="mt-auto p-4 border-t border-white/10">
        <div v-if="user" class="flex items-center gap-3 px-2 py-2">
          <AppAvatar :name="user.displayName" :photo="user.photoURL" size="sm" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user.displayName }}</p>
            <p class="text-xs text-slate-400 truncate">{{ user.email }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Global incoming call toast -->
    <IncomingCallToast v-if="user" />

    <!-- Page content with shared sidebar -->
    <main class="flex-1 flex">
      <SideNav v-if="user" />
      <section class="flex-1 flex flex-col">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SideNav from '~/components/shared/SideNav.vue'
import AppAvatar from '~/components/shared/AppAvatar.vue'
import { useDmStore } from '~/stores/dm.store'

const { user, logout } = useAuth()
const route = useRoute()
const dmStore = useDmStore()
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const unreadTotal = computed(() => dmStore.unreadTotal)

const navItems = [
  { key: 'meet', to: '/meetings', label: 'Meetings' },
  { key: 'chat', to: '/teams', label: 'Teams' },
  { key: 'calendar', to: '/calendar', label: 'Calendar' },
  { key: 'projects', to: '/projects', label: 'Projects' },
]

function handleOutsideClick(event: MouseEvent) {
  if (!userMenuRef.value) return
  if (!userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style scoped>
/* ── Hamburger bars ── */
.hamburger-bar {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 9999px;
  background-color: currentColor;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.2s ease;
  transform-origin: center;
}

.bar-top    { transform: translateY(0) rotate(0deg); }
.bar-mid    { opacity: 1; transform: scaleX(1); }
.bar-bot    { transform: translateY(0) rotate(0deg); }

.bar-top-open { transform: translateY(5.5px) rotate(45deg); }
.bar-mid-open { opacity: 0; transform: scaleX(0); }
.bar-bot-open { transform: translateY(-5.5px) rotate(-45deg); }

/* ── Drawer slide ── */
.mobile-drawer {
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}
.drawer-open   { transform: translateX(0); }
.drawer-closed { transform: translateX(-100%); }

/* ── Overlay fade ── */
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
