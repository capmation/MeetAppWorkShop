import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types/chat.types'

export type UnreadByUser = Record<string, number>
export type MessagesByUser = Record<string, ChatMessage[]>
export type UserProfiles = Record<string, { displayName: string; photoURL: string | null }>

const STORAGE_PREFIX = 'dm:data:'

export const useDmStore = defineStore('dm', {
  state: () => ({
    unreadByUser: {} as UnreadByUser,
    messagesByUser: {} as MessagesByUser,
    activeUserUid: null as string | null,
    seenMessages: {} as Record<string, boolean>,
    currentUserUid: null as string | null,
    userProfiles: {} as UserProfiles,
  }),
  getters: {
    unreadTotal: (state) => Object.values(state.unreadByUser).reduce((sum, value) => sum + value, 0),
  },
  actions: {
    setActiveUser(uid: string | null) {
      this.activeUserUid = uid
      if (uid) this.clearForUser(uid)
    },
    setCurrentUser(uid: string | null) {
      this.currentUserUid = uid
    },
    applyCounts(map: UnreadByUser) {
      this.unreadByUser = { ...map }
      this.persist()
    },
    clearForUser(uid: string) {
      if (!this.unreadByUser[uid]) return
      const next = { ...this.unreadByUser }
      delete next[uid]
      this.unreadByUser = next
      this.persist()
    },
    handleIncoming(message: ChatMessage, currentUserUid: string | null) {
      if (this.seenMessages[message.id]) return
      this.seenMessages[message.id] = true
      this.currentUserUid = currentUserUid

      const isOwn = message.userId === currentUserUid
      const counterpartUid = isOwn ? message.toUserId ?? null : message.userId
      if (!counterpartUid) return

      const counterpartName = isOwn ? message.toUserName ?? 'Unknown' : message.userName
      const counterpartPhoto = isOwn ? null : message.userPhoto ?? null
      this.ensureKnownUser(counterpartUid, counterpartName, counterpartPhoto)

      // Store message history per counterpart
      const existing = this.messagesByUser[counterpartUid] ?? []
      this.messagesByUser = {
        ...this.messagesByUser,
        [counterpartUid]: [...existing, message],
      }

      if (isOwn) {
        this.persist()
        return
      }

      if (counterpartUid === this.activeUserUid) {
        this.persist()
        return
      }

      this.unreadByUser = {
        ...this.unreadByUser,
        [counterpartUid]: (this.unreadByUser[counterpartUid] ?? 0) + 1,
      }
      this.persist()
    },
    ensureKnownUser(uid: string, displayName: string, photoURL: string | null) {
      const existing = this.userProfiles[uid]
      if (existing && existing.displayName === displayName && existing.photoURL === photoURL) return
      this.userProfiles = { ...this.userProfiles, [uid]: { displayName, photoURL } }
      this.persist()
    },
    persist() {
      if (!import.meta.client || !this.currentUserUid) return
      const payload = {
        unreadByUser: this.unreadByUser,
        messagesByUser: this.messagesByUser,
        seenMessages: this.seenMessages,
        userProfiles: this.userProfiles,
      }
      localStorage.setItem(`${STORAGE_PREFIX}${this.currentUserUid}`, JSON.stringify(payload))
    },
    hydrate(currentUserUid: string | null) {
      if (!import.meta.client || !currentUserUid) return
      this.currentUserUid = currentUserUid
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${currentUserUid}`)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw) as { unreadByUser?: UnreadByUser; messagesByUser?: MessagesByUser; seenMessages?: Record<string, boolean>; userProfiles?: UserProfiles }
        this.unreadByUser = parsed.unreadByUser ?? {}
        this.messagesByUser = parsed.messagesByUser ?? {}
        this.seenMessages = parsed.seenMessages ?? {}
        this.userProfiles = parsed.userProfiles ?? {}
      }
      catch {
        // ignore malformed cache
      }
    },
  },
})
