<template>
  <AppModal :model-value="modelValue" title="New Project" @update:model-value="$emit('update:modelValue', $event)">
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Project name</label>
          <input
            v-model="title"
            type="text"
            placeholder="e.g. Website Redesign"
            maxlength="80"
            autocomplete="off"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Description <span class="text-slate-500 font-normal">(optional)</span></label>
          <textarea
            v-model="description"
            placeholder="What is this project about?"
            maxlength="200"
            rows="2"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Color</label>
          <div class="flex gap-2">
            <button
              v-for="c in colors"
              :key="c.value"
              type="button"
              :class="['w-7 h-7 rounded-full border-2 transition-transform', c.bg, color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105']"
              @click="color = c.value"
            />
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-red-400 text-xs">{{ error }}</p>

      <div class="flex gap-3 mt-6">
        <AppButton variant="ghost" class="flex-1" @click="$emit('update:modelValue', false)">
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" class="flex-1" :loading="loading">
          Create Project
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import type { ProjectColor } from '~/types/project.types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'created': [projectId: string]
}>()

const { createProject, loading } = useProjects()

const title = ref('')
const description = ref('')
const color = ref<ProjectColor>('accent')
const error = ref('')

const colors = [
  { value: 'accent', bg: 'bg-accent-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'emerald', bg: 'bg-emerald-500' },
  { value: 'rose', bg: 'bg-rose-500' },
  { value: 'amber', bg: 'bg-amber-500' },
  { value: 'violet', bg: 'bg-violet-500' },
] as const

watch(() => props.modelValue, (open) => {
  if (open) {
    title.value = ''
    description.value = ''
    color.value = 'accent'
    error.value = ''
  }
})

async function handleSubmit() {
  if (!title.value.trim()) { error.value = 'Please enter a project name.'; return }
  error.value = ''
  try {
    const project = await createProject({ title: title.value.trim(), description: description.value.trim(), color: color.value })
    emit('created', project.id)
    emit('update:modelValue', false)
  }
  catch {
    error.value = 'Failed to create project. Please try again.'
  }
}
</script>
