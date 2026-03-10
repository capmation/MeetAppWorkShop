import { computed } from 'vue'
import { useProjectStore } from '~/stores/project.store'
import type {
  Project,
  KanbanColumn,
  KanbanCard,
  CreateProjectPayload,
  CreateCardPayload,
  UpdateCardPayload,
} from '~/types/project.types'

export const useProjects = () => {
  const store = useProjectStore()
  const { idToken, refreshToken } = useAuth()

  async function getToken(): Promise<string | null> {
    return idToken.value ?? await refreshToken()
  }

  async function authHeaders() {
    const token = await getToken()
    return token ? { authorization: `Bearer ${token}` } : undefined
  }

  async function fetchProjects(): Promise<Project[]> {
    store.setLoading(true)
    try {
      const data = await $fetch<Project[]>('/api/projects', { headers: await authHeaders() })
      store.setProjects(data)
      return data
    }
    finally {
      store.setLoading(false)
    }
  }

  async function createProject(payload: CreateProjectPayload): Promise<Project> {
    const data = await $fetch<Project>('/api/projects', {
      method: 'POST',
      body: payload,
      headers: await authHeaders(),
    })
    store.addProject(data)
    return data
  }

  async function deleteProject(id: string): Promise<void> {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE', headers: await authHeaders() })
    store.removeProject(id)
  }

  async function fetchBoard(projectId: string): Promise<void> {
    store.setLoading(true)
    try {
      const [cols, cds] = await Promise.all([
        $fetch<KanbanColumn[]>(`/api/projects/${projectId}/columns`, { headers: await authHeaders() }),
        $fetch<KanbanCard[]>(`/api/projects/${projectId}/cards`, { headers: await authHeaders() }),
      ])
      store.setColumns(cols)
      store.setCards(cds)
    }
    finally {
      store.setLoading(false)
    }
  }

  async function createColumn(projectId: string, title: string): Promise<KanbanColumn> {
    const data = await $fetch<KanbanColumn>(`/api/projects/${projectId}/columns`, {
      method: 'POST',
      body: { title },
      headers: await authHeaders(),
    })
    store.addColumn(data)
    return data
  }

  async function updateColumn(projectId: string, colId: string, patch: { title: string }): Promise<void> {
    await $fetch(`/api/projects/${projectId}/columns/${colId}`, {
      method: 'PATCH',
      body: patch,
      headers: await authHeaders(),
    })
    store.updateColumn(colId, patch)
  }

  async function deleteColumn(projectId: string, colId: string): Promise<void> {
    await $fetch(`/api/projects/${projectId}/columns/${colId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    store.removeColumn(colId)
    store.cards.filter(c => c.columnId === colId).forEach(c => store.removeCard(c.id))
  }

  async function createCard(projectId: string, payload: CreateCardPayload): Promise<KanbanCard> {
    const data = await $fetch<KanbanCard>(`/api/projects/${projectId}/cards`, {
      method: 'POST',
      body: payload,
      headers: await authHeaders(),
    })
    store.addCard(data)
    return data
  }

  async function updateCard(projectId: string, cardId: string, patch: UpdateCardPayload): Promise<void> {
    await $fetch(`/api/projects/${projectId}/cards/${cardId}`, {
      method: 'PATCH',
      body: patch,
      headers: await authHeaders(),
    })
    store.updateCard(cardId, patch)
  }

  async function deleteCard(projectId: string, cardId: string): Promise<void> {
    await $fetch(`/api/projects/${projectId}/cards/${cardId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    store.removeCard(cardId)
  }

  return {
    projects: computed(() => store.projects),
    columns: computed(() => store.columns),
    cards: computed(() => store.cards),
    loading: computed(() => store.loading),
    fetchProjects,
    createProject,
    deleteProject,
    fetchBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
  }
}
