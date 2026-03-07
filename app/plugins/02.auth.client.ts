// Initialize Firebase auth state listener on app start.
// This ensures the auth store stays in sync with Firebase on page reload.
export default defineNuxtPlugin(() => {
  const { initAuthListener } = useAuth()
  initAuthListener()
})
