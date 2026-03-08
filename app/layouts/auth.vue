<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-brand-900/95 page-surface">
    <div class="w-full max-w-md animate-fade-in bg-brand-900/80 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-brand-900/90 border border-white/10 mb-4 shadow-lg shadow-black/30">
          <img src="/capmation-logo.svg" alt="Capmation" class="h-8 w-auto" />
        </div>
        <h1 class="text-3xl font-semibold text-white tracking-tight">Capmation Meet</h1>
        <p class="text-neutral-200/80 mt-2 text-sm">Video meetings, reimagined.</p>
      </div>
      <slot />
    </div>
  </div>
</template>
