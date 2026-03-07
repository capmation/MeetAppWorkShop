import { useMeetingStore } from '~/stores/meeting.store'
import { useAuthStore } from '~/stores/auth.store'
import type { Meeting, CreateMeetingPayload } from '~/types/meeting.types'

export const useMeeting = () => {
  const meetingStore = useMeetingStore()
  const authStore = useAuthStore()

  async function fetchMeeting(id: string): Promise<Meeting | null> {
    try {
      const data = await $fetch<Meeting>(`/api/meetings/${id}`, {
        headers: { authorization: `Bearer ${authStore.idToken}` },
      })
      meetingStore.setCurrentMeeting(data)
      return data
    }
    catch {
      meetingStore.setCurrentMeeting(null)
      return null
    }
  }

  async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
    meetingStore.setLoading(true)
    meetingStore.setError(null)
    try {
      const data = await $fetch<Meeting>('/api/meetings', {
        method: 'POST',
        body: payload,
        headers: { authorization: `Bearer ${authStore.idToken}` },
      })
      meetingStore.addMeeting(data)
      return data
    }
    catch (err) {
      const message = (err as Error).message || 'Failed to create meeting'
      meetingStore.setError(message)
      throw err
    }
    finally {
      meetingStore.setLoading(false)
    }
  }

  function getMeetingLink(meetingId: string): string {
    const origin = window.location.origin
    return `${origin}/meet/${meetingId}`
  }

  return {
    meetings: computed(() => meetingStore.meetings),
    currentMeeting: computed(() => meetingStore.currentMeeting),
    loading: computed(() => meetingStore.loading),
    error: computed(() => meetingStore.error),
    fetchMeeting,
    createMeeting,
    getMeetingLink,
  }
}
