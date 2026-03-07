import { useAuthStore } from '~/stores/auth.store'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Allow public routes
  if (to.path === '/') return

  if (!authStore.isAuthenticated && !authStore.loading) {
    return navigateTo('/')
  }
})
