import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types/chat.types'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as ChatMessage[],
    isOpen: true,
    unreadCount: 0,
  }),
  actions: {
    addMessage(message: ChatMessage) {
      this.messages.push(message)
      if (!this.isOpen) this.unreadCount++
    },
    openChat() { this.isOpen = true; this.unreadCount = 0 },
    closeChat() { this.isOpen = false },
    toggleChat() { if (this.isOpen) this.closeChat(); else this.openChat() },
    clearMessages() { this.messages = []; this.unreadCount = 0 },
  },
})
