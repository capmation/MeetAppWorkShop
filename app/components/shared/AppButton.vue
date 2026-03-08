<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses,
      variantClasses,
    ]"
    v-bind="$attrs"
  >
    <AppLoader v-if="loading" size="sm" class="shrink-0" />
    <slot />
  </button>
</template>

<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-500 hover:bg-accent-400 text-brand-900 shadow-sm shadow-accent-500/30 active:bg-accent-600',
  secondary: 'bg-brand-800/60 hover:bg-brand-700 text-white border border-white/15',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/30',
  ghost: 'text-neutral-200 hover:text-white hover:bg-white/5',
}
</script>
