import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../app/stores/auth.store'
import type { AppUser } from '../../../app/types/user.types'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockUser: AppUser = {
    uid: 'uid1',
    email: 'alice@test.com',
    displayName: 'Alice Smith',
    photoURL: null,
  }

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.loading).toBe(true)
  })

  it('sets user and marks authenticated', () => {
    const store = useAuthStore()
    store.setUser(mockUser)
    expect(store.user?.email).toBe('alice@test.com')
    expect(store.isAuthenticated).toBe(true)
  })

  it('stores id token', () => {
    const store = useAuthStore()
    store.setToken('firebase-jwt-token')
    expect(store.idToken).toBe('firebase-jwt-token')
  })

  it('clears user and token on logout', () => {
    const store = useAuthStore()
    store.setUser(mockUser)
    store.setToken('token')
    store.clear()
    expect(store.user).toBeNull()
    expect(store.idToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('sets loading flag', () => {
    const store = useAuthStore()
    store.setLoading(false)
    expect(store.loading).toBe(false)
  })
})
