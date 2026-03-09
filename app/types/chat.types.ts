export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  userPhoto: string | null
  text: string
  timestamp: number
  toUserId?: string
  toUserName?: string
}
