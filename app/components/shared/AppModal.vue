<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />

        <!-- Panel -->
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            v-if="modelValue"
            class="relative bg-dark-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-5 border-b border-white/10">
              <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
              <button
                class="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                @click="$emit('update:modelValue', false)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Body -->
            <div class="p-5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; title: string }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
