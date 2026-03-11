import { watch } from 'vue'
import { useAuthStore } from '~/stores/auth.store'

/**
 * Guest middleware — use on public-only pages (e.g. login).
 * Redirects authenticated users to /home so they don't land on the login page.
 */
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Wait for Firebase auth to settle
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => authStore.loading,
        (loading) => {
          if (!loading) { stop(); resolve() }
        },
      )
    })
  }

  if (authStore.isAuthenticated) {
    return navigateTo('/home', { replace: true })
  }
})
