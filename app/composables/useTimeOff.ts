import { computed } from 'vue'
import { useTimeOffStore } from '~/stores/timeoff.store'
import type {
  TimeOffRequest,
  TimeOffStatus,
  CreateTimeOffPayload,
} from '~/types/timeoff.types'

export const useTimeOff = () => {
  const store = useTimeOffStore()
  const { idToken, refreshToken } = useAuth()

  async function getToken(): Promise<string | null> {
    return idToken.value ?? await refreshToken()
  }

  async function authHeaders() {
    const token = await getToken()
    return token ? { authorization: `Bearer ${token}` } : undefined
  }

  async function fetchRequests(month?: string): Promise<TimeOffRequest[]> {
    store.setLoading(true)
    store.setError(null)
    try {
      const data = await $fetch<TimeOffRequest[]>('/api/time-off', {
        query: month ? { month } : undefined,
        headers: await authHeaders(),
      })
      store.setRequests(data)
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

  async function createRequest(payload: CreateTimeOffPayload): Promise<TimeOffRequest> {
    const data = await $fetch<TimeOffRequest>('/api/time-off', {
      method: 'POST',
      body: payload,
      headers: await authHeaders(),
    })
    store.addRequest(data)
    return data
  }

  async function updateStatus(id: string, status: TimeOffStatus): Promise<TimeOffRequest> {
    const data = await $fetch<TimeOffRequest>(`/api/time-off/${id}`, {
      method: 'PATCH',
      body: { status },
      headers: await authHeaders(),
    })
    store.updateRequest(id, data)
    return data
  }

  async function deleteRequest(id: string): Promise<void> {
    await $fetch(`/api/time-off/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    })
    store.removeRequest(id)
  }

  async function fetchTypes(): Promise<string[]> {
    const data = await $fetch<string[]>('/api/time-off/types', {
      headers: await authHeaders(),
    })
    store.setTypes(data)
    return data
  }

  async function addType(label: string): Promise<string[]> {
    const data = await $fetch<string[]>('/api/time-off/types', {
      method: 'POST',
      body: { label },
      headers: await authHeaders(),
    })
    store.setTypes(data)
    return data
  }

  return {
    requests: computed(() => store.requests),
    types: computed(() => store.types),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    fetchRequests,
    createRequest,
    updateStatus,
    deleteRequest,
    fetchTypes,
    addType,
  }
}
