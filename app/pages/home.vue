<template>
  <div class="relative z-10 flex flex-col min-h-screen">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-6 md:px-10 py-5 shrink-0">
      <div class="flex items-center gap-3">
        <img src="/capmation-logo.svg" alt="Capmation" class="h-7 w-auto" />
        <span class="font-semibold text-white text-sm hidden sm:block">MeetApp</span>
      </div>
      <button
        class="text-neutral-300 hover:text-white transition-colors text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/10"
        @click="logout"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="hidden sm:inline">Sign out</span>
      </button>
    </header>

    <!-- Content -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <Transition name="step" mode="out-in">
        <!-- Step 1: Welcome hero -->
        <div v-if="step === 'welcome'" key="welcome" class="flex flex-col items-center text-center max-w-2xl mx-auto">
          <!-- Badge -->
          <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/15 border border-accent-500/30 text-accent-400 text-xs font-semibold mb-8 tracking-wide uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            Welcome to MeetApp
          </span>

          <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Hello, <span class="text-gradient">{{ firstName }}</span> 👋
          </h1>
          <p class="text-lg text-slate-400 mb-10 leading-relaxed max-w-xl">
            Your all-in-one workspace for video meetings, team collaboration, and project management. Everything your team needs — in one place.
          </p>

          <!-- Feature cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
            <div v-for="feature in features" :key="feature.title" class="feature-card group">
              <div :class="['w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110', feature.iconBg]">
                <component :is="feature.icon" />
              </div>
              <h3 class="font-semibold text-white text-sm mb-1">{{ feature.title }}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">{{ feature.desc }}</p>
            </div>
          </div>

          <button class="btn-primary px-8 py-3.5 text-base" @click="step = 'choose'">
            Get Started
            <svg class="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Step 2: Choose home page -->
        <div v-else-if="step === 'choose'" key="choose" class="flex flex-col items-center text-center max-w-2xl mx-auto w-full">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-3">Set your home page</h2>
          <p class="text-slate-400 mb-10 leading-relaxed max-w-md">
            Choose where you land every time you sign in. You can always change this later.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
            <button
              v-for="option in homeOptions"
              :key="option.value"
              :class="[
                'home-option-card group',
                selected === option.value
                  ? 'ring-2 ring-accent-400 bg-accent-500/10 border-accent-400/40'
                  : 'border-white/10 bg-brand-800/40 hover:bg-brand-800/70 hover:border-white/20',
              ]"
              @click="selected = option.value"
            >
              <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto transition-transform group-hover:scale-105', option.iconBg]">
                <component :is="option.icon" />
              </div>
              <h3 class="font-semibold text-white text-sm mb-1.5">{{ option.label }}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">{{ option.desc }}</p>
              <div v-if="selected === option.value" class="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          </div>

          <div class="flex gap-3">
            <button class="btn-ghost px-6 py-2.5 text-sm" @click="step = 'welcome'">
              Back
            </button>
            <button
              :disabled="!selected || saving"
              class="btn-primary px-8 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              @click="saveAndGo"
            >
              <span v-if="saving" class="flex items-center gap-2">
                <AppLoader size="xs" />
                Saving…
              </span>
              <span v-else>
                Let's go
                <svg class="w-4 h-4 ml-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </main>

    <footer class="shrink-0 text-center py-5 text-xs text-slate-600">
      Capmation MeetApp &mdash; your workspace, your way
    </footer>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { HomePage } from '~/composables/useUserSettings'

definePageMeta({ layout: 'welcome' })

const { user, logout } = useAuth()
const router = useRouter()
const { fetchSettings, saveSettings } = useUserSettings()

const step = ref<'welcome' | 'choose'>('welcome')
const selected = ref<HomePage | null>(null)
const saving = ref(false)

const firstName = computed(() => {
  const name = user.value?.displayName ?? user.value?.email ?? 'there'
  return name.split(' ')[0]
})

// ── Icon components ──────────────────────────────────────────────
const IconMeetings = () => h('svg', { class: 'w-5 h-5 text-accent-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' }),
])
const IconTeams = () => h('svg', { class: 'w-5 h-5 text-blue-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 015.356-1.857M12 4a3 3 0 110 6 3 3 0 010-6zM6 9a3 3 0 110-6 3 3 0 010 6zM18 9a3 3 0 110-6 3 3 0 010 6z' }),
])
const IconProjects = () => h('svg', { class: 'w-5 h-5 text-violet-300', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' }),
])

const features = [
  {
    title: 'Video Meetings',
    desc: 'Crystal-clear HD video calls with screen sharing. Start or join a meeting instantly.',
    iconBg: 'bg-accent-500/20',
    icon: IconMeetings,
  },
  {
    title: 'Team Chat',
    desc: 'Real-time messaging with your colleagues. Direct messages, no distractions.',
    iconBg: 'bg-blue-500/20',
    icon: IconTeams,
  },
  {
    title: 'Kanban Projects',
    desc: 'Organize work visually with drag-and-drop boards, custom columns, and due dates.',
    iconBg: 'bg-violet-500/20',
    icon: IconProjects,
  },
]

const homeOptions: Array<{
  value: HomePage
  label: string
  desc: string
  iconBg: string
  icon: () => ReturnType<typeof h>
}> = [
  {
    value: 'meetings',
    label: 'Meetings',
    desc: 'Jump straight into your video calls and upcoming meeting schedule.',
    iconBg: 'bg-accent-500/20',
    icon: IconMeetings,
  },
  {
    value: 'teams',
    label: 'Teams Chat',
    desc: 'Stay in the loop with your team messages the moment you open the app.',
    iconBg: 'bg-blue-500/20',
    icon: IconTeams,
  },
  {
    value: 'projects',
    label: 'Projects',
    desc: 'See your Kanban boards and pick up right where you left off.',
    iconBg: 'bg-violet-500/20',
    icon: IconProjects,
  },
]

const routeMap: Record<HomePage, string> = {
  meetings: '/meetings',
  teams: '/teams',
  projects: '/projects',
}

async function saveAndGo() {
  if (!selected.value) return
  saving.value = true
  try {
    await saveSettings({ homePage: selected.value, onboardingDone: true })
    await router.replace(routeMap[selected.value])
  }
  catch {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const s = await fetchSettings()
    if (s.onboardingDone && s.homePage) {
      await router.replace(routeMap[s.homePage])
    }
  }
  catch {
    // ignore, show onboarding
  }
})
</script>

<style scoped>
.text-gradient {
  background: linear-gradient(135deg, theme('colors.accent.400'), theme('colors.blue.400'));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.feature-card {
  @apply relative flex flex-col items-center text-center p-5 rounded-2xl bg-brand-800/40 border border-white/10 hover:bg-brand-800/60 hover:border-white/15 transition-all duration-200;
}

.home-option-card {
  @apply relative flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-200 cursor-pointer;
}

.btn-primary {
  @apply inline-flex items-center justify-center rounded-2xl bg-accent-500 hover:bg-accent-400 active:bg-accent-600 text-brand-900 font-semibold transition-all duration-150 shadow-lg shadow-accent-500/25;
}

.btn-ghost {
  @apply inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium transition-all duration-150;
}

.step-enter-active,
.step-leave-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.step-enter-from {
  opacity: 0;
  transform: translateX(32px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}
</style>
