<template>
  <div class="flex-1 flex flex-col p-6 md:p-8 max-w-5xl mx-auto w-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Projects</h1>
        <p class="text-slate-400 text-sm mt-1">Organize your work with Kanban boards</p>
      </div>
      <AppButton variant="primary" @click="showCreate = true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Project
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <AppLoader size="lg" />
    </div>

    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-16 h-16 rounded-2xl bg-brand-800/60 border border-white/8 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      </div>
      <h3 class="text-white font-semibold text-lg">No projects yet</h3>
      <p class="text-slate-400 text-sm mt-2 mb-6">Create your first project to get started</p>
      <AppButton variant="primary" @click="showCreate = true">
        Create Project
      </AppButton>
    </div>

    <!-- Project grid -->
    <TransitionGroup v-else name="card" tag="div" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard
        v-for="(project, i) in projects"
        :key="project.id"
        :project="project"
        :style="{ '--i': i }"
        @click="navigateTo(`/projects/${project.id}`)"
        @delete="handleDelete(project.id)"
      />
    </TransitionGroup>

    <CreateProjectModal v-model="showCreate" @created="(id) => navigateTo(`/projects/${id}`)" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { projects, loading, fetchProjects, deleteProject } = useProjects()
const { loading: authLoading } = useAuth()
const showCreate = ref(false)

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
  await fetchProjects()
})

async function handleDelete(id: string) {
  if (!confirm('Delete this project? This cannot be undone.')) return
  await deleteProject(id)
}
</script>
