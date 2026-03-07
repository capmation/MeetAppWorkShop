<template>
  <div
    :class="[
      'rounded-full overflow-hidden shrink-0 flex items-center justify-center font-semibold text-white select-none',
      sizeClasses[size],
      !photo ? bgColor : '',
    ]"
    :title="name"
  >
    <img v-if="photo" :src="photo" :alt="name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  name: string
  photo?: string | null
  size?: Size
}>(), { size: 'md' })

const sizeClasses: Record<Size, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const initials = computed(() => {
  return props.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
})

// Deterministic color from name
const bgColor = computed(() => {
  const colors = [
    'bg-purple-600', 'bg-blue-600', 'bg-green-600',
    'bg-yellow-600', 'bg-red-600', 'bg-pink-600',
    'bg-indigo-600', 'bg-cyan-600',
  ]
  let hash = 0
  for (const c of props.name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
})
</script>
