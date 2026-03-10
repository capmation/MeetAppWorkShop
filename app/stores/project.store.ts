import { defineStore } from 'pinia'
import type { Project, KanbanColumn, KanbanCard } from '~/types/project.types'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const columns = ref<KanbanColumn[]>([])
  const cards = ref<KanbanCard[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setProjects(p: Project[]) { projects.value = p }
  function addProject(p: Project) { projects.value.unshift(p) }
  function removeProject(id: string) { projects.value = projects.value.filter(p => p.id !== id) }

  function setColumns(c: KanbanColumn[]) { columns.value = c }
  function addColumn(c: KanbanColumn) { columns.value.push(c) }
  function updateColumn(id: string, patch: Partial<KanbanColumn>) {
    const i = columns.value.findIndex(c => c.id === id)
    if (i >= 0) Object.assign(columns.value[i], patch)
  }
  function removeColumn(id: string) { columns.value = columns.value.filter(c => c.id !== id) }

  function setCards(c: KanbanCard[]) { cards.value = c }
  function addCard(c: KanbanCard) { cards.value.push(c) }
  function updateCard(id: string, patch: Partial<KanbanCard>) {
    const i = cards.value.findIndex(c => c.id === id)
    if (i >= 0) Object.assign(cards.value[i], patch)
  }
  function removeCard(id: string) { cards.value = cards.value.filter(c => c.id !== id) }

  function setLoading(v: boolean) { loading.value = v }
  function setError(v: string | null) { error.value = v }

  return {
    projects, columns, cards, loading, error,
    setProjects, addProject, removeProject,
    setColumns, addColumn, updateColumn, removeColumn,
    setCards, addCard, updateCard, removeCard,
    setLoading, setError,
  }
})
