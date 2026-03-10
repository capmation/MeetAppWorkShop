<template>
  <AppModal :model-value="modelValue" :title="card ? 'Edit Card' : 'New Card'" @update:model-value="$emit('update:modelValue', $event)">
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
          <input
            v-model="title"
            type="text"
            placeholder="Card title"
            maxlength="120"
            autocomplete="off"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Description <span class="text-slate-500 font-normal">(optional)</span></label>
          <textarea
            v-model="description"
            placeholder="Add more details..."
            maxlength="500"
            rows="3"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition resize-none"
          />
        </div>

        <!-- Column selector (always visible — lets users move cards) -->
        <div v-if="columns.length > 1 || card">
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Column</label>
          <select
            v-model="selectedColumnId"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition [color-scheme:dark]"
          >
            <option v-for="col in columns" :key="col.id" :value="col.id">
              {{ col.title }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1.5">Due date <span class="text-slate-500 font-normal">(optional)</span></label>
          <input
            v-model="dueDate"
            type="date"
            class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition [color-scheme:dark]"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Color</label>
          <div class="flex gap-2">
            <button
              v-for="c in colors"
              :key="c.value"
              type="button"
              :class="['w-6 h-6 rounded-full border-2 transition-transform', c.bg, color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105']"
              @click="color = c.value"
            />
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-red-400 text-xs">{{ error }}</p>

      <div class="flex gap-3 mt-6">
        <AppButton v-if="card" variant="danger" size="sm" class="mr-auto" :loading="deleting" @click="handleDelete">
          Delete
        </AppButton>
        <AppButton variant="ghost" class="flex-1" @click="$emit('update:modelValue', false)">
          Cancel
        </AppButton>
        <AppButton type="submit" variant="primary" class="flex-1" :loading="saving">
          {{ card ? 'Save' : 'Add Card' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import type { KanbanCard, CardColor } from '~/types/project.types'

const props = defineProps<{
  modelValue: boolean
  card?: KanbanCard | null
  columnId: string
  projectId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
  'deleted': []
}>()

const { createCard, updateCard, deleteCard } = useProjects()
const store = useProjectStore()

const columns = computed(() =>
  [...store.columns].sort((a, b) => a.order - b.order),
)

const title = ref('')
const description = ref('')
const dueDate = ref('')
const color = ref<CardColor>('slate')
const selectedColumnId = ref(props.columnId)
const error = ref('')
const saving = ref(false)
const deleting = ref(false)

const colors = [
  { value: 'slate', bg: 'bg-slate-500' },
  { value: 'accent', bg: 'bg-accent-500' },
  { value: 'blue', bg: 'bg-blue-500' },
  { value: 'emerald', bg: 'bg-emerald-500' },
  { value: 'rose', bg: 'bg-rose-500' },
  { value: 'amber', bg: 'bg-amber-500' },
] as const

watch(() => props.modelValue, (open) => {
  if (!open) return
  if (props.card) {
    title.value = props.card.title
    description.value = props.card.description ?? ''
    dueDate.value = props.card.dueDate ?? ''
    color.value = (props.card.color as CardColor) ?? 'slate'
    selectedColumnId.value = props.card.columnId
  }
  else {
    title.value = ''
    description.value = ''
    dueDate.value = ''
    color.value = 'slate'
    selectedColumnId.value = props.columnId
  }
  error.value = ''
})

async function handleSubmit() {
  if (!title.value.trim()) { error.value = 'Please enter a title.'; return }
  error.value = ''
  saving.value = true
  try {
    if (props.card) {
      await updateCard(props.projectId, props.card.id, {
        title: title.value.trim(),
        description: description.value.trim(),
        dueDate: dueDate.value || null,
        color: color.value,
        columnId: selectedColumnId.value,
      })
    }
    else {
      await createCard(props.projectId, {
        title: title.value.trim(),
        description: description.value.trim(),
        dueDate: dueDate.value || null,
        color: color.value,
        columnId: selectedColumnId.value,
      })
    }
    emit('saved')
    emit('update:modelValue', false)
  }
  catch {
    error.value = 'Something went wrong. Please try again.'
  }
  finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.card) return
  deleting.value = true
  try {
    await deleteCard(props.projectId, props.card.id)
    emit('deleted')
    emit('update:modelValue', false)
  }
  catch {
    error.value = 'Failed to delete.'
  }
  finally {
    deleting.value = false
  }
}
</script>
