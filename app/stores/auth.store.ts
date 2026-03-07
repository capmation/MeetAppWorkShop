import { defineStore } from 'pinia'
import type { AppUser } from '~/types/user.types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AppUser | null,
    idToken: null as string | null,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    setUser(newUser: AppUser | null) { this.user = newUser },
    setToken(token: string | null) { this.idToken = token },
    setLoading(val: boolean) { this.loading = val },
    clear() { this.user = null; this.idToken = null },
  },
})
