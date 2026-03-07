export interface Meeting {
  id: string
  title: string
  hostUid: string
  hostName: string
  createdAt: Date | null
}

export interface CreateMeetingPayload {
  title: string
}
