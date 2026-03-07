<template>
  <div :class="['grid gap-3 h-full p-3', gridClass]">
    <!-- Local stream (always first) -->
    <VideoTile
      :stream="localStream"
      :display-name="localUser?.displayName ?? 'You'"
      :photo-u-r-l="localUser?.photoURL"
      :muted="true"
      :is-local="true"
      :mic-muted="!isMicOn"
    />

    <!-- Remote peers -->
    <VideoTile
      v-for="peer in remotePeers"
      :key="peer.socketId"
      :stream="peer.stream"
      :display-name="peer.displayName"
      :photo-u-r-l="peer.photoURL"
      :muted="false"
    />
  </div>
</template>

<script setup lang="ts">
import type { RemotePeer } from '~/composables/useWebRTC'
import type { AppUser } from '~/types/user.types'

const props = defineProps<{
  localStream: MediaStream | null
  localUser: AppUser | null
  remotePeers: RemotePeer[]
  isMicOn: boolean
}>()

const totalCount = computed(() => 1 + props.remotePeers.length)

const gridClass = computed(() => {
  if (totalCount.value === 1) return 'grid-cols-1'
  if (totalCount.value === 2) return 'grid-cols-1 md:grid-cols-2'
  if (totalCount.value === 3) return 'grid-cols-2'
  return 'grid-cols-2' // 4 users: 2×2
})
</script>
