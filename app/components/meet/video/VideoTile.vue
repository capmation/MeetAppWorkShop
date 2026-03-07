<template>
  <div class="relative bg-dark-800 rounded-2xl overflow-hidden flex items-center justify-center aspect-video">
    <!-- Video stream -->
    <video
      v-if="stream"
      ref="videoEl"
      :muted="muted"
      autoplay
      playsinline
      class="w-full h-full object-cover"
    />

    <!-- No video: avatar fallback -->
    <div v-else class="flex flex-col items-center gap-3">
      <AppAvatar :name="displayName" :photo="photoURL" size="xl" />
      <span class="text-slate-400 text-sm">Camera off</span>
    </div>

    <!-- Name badge -->
    <div class="absolute bottom-3 left-3 flex items-center gap-1.5">
      <span class="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium">
        {{ displayName }}{{ isLocal ? ' (You)' : '' }}
      </span>
      <!-- Muted mic indicator -->
      <div v-if="micMuted" class="bg-red-600/80 backdrop-blur-sm rounded-lg p-1">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  stream: MediaStream | null
  displayName: string
  photoURL?: string | null
  muted?: boolean
  isLocal?: boolean
  micMuted?: boolean
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

// Bind stream to video element when it changes
watch(() => props.stream, (stream) => {
  if (videoEl.value && stream) {
    videoEl.value.srcObject = stream
  }
}, { immediate: true })

onMounted(() => {
  if (videoEl.value && props.stream) {
    videoEl.value.srcObject = props.stream
  }
})
</script>
