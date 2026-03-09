import { defineStore } from 'pinia'
import type { CalendarEvent } from '~/types/event.types'

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as CalendarEvent[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    setEvents(events: CalendarEvent[]) {
      this.events = events
    },
    addEvent(event: CalendarEvent) {
      this.events.push(event)
    },
    updateEvent(id: string, patch: Partial<CalendarEvent>) {
      const idx = this.events.findIndex(e => e.id === id)
      if (idx !== -1) this.events[idx] = { ...this.events[idx], ...patch }
    },
    removeEvent(id: string) {
      this.events = this.events.filter(e => e.id !== id)
    },
    setLoading(v: boolean) { this.loading = v },
    setError(e: string | null) { this.error = e },
  },
})
