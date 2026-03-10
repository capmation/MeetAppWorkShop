export type TimeOffStatus = 'pending' | 'approved' | 'rejected'

export interface TimeOffRequest {
  id: string
  userUid: string
  userName?: string
  userEmail?: string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  type: string
  reason?: string
  status: TimeOffStatus
  days: number
  shortNotice: boolean
  monthKey: string // YYYY-MM
  createdAt: string
  approvedAt?: string
  eventIds?: string[]
}

export interface CreateTimeOffPayload {
  startDate: string
  endDate: string
  type: string
  reason?: string
}

export interface UpdateTimeOffStatusPayload {
  status: TimeOffStatus
}
