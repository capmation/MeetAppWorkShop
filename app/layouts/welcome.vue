<template>
  <div class="min-h-screen text-white flex flex-col bg-brand-900 overflow-hidden">
    <!-- Ambient background glows -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-32 -left-32 w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-3xl" />
      <div class="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2" />
      <div class="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-violet-500/6 rounded-full blur-3xl" />
    </div>

    <slot />
  </div>
</template>
