import { sanitizeMessage } from '~/utils/sanitize'
import { useChatStore } from '~/stores/chat.store'
import { useSocket } from '~/composables/useSocket'
import { useAuthStore } from '~/stores/auth.store'

export const useChat = (roomId: string) => {
  const chatStore = useChatStore()
  const authStore = useAuthStore()
  const { getSocket } = useSocket()

  function listenToMessages(): void {
    const socket = getSocket()
    socket.on('chat:message', (message) => {
      // Sanitize on receipt before storing (OWASP A03 XSS)
      const safe = { ...message, text: sanitizeMessage(message.text) }
      chatStore.addMessage(safe)
    })
  }

  function sendMessage(text: string): void {
    const trimmed = text.trim()
    if (!trimmed || !authStore.isAuthenticated) return
    // Max 2000 chars — enforce on client too
    const socket = getSocket()
    socket.emit('chat:send', { roomId, text: trimmed.slice(0, 2000) })
  }

  function stopListening(): void {
    const socket = getSocket()
    socket.off('chat:message')
  }

  return {
    messages: computed(() => chatStore.messages),
    isOpen: computed(() => chatStore.isOpen),
    unreadCount: computed(() => chatStore.unreadCount),
    sendMessage,
    listenToMessages,
    stopListening,
    openChat: chatStore.openChat,
    closeChat: chatStore.closeChat,
    toggleChat: chatStore.toggleChat,
    clearMessages: chatStore.clearMessages,
  }
}
