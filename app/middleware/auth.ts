import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Allow public routes
  if (to.path === '/') return
  // Allow direct meeting links (visibility enforced server-side)
  if (to.path.startsWith('/meet/')) return

  if (!authStore.isAuthenticated && !authStore.loading) {
    return navigateTo('/')
  }
})
