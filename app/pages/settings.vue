<template>
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">

      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-bold text-white">Settings</h1>
        <p class="text-slate-400 text-sm mt-1">Manage your profile and preferences.</p>
      </div>

      <!-- ── Profile ─────────────────────────────────────────────── -->
      <section class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon-wrap bg-accent-500/15">
            <svg class="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 class="settings-card-title">Profile</h2>
            <p class="settings-card-sub">Your public name shown across the app.</p>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          <!-- Avatar preview -->
          <div class="flex items-center gap-4">
            <AppAvatar :name="displayName || '?'" :photo="user?.photoURL" size="lg" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-white truncate">{{ displayName || '—' }}</p>
              <p class="text-xs text-slate-500 truncate">{{ user?.email }}</p>
            </div>
          </div>

          <!-- Display name field -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Display name</label>
            <div class="flex gap-2">
              <input
                v-model="displayName"
                type="text"
                maxlength="60"
                autocomplete="off"
                placeholder="Your name"
                class="flex-1 bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
              <button
                :disabled="!nameChanged || nameSaving"
                class="settings-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                @click="saveName"
              >
                <AppLoader v-if="nameSaving" size="xs" />
                <span v-else>Save</span>
              </button>
            </div>
            <p v-if="nameSuccess" class="text-xs text-emerald-400 mt-1.5">Name updated successfully.</p>
            <p v-if="nameError" class="text-xs text-rose-400 mt-1.5">{{ nameError }}</p>
          </div>

          <!-- Email (read-only) -->
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <div class="bg-brand-900/40 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-slate-500 select-all">
              {{ user?.email }}
            </div>
            <p class="text-xs text-slate-600 mt-1">Email cannot be changed here.</p>
          </div>
        </div>
      </section>

      <!-- ── Home page ───────────────────────────────────────────── -->
      <section class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon-wrap bg-blue-500/15">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <h2 class="settings-card-title">Home page</h2>
            <p class="settings-card-sub">Where you land after signing in.</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="opt in homeOptions"
            :key="opt.value"
            :class="[
              'home-opt group',
              homePage === opt.value
                ? 'ring-2 ring-accent-400 bg-accent-500/10 border-accent-400/40'
                : 'border-white/10 bg-brand-900/40 hover:bg-brand-800/60 hover:border-white/20',
            ]"
            @click="selectHome(opt.value)"
          >
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center mb-2 mx-auto transition-transform group-hover:scale-105', opt.iconBg]">
              <component :is="opt.icon" />
            </div>
            <span class="text-xs font-semibold text-white">{{ opt.label }}</span>
            <div v-if="homePage === opt.value" class="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center">
              <svg class="w-2.5 h-2.5 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <p v-if="homeSuccess" class="text-xs text-emerald-400">Home page saved.</p>
          <p v-else-if="homeError" class="text-xs text-rose-400">{{ homeError }}</p>
          <span v-else />
          <button
            :disabled="!homeChanged || homeSaving"
            class="settings-btn-primary disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
            @click="saveHome"
          >
            <AppLoader v-if="homeSaving" size="xs" />
            <span v-else>Save preference</span>
          </button>
        </div>
      </section>

      <!-- ── Coming soon ────────────────────────────────────────── -->
      <section class="settings-card opacity-50 pointer-events-none select-none">
        <div class="settings-card-header">
          <div class="settings-icon-wrap bg-violet-500/15">
            <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h2 class="settings-card-title">Notifications <span class="ml-2 text-xs font-medium text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full">Soon</span></h2>
            <p class="settings-card-sub">Email and push notification preferences.</p>
          </div>
        </div>
      </section>

      <section class="settings-card opacity-50 pointer-events-none select-none">
        <div class="settings-card-header">
          <div class="settings-icon-wrap bg-emerald-500/15">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h2 class="settings-card-title">Connected accounts <span class="ml-2 text-xs font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">Soon</span></h2>
            <p class="settings-card-sub">Link Google, GitHub and other providers.</p>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { HomePage } from '~/composables/useUserSettings'

definePageMeta({ layout: 'default' })

const { user, updateDisplayName } = useAuth()
const { fetchSettings, saveSettings } = useUserSettings()

// ── Profile ───────────────────────────────────────────────────────
const displayName = ref(user.value?.displayName ?? '')
const originalName = ref(user.value?.displayName ?? '')
const nameChanged = computed(() => displayName.value.trim() !== originalName.value)
const nameSaving = ref(false)
const nameSuccess = ref(false)
const nameError = ref('')

async function saveName() {
  const trimmed = displayName.value.trim()
  if (!trimmed || !nameChanged.value) return
  nameSaving.value = true
  nameError.value = ''
  nameSuccess.value = false
  try {
    await updateDisplayName(trimmed)
    originalName.value = trimmed
    nameSuccess.value = true
    setTimeout(() => { nameSuccess.value = false }, 3000)
  }
  catch {
    nameError.value = 'Failed to update name. Try again.'
  }
  finally {
    nameSaving.value = false
  }
}

// ── Home page ─────────────────────────────────────────────────────
const homePage = ref<HomePage | null>(null)
const originalHome = ref<HomePage | null>(null)
const homeChanged = computed(() => homePage.value !== originalHome.value)
const homeSaving = ref(false)
const homeSuccess = ref(false)
const homeError = ref('')

const IconMeetings = () => h('svg', { class: 'w-4 h-4 text-accent-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' }),
])
const IconTeams = () => h('svg', { class: 'w-4 h-4 text-blue-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 4a3 3 0 110 6 3 3 0 010-6zM6 9a3 3 0 110-6 3 3 0 010 6zM18 9a3 3 0 110-6 3 3 0 010 6z' }),
])
const IconProjects = () => h('svg', { class: 'w-4 h-4 text-violet-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' }),
])

const homeOptions: Array<{ value: HomePage; label: string; iconBg: string; icon: () => ReturnType<typeof h> }> = [
  { value: 'meetings', label: 'Meetings', iconBg: 'bg-accent-500/20', icon: IconMeetings },
  { value: 'teams', label: 'Teams', iconBg: 'bg-blue-500/20', icon: IconTeams },
  { value: 'projects', label: 'Projects', iconBg: 'bg-violet-500/20', icon: IconProjects },
]

function selectHome(val: HomePage) {
  homePage.value = val
  homeSuccess.value = false
  homeError.value = ''
}

async function saveHome() {
  if (!homePage.value || !homeChanged.value) return
  homeSaving.value = true
  homeError.value = ''
  homeSuccess.value = false
  try {
    await saveSettings({ homePage: homePage.value, onboardingDone: true })
    originalHome.value = homePage.value
    homeSuccess.value = true
    setTimeout(() => { homeSuccess.value = false }, 3000)
  }
  catch {
    homeError.value = 'Failed to save. Try again.'
  }
  finally {
    homeSaving.value = false
  }
}

onMounted(async () => {
  try {
    const s = await fetchSettings()
    homePage.value = s.homePage
    originalHome.value = s.homePage
  }
  catch { /* ignore */ }
})
</script>

<style scoped>
.settings-card {
  @apply rounded-2xl border border-white/10 bg-brand-800/30 p-5 md:p-6;
}

.settings-card-header {
  @apply flex items-start gap-3;
}

.settings-icon-wrap {
  @apply w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5;
}

.settings-card-title {
  @apply text-sm font-semibold text-white flex items-center;
}

.settings-card-sub {
  @apply text-xs text-slate-400 mt-0.5;
}

.settings-btn-primary {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 text-xs font-semibold transition-all duration-150;
}

.home-opt {
  @apply relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-150 cursor-pointer;
}
</style>
