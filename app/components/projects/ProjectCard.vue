<template>
  <div
    class="group relative bg-brand-800/60 border border-white/8 rounded-2xl p-5 hover:border-white/15 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 transition-all duration-200 cursor-pointer"
    @click="$emit('click')"
  >
    <!-- Color bar -->
    <div :class="['absolute top-0 left-5 right-5 h-0.5 rounded-full mt-0', colorBar]" />

    <div class="flex items-start justify-between gap-3 mt-1">
      <div class="min-w-0">
        <h3 class="font-semibold text-white truncate text-base">{{ project.title }}</h3>
        <p v-if="project.description" class="text-slate-400 text-sm mt-1 line-clamp-2">
          {{ project.description }}
        </p>
      </div>
      <button
        class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400"
        title="Delete project"
        @click.stop="$emit('delete')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <div class="flex items-center gap-2 mt-4">
      <span class="text-xs text-slate-500">{{ formatDate(project.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/project.types'

const props = defineProps<{ project: Project }>()
defineEmits<{ click: []; delete: [] }>()

const colorBarMap: Record<string, string> = {
  accent: 'bg-accent-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
}

const colorBar = computed(() => colorBarMap[props.project.color] ?? 'bg-accent-500')

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
