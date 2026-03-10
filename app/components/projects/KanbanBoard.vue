<template>
  <div :class="mobileColumnId ? 'w-full' : 'flex gap-5 h-full items-start'">
    <!-- Columns -->
    <KanbanColumn
      v-for="col in visibleColumns"
      :key="col.id"
      :column="col"
      :is-mobile="!!mobileColumnId"
    />

    <!-- Add column (desktop only) -->
    <div v-if="!mobileColumnId" class="w-72 shrink-0">
      <div v-if="!addingColumn">
        <button
          class="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-white/15 text-slate-500 hover:text-white hover:border-white/25 hover:bg-white/3 transition-all duration-200 text-sm"
          @click="addingColumn = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add column
        </button>
      </div>
      <div v-else class="bg-brand-800/60 border border-white/10 rounded-2xl p-3">
        <input
          ref="newColInput"
          v-model="newColTitle"
          type="text"
          placeholder="Column name"
          maxlength="40"
          class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
          @keydown.enter="submitNewColumn"
          @keydown.escape="addingColumn = false"
        />
        <div class="flex gap-2 mt-2">
          <AppButton size="sm" variant="primary" class="flex-1" :loading="addingColLoading" @click="submitNewColumn">
            Add
          </AppButton>
          <AppButton size="sm" variant="ghost" @click="addingColumn = false">
            Cancel
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { KanbanCard, KanbanColumn } from '~/types/project.types'

const props = defineProps<{
  projectId: string
  mobileColumnId?: string | null
}>()

const store = useProjectStore()
const { updateCard, createColumn } = useProjects()

const sortedColumns = computed(() =>
  [...store.columns].sort((a, b) => a.order - b.order),
)

const visibleColumns = computed(() => {
  if (props.mobileColumnId) return sortedColumns.value.filter(c => c.id === props.mobileColumnId)
  return sortedColumns.value
})

// ── Add column (desktop) ──────────────────────────────────────────
const addingColumn = ref(false)
const newColTitle = ref('')
const addingColLoading = ref(false)
const newColInput = ref<HTMLInputElement | null>(null)

watch(addingColumn, (v) => {
  if (v) {
    newColTitle.value = ''
    nextTick(() => newColInput.value?.focus())
  }
})

async function submitNewColumn() {
  const title = newColTitle.value.trim()
  if (!title) return
  addingColLoading.value = true
  try {
    await createColumn(props.projectId, title)
    addingColumn.value = false
  }
  finally {
    addingColLoading.value = false
  }
}

// ── Drag & Drop (provide to children) ────────────────────────────
const dragging = ref<KanbanCard | null>(null)

function startDrag(card: KanbanCard) {
  dragging.value = card
}

function endDrag() {
  dragging.value = null
}

async function drop(columnId: string, columnCards: KanbanCard[], insertIndex: number) {
  const card = dragging.value
  if (!card) return
  dragging.value = null

  const otherCards = columnCards.filter(c => c.id !== card.id)

  let adjustedIndex = insertIndex
  if (card.columnId === columnId) {
    const origIdx = columnCards.findIndex(c => c.id === card.id)
    if (origIdx !== -1 && origIdx < insertIndex) {
      adjustedIndex = Math.max(0, insertIndex - 1)
    }
  }
  adjustedIndex = Math.max(0, Math.min(adjustedIndex, otherCards.length))

  let newOrder: number
  if (otherCards.length === 0) {
    newOrder = 1000
  }
  else if (adjustedIndex <= 0) {
    newOrder = otherCards[0].order - 1000
  }
  else if (adjustedIndex >= otherCards.length) {
    newOrder = otherCards[otherCards.length - 1].order + 1000
  }
  else {
    newOrder = (otherCards[adjustedIndex - 1].order + otherCards[adjustedIndex].order) / 2
  }

  store.updateCard(card.id, { columnId, order: newOrder })
  await updateCard(props.projectId, card.id, { columnId, order: newOrder })
}

provide('kanban-dnd', {
  dragging: dragging as Ref<KanbanCard | null>,
  startDrag,
  endDrag,
  drop,
})
</script>
