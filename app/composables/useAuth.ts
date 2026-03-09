import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type Auth,
  type GoogleAuthProvider,
} from 'firebase/auth'
import { useAuthStore } from '~/stores/auth.store'
import type { AppUser } from '~/types/user.types'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { $firebaseAuth, $googleProvider } = useNuxtApp()

  const auth = $firebaseAuth as Auth
  const provider = $googleProvider as GoogleAuthProvider

  async function loginWithGoogle(): Promise<void> {
    const result = await signInWithPopup(auth, provider)
    const token = await result.user.getIdToken()

    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email ?? '',
      displayName: result.user.displayName ?? 'Anonymous',
      photoURL: result.user.photoURL,
    }

    authStore.setUser(appUser)
    authStore.setToken(token)
  }

  async function registerWithEmail(displayName: string, email: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    const token = await result.user.getIdToken()
    authStore.setUser({
      uid: result.user.uid,
      email: result.user.email ?? '',
      displayName,
      photoURL: result.user.photoURL,
    })
    authStore.setToken(token)
  }

  async function loginWithEmail(email: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const token = await result.user.getIdToken()
    authStore.setUser({
      uid: result.user.uid,
      email: result.user.email ?? '',
      displayName: result.user.displayName ?? 'Anonymous',
      photoURL: result.user.photoURL,
    })
    authStore.setToken(token)
  }

  async function logout(): Promise<void> {
    await signOut(auth)
    authStore.clear()
    await navigateTo('/')
  }

  async function refreshToken(): Promise<string | null> {
    const currentUser = auth.currentUser
    if (!currentUser) return null
    const token = await currentUser.getIdToken(true)
    authStore.setToken(token)
    return token
  }

  function initAuthListener(): void {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        authStore.setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? 'Anonymous',
          photoURL: firebaseUser.photoURL,
        })
        authStore.setToken(token)
      }
      else {
        authStore.clear()
      }
      authStore.setLoading(false)
    })
  }

  return {
    user: computed(() => authStore.user),
    idToken: computed(() => authStore.idToken),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refreshToken,
    initAuthListener,
  }
}
