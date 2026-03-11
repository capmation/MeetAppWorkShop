<template>
  <!--
    fixed inset-0 guarantees the layout fills the full viewport regardless
    of any NuxtLayout parent wrapper or layout-switch transition state.
    overflow-y-auto allows scrolling if the form grows taller than the screen.
  -->
  <div class="fixed inset-0 overflow-y-auto bg-brand-900/95 page-surface flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md animate-fade-in bg-brand-900/80 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30 backdrop-blur">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-brand-900/90 border border-white/10 mb-4 shadow-lg shadow-black/30">
          <img src="/capmation-logo.svg" alt="Capmation" class="h-8 w-auto" />
        </div>
        <h1 class="text-3xl font-semibold text-white tracking-tight">CAPCOM 2.0</h1>
        <p class="text-neutral-200/80 mt-2 text-sm">Keep it simple, stay calm.</p>
      </div>
      <slot />
    </div>
  </div>
</template>
