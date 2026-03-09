export type EventColor = 'accent' | 'emerald' | 'blue' | 'amber' | 'rose'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startAt: string // ISO 8601
  endAt: string   // ISO 8601
  isVirtual: boolean
  meetingId?: string | null
  hostUid: string
  hostName: string
  color?: EventColor
}

export interface CreateEventPayload {
  title: string
  description?: string
  startAt: string
  endAt: string
  isVirtual: boolean
  color?: EventColor
}

export interface UpdateEventPayload {
  title?: string
  description?: string
  startAt?: string
  endAt?: string
  color?: EventColor
}
