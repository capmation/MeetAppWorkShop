<template>
  <div>
    <div class="bg-brand-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30">
      <Transition name="modal-panel" mode="out-in">
        <!-- Sign in view -->
        <div v-if="mode === 'signin'" key="signin">
          <h2 class="text-xl font-semibold text-white mb-2">Welcome back</h2>
          <p class="text-neutral-200/80 text-sm mb-8">Sign in to start or join video meetings.</p>

          <GoogleLoginButton :loading="loading" @click="handleGoogleLogin" />

          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-white/10" />
            <span class="text-xs text-neutral-400">or</span>
            <div class="flex-1 h-px bg-white/10" />
          </div>

          <form @submit.prevent="handleEmailSignIn">
            <div class="space-y-3">
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                autocomplete="email"
                class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
              <input
                v-model="password"
                type="password"
                placeholder="Password"
                autocomplete="current-password"
                class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
            </div>

            <p v-if="errorMessage" class="mt-3 text-red-400 text-xs">{{ errorMessage }}</p>

            <AppButton type="submit" variant="primary" class="w-full mt-4" :loading="loading">
              Sign in
            </AppButton>
          </form>

          <p class="mt-6 text-center text-sm text-neutral-400">
            No account?
            <button class="text-accent-400 hover:text-accent-300 transition font-medium" @click="switchMode('signup')">
              Create one
            </button>
          </p>
        </div>

        <!-- Sign up view -->
        <div v-else key="signup">
          <h2 class="text-xl font-semibold text-white mb-2">Create account</h2>
          <p class="text-neutral-200/80 text-sm mb-8">Join MeetApp — it's free.</p>

          <form @submit.prevent="handleRegister">
            <div class="space-y-3">
              <input
                v-model="displayName"
                type="text"
                placeholder="Full name"
                autocomplete="name"
                maxlength="60"
                class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                autocomplete="email"
                class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
              <input
                v-model="password"
                type="password"
                placeholder="Password (min 6 characters)"
                autocomplete="new-password"
                class="w-full bg-brand-900/70 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
              />
            </div>

            <p v-if="errorMessage" class="mt-3 text-red-400 text-xs">{{ errorMessage }}</p>

            <AppButton type="submit" variant="primary" class="w-full mt-4" :loading="loading">
              Create account
            </AppButton>
          </form>

          <p class="mt-6 text-center text-sm text-neutral-400">
            Already have an account?
            <button class="text-accent-400 hover:text-accent-300 transition font-medium" @click="switchMode('signin')">
              Sign in
            </button>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { loginWithGoogle, loginWithEmail, registerWithEmail, isAuthenticated } = useAuth()
const router = useRouter()

const mode = ref<'signin' | 'signup'>('signin')
const loading = ref(false)
const errorMessage = ref('')
const email = ref('')
const password = ref('')
const displayName = ref('')

watchEffect(() => {
  if (isAuthenticated.value) router.replace('/home')
})

function switchMode(m: 'signin' | 'signup') {
  mode.value = m
  errorMessage.value = ''
  email.value = ''
  password.value = ''
  displayName.value = ''
}

function firebaseErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Invalid email or password.'
    case 'auth/email-already-in-use': return 'An account with this email already exists.'
    case 'auth/weak-password': return 'Password must be at least 6 characters.'
    case 'auth/invalid-email': return 'Invalid email address.'
    case 'auth/popup-closed-by-user': return 'Sign-in was cancelled.'
    default: return 'Something went wrong. Please try again.'
  }
}

async function handleGoogleLogin() {
  loading.value = true
  errorMessage.value = ''
  try {
    await loginWithGoogle()
    await router.replace('/home')
  }
  catch (err) {
    errorMessage.value = firebaseErrorMessage((err as { code?: string }).code)
  }
  finally {
    loading.value = false
  }
}

async function handleEmailSignIn() {
  if (!email.value || !password.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await loginWithEmail(email.value, password.value)
    await router.replace('/home')
  }
  catch (err) {
    errorMessage.value = firebaseErrorMessage((err as { code?: string }).code)
  }
  finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!displayName.value.trim() || !email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    await registerWithEmail(displayName.value.trim(), email.value, password.value)
    await router.replace('/home')
  }
  catch (err) {
    errorMessage.value = firebaseErrorMessage((err as { code?: string }).code)
  }
  finally {
    loading.value = false
  }
}
</script>
