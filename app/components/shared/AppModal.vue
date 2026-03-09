<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="$emit('update:modelValue', false)"
        />

        <!-- Panel with its own spring animation -->
        <Transition name="modal-panel" appear>
          <div
            v-if="modelValue"
            class="relative bg-brand-900/90 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md backdrop-blur"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-5 border-b border-white/10">
              <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
              <button
                class="text-neutral-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 active:scale-95"
                @click="$emit('update:modelValue', false)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
