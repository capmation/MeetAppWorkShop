import type { Ref } from 'vue'

export type HomePage = 'meetings' | 'teams' | 'projects'

interface UserSettings {
  homePage: HomePage | null
  onboardingDone: boolean
}

const settings = ref<UserSettings | null>(null)
const loading = ref(false)

export function useUserSettings() {
  const { idToken, refreshToken } = useAuth()

  async function getToken(): Promise<string> {
    const token = idToken.value ?? await refreshToken()
    if (!token) throw new Error('Not authenticated')
    return token
  }

  async function fetchSettings(): Promise<UserSettings> {
    if (settings.value) return settings.value
    loading.value = true
    try {
      const token = await getToken()
      const data = await $fetch<UserSettings>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      settings.value = data
      return data
    }
    finally {
      loading.value = false
    }
  }

  async function saveSettings(patch: Partial<UserSettings>): Promise<void> {
    const token = await getToken()
    await $fetch('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: patch,
    })
    if (settings.value) {
      settings.value = { ...settings.value, ...patch }
    }
  }

  return { settings: settings as Ref<UserSettings | null>, loading, fetchSettings, saveSettings }
}
