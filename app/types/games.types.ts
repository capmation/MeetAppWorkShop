export interface GameScore {
  uid: string
  displayName: string
  photoURL: string | null
  score: number
  level: number
  lines: number
  updatedAt: string
}

export interface GameDefinition {
  id: string
  title: string
  description: string
  emoji: string
  available: boolean
  color: string
}
