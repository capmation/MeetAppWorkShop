import { defineStore } from 'pinia'
import type { Meeting } from '~/types/meeting.types'

export const useMeetingStore = defineStore('meeting', {
  state: () => ({
    meetings: [] as Meeting[],
    currentMeeting: null as Meeting | null,
    loading: false,
    error: null as string | null,
  }),
  actions: {
    setMeetings(list: Meeting[]) { this.meetings = list },
    addMeeting(meeting: Meeting) { this.meetings.unshift(meeting) },
    setCurrentMeeting(meeting: Meeting | null) { this.currentMeeting = meeting },
    setLoading(val: boolean) { this.loading = val },
    setError(msg: string | null) { this.error = msg },
  },
})
