export type ProjectColor = 'accent' | 'blue' | 'emerald' | 'rose' | 'amber' | 'violet'
export type CardColor = 'slate' | 'accent' | 'blue' | 'emerald' | 'rose' | 'amber'

export interface Project {
  id: string
  title: string
  description?: string
  color: ProjectColor
  hostUid: string
  hostName: string
  createdAt: string
}

export interface KanbanColumn {
  id: string
  title: string
  order: number
  projectId: string
}

export interface KanbanCard {
  id: string
  title: string
  description?: string
  dueDate?: string | null
  color?: CardColor
  order: number
  columnId: string
  projectId: string
  createdAt: string
}

export interface CreateProjectPayload {
  title: string
  description?: string
  color?: ProjectColor
}

export interface CreateCardPayload {
  title: string
  description?: string
  dueDate?: string | null
  color?: CardColor
  columnId: string
  order?: number
}

export interface UpdateCardPayload {
  title?: string
  description?: string
  dueDate?: string | null
  color?: CardColor
  columnId?: string
  order?: number
}
