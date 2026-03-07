<template>
  <div class="flex items-center justify-center gap-3 px-6 py-4 bg-dark-800/80 backdrop-blur-sm border-t border-white/10">
    <!-- Mic toggle -->
    <button
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        isMicOn ? 'bg-dark-700 hover:bg-dark-600 border border-white/10' : 'bg-red-600 hover:bg-red-500',
      ]"
      :title="isMicOn ? 'Mute microphone' : 'Unmute microphone'"
      @click="$emit('toggle-mic')"
    >
      <svg v-if="isMicOn" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    </button>

    <!-- Camera toggle -->
    <button
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        isCameraOn ? 'bg-dark-700 hover:bg-dark-600 border border-white/10' : 'bg-red-600 hover:bg-red-500',
      ]"
      :title="isCameraOn ? 'Turn off camera' : 'Turn on camera'"
      @click="$emit('toggle-camera')"
    >
      <svg v-if="isCameraOn" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <svg v-else class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    </button>

    <!-- Chat toggle (with unread badge) -->
    <button
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        chatOpen ? 'bg-brand-600/30 border border-brand-500/50' : 'bg-dark-700 hover:bg-dark-600 border border-white/10',
      ]"
      title="Toggle chat"
      @click="$emit('toggle-chat')"
    >
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span
        v-if="unreadCount > 0 && !chatOpen"
        class="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center font-bold"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Copy link -->
    <button
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 bg-dark-700 hover:bg-dark-600 border border-white/10',
        linkCopied ? 'text-green-400' : 'text-white',
      ]"
      :title="linkCopied ? 'Copied!' : 'Copy meeting link'"
      @click="$emit('copy-link')"
    >
      <svg v-if="!linkCopied" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <svg v-else class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Hang up (end call) -->
    <button
      class="w-14 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      title="Leave meeting"
      @click="$emit('leave')"
    >
      <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isMicOn: boolean
  isCameraOn: boolean
  chatOpen: boolean
  unreadCount: number
  linkCopied: boolean
}>()

defineEmits<{
  'toggle-mic': []
  'toggle-camera': []
  'toggle-chat': []
  'copy-link': []
  'leave': []
}>()
</script>
