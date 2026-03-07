<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-700 flex items-center justify-center px-4">
    <div class="w-full max-w-md animate-fade-in">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4 shadow-lg shadow-brand-600/40">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Capmation Meet</h1>
        <p class="text-slate-400 mt-2 text-sm">Video meetings, reimagined.</p>
      </div>
      <slot />
    </div>
  </div>
</template>
