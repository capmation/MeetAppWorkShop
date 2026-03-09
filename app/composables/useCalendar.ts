import { computed } from 'vue'
import { useEventStore } from '~/stores/event.store'
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '~/types/event.types'

export const useCalendar = () => {
  const store = useEventStore()
  const { idToken, refreshToken } = useAuth()

  async function getToken(): Promise<string | null> {
    return idToken.value ?? await refreshToken()
  }

  async function authHeaders() {
    const token = await getToken()
    return token ? { authorization: `Bearer ${token}` } : undefined
  }

  async function fetchEvents(from: string, to: string): Promise<CalendarEvent[]> {
    store.setLoading(true)
    store.setError(null)
    try {
      const data = await $fetch<CalendarEvent[]>('/api/events', {
        query: { from, to },
        headers: await authHeaders(),
      })
      store.setEvents(data)
      return data
    }
    catch (err) {
      store.setError((err as Error).message)
      throw err
    }
    finally {
      store.setLoading(false)
    }
  }

  async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
    const data = await $fetch<CalendarEvent>('/api/events', {
      method: 'POST',
      body: payload,
      headers: await authHeaders(),
    })
    store.addEvent(data)
    return data
  }

  async function updateEvent(id: string, patch: UpdateEventPayload): Promise<CalendarEvent> {
    const data = await $fetch<CalendarEvent>(`/api/events/${id}`, {
      method: 'PATCH',
      body: patch,
      headers: await authHeaders(),
    })
    store.updateEvent(id, data as Partial<CalendarEvent>)
    return data
  }

  async function deleteEvent(id: string): Promise<void> {
    await $fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    store.removeEvent(id)
  }

  return {
    events: computed(() => store.events),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
