import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types/chat.types'

export type UnreadByUser = Record<string, number>

export const useDmStore = defineStore('dm', {
  state: () => ({
    unreadByUser: {} as UnreadByUser,
    activeUserUid: null as string | null,
    seenMessages: {} as Record<string, boolean>,
  }),
  getters: {
    unreadTotal: (state) => Object.values(state.unreadByUser).reduce((sum, value) => sum + value, 0),
  },
  actions: {
    setActiveUser(uid: string | null) {
      this.activeUserUid = uid
    },
    applyCounts(map: UnreadByUser) {
      this.unreadByUser = { ...map }
    },
    clearForUser(uid: string) {
      if (!this.unreadByUser[uid]) return
      const next = { ...this.unreadByUser }
      delete next[uid]
      this.unreadByUser = next
    },
    handleIncoming(message: ChatMessage, currentUserUid: string | null) {
      if (this.seenMessages[message.id]) return
      this.seenMessages[message.id] = true

      const isOwn = message.userId === currentUserUid
      const counterpartUid = isOwn ? message.toUserId ?? null : message.userId
      if (!counterpartUid || isOwn) return

      if (counterpartUid === this.activeUserUid) return

      this.unreadByUser = {
        ...this.unreadByUser,
        [counterpartUid]: (this.unreadByUser[counterpartUid] ?? 0) + 1,
      }
    },
  },
})
