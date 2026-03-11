<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Board header -->
    <div class="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-white/8 bg-brand-900/60 backdrop-blur">
      <NuxtLink
        to="/projects"
        class="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        title="Back to projects"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>

      <div v-if="project" class="flex items-center gap-2 min-w-0 flex-1">
        <div :class="['w-2.5 h-2.5 rounded-full shrink-0', colorDot]" />
        <h1 class="font-semibold text-white truncate text-sm md:text-base">{{ project.title }}</h1>
        <span v-if="project.description" class="text-slate-500 text-sm truncate hidden lg:block">
          — {{ project.description }}
        </span>
      </div>

      <div v-if="loading && !project" class="flex items-center gap-2 text-slate-500 text-sm">
        <AppLoader size="sm" />
      </div>
    </div>

    <!-- Mobile: column tab bar -->
    <div v-if="sortedColumns.length" class="md:hidden shrink-0 border-b border-white/8 bg-brand-900/40">
      <div class="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-none">
        <button
          v-for="col in sortedColumns"
          :key="col.id"
          :class="[
            'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
            activeColId === col.id
              ? 'bg-accent-500 text-brand-900'
              : 'bg-brand-800/70 text-slate-400 border border-white/8',
          ]"
          @click="activeColId = col.id"
        >
          {{ col.title }}
          <span
            :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', activeColId === col.id ? 'bg-brand-900/30' : 'bg-white/10']"
          >
            {{ cardCountFor(col.id) }}
          </span>
        </button>

        <!-- Add column on mobile -->
        <button
          class="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-slate-500 border border-dashed border-white/15 hover:text-white hover:border-white/25 transition-all"
          @click="showMobileAddCol = true"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Column
        </button>
      </div>
    </div>

    <!-- Mobile add-column inline form -->
    <div v-if="showMobileAddCol" class="md:hidden shrink-0 px-4 py-3 border-b border-white/8 bg-brand-800/40 flex gap-2">
      <input
        ref="mobileColInput"
        v-model="mobileColTitle"
        type="text"
        placeholder="Column name"
        maxlength="40"
        class="flex-1 bg-brand-900/70 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
        @keydown.enter="submitMobileColumn"
        @keydown.escape="showMobileAddCol = false"
      />
      <AppButton size="sm" variant="primary" :loading="addingColLoading" @click="submitMobileColumn">
        Add
      </AppButton>
      <AppButton size="sm" variant="ghost" @click="showMobileAddCol = false">
        Cancel
      </AppButton>
    </div>

    <!-- Board canvas -->
    <div class="flex-1 overflow-hidden flex flex-col md:block">
      <!-- Mobile: vertical scroll, single column -->
      <div class="md:hidden flex-1 overflow-y-auto">
        <div class="p-4 pb-8">
          <KanbanBoard
            v-if="!loading && activeColId"
            :project-id="projectId"
            :mobile-column-id="activeColId"
          />
          <div v-else-if="!loading && sortedColumns.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
            <p class="text-slate-500 text-sm">No columns yet. Add one above.</p>
          </div>
        </div>
      </div>

      <!-- Desktop: horizontal scroll -->
      <div class="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden">
        <div class="flex gap-5 h-full p-6 pb-8 items-start min-w-max">
          <KanbanBoard v-if="!loading" :project-id="projectId" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/project.types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const projectId = route.params.id as string

const { fetchBoard, fetchProjects, projects, columns, loading, createColumn } = useProjects()
const { loading: authLoading } = useAuth()

const project = computed(() => projects.value.find(p => p.id === projectId) ?? null)
const store = useProjectStore()

const sortedColumns = computed(() =>
  [...store.columns].sort((a, b) => a.order - b.order),
)

const activeColId = ref<string | null>(null)

watch(sortedColumns, (cols) => {
  if (!activeColId.value && cols.length) activeColId.value = cols[0].id
}, { immediate: true })

function cardCountFor(colId: string) {
  return store.cards.filter(c => c.columnId === colId).length
}

const colorDotMap: Record<string, string> = {
  accent: 'bg-accent-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
}
const colorDot = computed(() => colorDotMap[project.value?.color ?? ''] ?? 'bg-accent-500')

// Mobile add column
const showMobileAddCol = ref(false)
const mobileColTitle = ref('')
const addingColLoading = ref(false)
const mobileColInput = ref<HTMLInputElement | null>(null)

watch(showMobileAddCol, (v) => {
  if (v) {
    mobileColTitle.value = ''
    nextTick(() => mobileColInput.value?.focus())
  }
})

async function submitMobileColumn() {
  const title = mobileColTitle.value.trim()
  if (!title) return
  addingColLoading.value = true
  try {
    const col = await createColumn(projectId, title)
    showMobileAddCol.value = false
    activeColId.value = col.id
  }
  finally {
    addingColLoading.value = false
  }
}

// Auth wait
function waitForAuth(timeoutMs = 8000): Promise<void> {
  if (!authLoading.value) return Promise.resolve()
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs)
    const stop = watch(authLoading, (v) => {
      if (!v) { clearTimeout(timeout); stop(); resolve() }
    })
  })
}

onMounted(async () => {
  await waitForAuth()
  await Promise.all([fetchProjects(), fetchBoard(projectId)])
})
</script>
