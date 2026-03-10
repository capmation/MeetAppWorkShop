<template>
  <div :class="['flex flex-col', isMobile ? 'w-full' : 'w-72 shrink-0 max-h-full']">
    <!-- Column header -->
    <div class="flex items-center gap-2 mb-3 px-1">
      <div v-if="!editingTitle" class="flex items-center gap-2 flex-1 min-w-0">
        <h3
          class="font-semibold text-white text-sm truncate cursor-pointer hover:text-accent-400 transition-colors"
          @click="startEditTitle"
        >
          {{ column.title }}
        </h3>
        <span class="text-xs text-slate-500 shrink-0 bg-brand-800/60 border border-white/8 rounded-full px-2 py-0.5">
          {{ columnCards.length }}
        </span>
      </div>
      <input
        v-else
        ref="titleInput"
        v-model="titleDraft"
        type="text"
        maxlength="40"
        class="flex-1 min-w-0 bg-brand-800 border border-accent-500/40 rounded-lg px-2 py-0.5 text-white text-sm focus:outline-none"
        @blur="saveTitle"
        @keydown.enter="saveTitle"
        @keydown.escape="editingTitle = false"
      />
      <div class="flex items-center gap-0.5 shrink-0">
        <button
          class="w-7 h-7 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          title="Add card"
          @click="openAddCard"
        >
          <svg class="w-4 h-4 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          class="w-7 h-7 md:w-6 md:h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete column"
          @click="handleDeleteColumn"
        >
          <svg class="w-3.5 h-3.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Cards drop zone -->
    <div
      ref="dropZoneRef"
      :class="[
        'flex flex-col gap-2 overflow-x-hidden rounded-2xl p-2 transition-colors duration-150',
        isMobile ? 'overflow-y-visible' : 'flex-1 overflow-y-auto pr-1 pb-2 min-h-[80px]',
        isDragOver ? 'bg-accent-500/5 ring-1 ring-accent-500/20' : 'bg-brand-900/30',
      ]"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <template v-for="(card, i) in columnCards" :key="card.id">
        <!-- Drop indicator above this card -->
        <div
          v-if="isDragOver && dropIndex === i"
          class="h-0.5 bg-accent-400 rounded-full mx-1 shrink-0"
        />
        <KanbanCard
          :card="card"
          :is-dragging="dragging?.id === card.id"
          @click="openEditCard(card)"
          @dragstart="startDrag"
          @dragend="endDrag"
        />
      </template>
      <!-- Drop indicator at end -->
      <div
        v-if="isDragOver && dropIndex === columnCards.length"
        class="h-0.5 bg-accent-400 rounded-full mx-1 shrink-0"
      />
      <!-- Empty state -->
      <div
        v-if="columnCards.length === 0 && !isDragOver"
        class="flex items-center justify-center py-8"
      >
        <p class="text-xs text-slate-600">No cards yet</p>
      </div>
    </div>

    <!-- Add card button -->
    <button
      class="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors text-sm"
      @click="openAddCard"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
      Add card
    </button>

    <!-- Card modal -->
    <KanbanCardModal
      v-model="cardModalOpen"
      :card="editingCard"
      :column-id="column.id"
      :project-id="column.projectId"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { KanbanColumn, KanbanCard } from '~/types/project.types'

const props = defineProps<{
  column: KanbanColumn
  isMobile?: boolean
}>()

const store = useProjectStore()
const { updateColumn, deleteColumn } = useProjects()

// Inject DnD context from KanbanBoard
const { dragging, startDrag, endDrag, drop } = inject<{
  dragging: Ref<KanbanCard | null>
  startDrag: (card: KanbanCard) => void
  endDrag: () => void
  drop: (columnId: string, columnCards: KanbanCard[], insertIndex: number) => Promise<void>
}>('kanban-dnd')!

const dropZoneRef = ref<HTMLElement | null>(null)
const isDragOver = ref(false)
const dropIndex = ref(0)
let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

const columnCards = computed(() =>
  store.cards.filter(c => c.columnId === props.column.id).sort((a, b) => a.order - b.order),
)

// ── Column title editing ──────────────────────────────────────────
const editingTitle = ref(false)
const titleDraft = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  titleDraft.value = props.column.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

async function saveTitle() {
  editingTitle.value = false
  const trimmed = titleDraft.value.trim()
  if (!trimmed || trimmed === props.column.title) return
  await updateColumn(props.column.projectId, props.column.id, { title: trimmed })
}

async function handleDeleteColumn() {
  if (!confirm(`Delete column "${props.column.title}" and all its cards?`)) return
  await deleteColumn(props.column.projectId, props.column.id)
}

// ── Card modal ────────────────────────────────────────────────────
const cardModalOpen = ref(false)
const editingCard = ref<KanbanCard | null>(null)

function openAddCard() {
  editingCard.value = null
  cardModalOpen.value = true
}

function openEditCard(card: KanbanCard) {
  editingCard.value = card
  cardModalOpen.value = true
}

// ── Drag & Drop ───────────────────────────────────────────────────
function calcDropIndex(e: DragEvent): number {
  const zone = dropZoneRef.value
  if (!zone) return columnCards.value.length

  const cardEls = zone.querySelectorAll<HTMLElement>('[draggable="true"]')
  if (!cardEls.length) return 0

  for (let i = 0; i < cardEls.length; i++) {
    const rect = cardEls[i].getBoundingClientRect()
    if (e.clientY < rect.top + rect.height / 2) return i
  }
  return cardEls.length
}

function onDragOver(e: DragEvent) {
  if (!dragging.value) return
  if (dragLeaveTimer) { clearTimeout(dragLeaveTimer); dragLeaveTimer = null }
  isDragOver.value = true
  dropIndex.value = calcDropIndex(e)
}

function onDragLeave() {
  dragLeaveTimer = setTimeout(() => { isDragOver.value = false }, 80)
}

async function onDrop() {
  isDragOver.value = false
  if (dragLeaveTimer) { clearTimeout(dragLeaveTimer); dragLeaveTimer = null }
  await drop(props.column.id, columnCards.value, dropIndex.value)
}
</script>
