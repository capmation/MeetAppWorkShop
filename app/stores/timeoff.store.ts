import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimeOffRequest } from '~/types/timeoff.types'

export const useTimeOffStore = defineStore('timeoff', () => {
  const requests = ref<TimeOffRequest[]>([])
  const types = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setRequests(list: TimeOffRequest[]) { requests.value = list }
  function addRequest(req: TimeOffRequest) { requests.value.unshift(req) }
  function updateRequest(id: string, patch: Partial<TimeOffRequest>) {
    const idx = requests.value.findIndex(r => r.id === id)
    if (idx !== -1) requests.value[idx] = { ...requests.value[idx], ...patch }
  }
  function removeRequest(id: string) { requests.value = requests.value.filter(r => r.id !== id) }

  function setTypes(list: string[]) { types.value = list }

  function setLoading(v: boolean) { loading.value = v }
  function setError(msg: string | null) { error.value = msg }

  return {
    requests,
    types,
    loading,
    error,
    setRequests,
    addRequest,
    updateRequest,
    removeRequest,
    setTypes,
    setLoading,
    setError,
  }
})
