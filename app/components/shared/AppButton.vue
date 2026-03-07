<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed',
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
  primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-600/30 active:bg-brand-700',
  secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-600/30',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
}
</script>
