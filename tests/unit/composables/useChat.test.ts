import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '../../../app/stores/chat.store'

// Mock socket and auth
vi.mock('../../../app/composables/useSocket', () => ({
  useSocket: () => ({
    getSocket: () => ({
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    }),
  }),
}))

vi.mock('../../../app/stores/auth.store', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { uid: 'user1', displayName: 'Alice', email: 'alice@test.com', photoURL: null },
  }),
}))

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty messages', () => {
    const store = useChatStore()
    expect(store.messages).toHaveLength(0)
  })

  it('adds a message', () => {
    const store = useChatStore()
    store.addMessage({
      id: '1',
      roomId: 'room1',
      userId: 'user1',
      userName: 'Alice',
      userPhoto: null,
      text: 'Hello!',
      timestamp: Date.now(),
    })
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0].text).toBe('Hello!')
  })

  it('increments unread count when chat is closed', () => {
    const store = useChatStore()
    store.closeChat()
    store.addMessage({
      id: '1', roomId: 'room1', userId: 'user2', userName: 'Bob',
      userPhoto: null, text: 'Hey', timestamp: Date.now(),
    })
    expect(store.unreadCount).toBe(1)
  })

  it('resets unread count when chat is opened', () => {
    const store = useChatStore()
    store.closeChat()
    store.addMessage({
      id: '1', roomId: 'room1', userId: 'user2', userName: 'Bob',
      userPhoto: null, text: 'Hey', timestamp: Date.now(),
    })
    store.openChat()
    expect(store.unreadCount).toBe(0)
  })

  it('clears messages', () => {
    const store = useChatStore()
    store.addMessage({
      id: '1', roomId: 'room1', userId: 'user1', userName: 'Alice',
      userPhoto: null, text: 'Hi', timestamp: Date.now(),
    })
    store.clearMessages()
    expect(store.messages).toHaveLength(0)
  })
})
