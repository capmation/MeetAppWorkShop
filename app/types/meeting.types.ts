export interface Meeting {
  id: string
  title: string
  hostUid: string
  hostName: string
  hostEmail?: string
  createdAt: string | null
  visibility: 'private' | 'public'
}

export interface CreateMeetingPayload {
  title: string
  visibility?: 'private' | 'public'
}
