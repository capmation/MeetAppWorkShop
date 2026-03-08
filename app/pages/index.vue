<template>
  <div>
    <div class="bg-brand-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
      <h2 class="text-xl font-semibold text-white mb-2">Welcome back</h2>
      <p class="text-neutral-200/80 text-sm mb-8">Sign in to start or join video meetings.</p>

      <GoogleLoginButton :loading="loading" @click="handleLogin" />

      <p v-if="errorMessage" class="mt-4 text-red-400 text-sm text-center">
        {{ errorMessage }}
      </p>

      <p class="mt-8 text-center text-xs text-neutral-300/70">
        By signing in, you agree to our terms of service. <br />
        Your data is protected with Firebase Auth.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { loginWithGoogle, isAuthenticated } = useAuth()
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

// Redirect if already logged in
watchEffect(() => {
  if (isAuthenticated.value) router.replace('/home')
})

async function handleLogin() {
  loading.value = true
  errorMessage.value = ''
  try {
    await loginWithGoogle()
    await router.replace('/home')
  }
  catch (err) {
    const e = err as { code?: string }
    if (e.code === 'auth/popup-closed-by-user') {
      errorMessage.value = 'Sign-in was cancelled.'
    }
    else {
      errorMessage.value = 'Failed to sign in. Please try again.'
    }
  }
  finally {
    loading.value = false
  }
}
</script>
