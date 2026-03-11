<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- ── Auth init overlay ─────────────────────────────────────────────
         Stays fully opaque while Firebase resolves the session AND while
         any resulting middleware redirect + page render completes.
         Only fades out once the router has settled on the final route.
    ──────────────────────────────────────────────────────────────────── -->
    <Transition name="auth-init">
      <div
        v-if="overlayVisible"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style="background: #050b16;"
      >
        <img
          src="/capmation-logo.svg"
          alt="Loading"
          class="h-10 w-auto mb-6 opacity-80"
        />
        <svg class="w-7 h-7 animate-spin text-[#9fbf1a]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

// Overlay stays visible until auth settles AND any redirect finishes rendering
const overlayVisible = ref(true)

watch(
  () => authStore.loading,
  (loading) => {
    if (loading) return

    // Subscribe to the next completed navigation.
    // If auth triggered a redirect (e.g. → /  or → /home), afterEach fires
    // once the new route is fully committed, so the layout has already switched.
    const unsubscribe = router.afterEach((_to, _from, failure) => {
      // Skip redirected/aborted navigations — wait for the final successful one.
      if (failure) return
      unsubscribe()
      // Double rAF: Vue has already written to the DOM after afterEach, but the
      // browser hasn't painted yet. Two frames ensures the new layout is on-screen
      // before the overlay starts fading, eliminating any flash.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlayVisible.value = false
        })
      })
    })

    // Fallback: user is already authenticated and on the correct page — no
    // navigation will fire, so afterEach never triggers. Use a generous timeout
    // that only fires when the router is truly idle.
    setTimeout(() => {
      unsubscribe() // safe to call even if already unsubscribed
      overlayVisible.value = false
    }, 1500)
  },
  { immediate: true },
)
</script>

<style>
.auth-init-leave-active {
  transition: opacity 0.35s ease;
}
.auth-init-leave-to {
  opacity: 0;
}
.auth-init-enter-active {
  /* Visible from frame 0 — no enter transition */
  transition: none;
}
</style>
