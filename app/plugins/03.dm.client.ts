import { watch } from 'vue'
import type { ChatMessage } from '~/types/chat.types'
import { useAuth } from '~/composables/useAuth'
import { useSocket } from '~/composables/useSocket'
import { useDmStore } from '~/stores/dm.store'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const { user, idToken, refreshToken, loading } = useAuth()
  const { connect, isConnected, getSocket } = useSocket()
  const dmStore = useDmStore()

  const handleDmMessage = (message: ChatMessage) => {
    dmStore.handleIncoming(message, user.value?.uid ?? null)
  }

  const handleConnect = async () => {
    await announcePresence()
  }

  async function announcePresence() {
    if (loading.value) return
    if (!user.value) return
    const token = idToken.value ?? await refreshToken()
    if (!token) return
    const socket = getSocket()
    socket.emit('presence:announce', {
      token,
      user: {
        uid: user.value.uid,
        displayName: user.value.displayName,
        photoURL: user.value.photoURL ?? null,
      },
      status: 'online',
    })
  }

  async function ensureDmListener() {
    if (loading.value) return
    if (!user.value) return

    dmStore.hydrate(user.value.uid)
    await preloadAllUsers()

    const socket = connect()

    socket.off('dm:message', handleDmMessage)
    socket.on('dm:message', handleDmMessage)

    socket.off('connect', handleConnect)
    socket.on('connect', handleConnect)

    if (isConnected()) {
      await announcePresence()
    }
  }

  // Kick off once on client load and react to auth changes
  ensureDmListener()

  watch([() => user.value?.uid, () => loading.value], () => {
    ensureDmListener()
  })

  async function preloadAllUsers() {
    try {
      const token = idToken.value ?? await refreshToken()
      if (!token) return
      const users = await $fetch<{ uid: string; displayName: string; photoURL: string | null }[]>('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      users?.forEach((u) => {
        dmStore.ensureKnownUser(u.uid, u.displayName ?? 'Unknown user', u.photoURL ?? null)
      })
    }
    catch {
      // ignore preload failure; live presence will still populate as users connect
    }
  }
})
