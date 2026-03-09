<template>
  <Transition name="call-slide">
    <div
      v-if="call"
      class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-sm"
    >
      <div class="bg-brand-900 border border-white/15 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
        <!-- Pulsing ring background -->
        <div class="relative px-6 pt-6 pb-5 flex flex-col items-center gap-4">
          <!-- Avatar with ring animation -->
          <div class="relative">
            <span class="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <span class="absolute -inset-2 rounded-full bg-emerald-500/10 animate-ping" style="animation-delay: 0.3s" />
            <AppAvatar :name="call.fromName" :photo="call.fromPhoto" size="lg" class="relative z-10 ring-2 ring-emerald-400/50" />
          </div>

          <div class="text-center">
            <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Incoming call</p>
            <p class="text-white font-semibold text-lg leading-tight mt-0.5">{{ call.fromName }}</p>
          </div>

          <!-- Accept / Decline -->
          <div class="flex items-center gap-6 mt-1">
            <!-- Decline -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 group"
              @click="decline"
            >
              <span class="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center transition-all group-hover:bg-rose-500 group-hover:scale-110">
                <svg class="w-6 h-6 text-rose-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </span>
              <span class="text-xs text-slate-400">Decline</span>
            </button>

            <!-- Accept -->
            <button
              type="button"
              class="flex flex-col items-center gap-1.5 group"
              @click="accept"
            >
              <span class="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center transition-all group-hover:bg-emerald-500 group-hover:scale-110">
                <svg class="w-6 h-6 text-emerald-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <span class="text-xs text-slate-400">Answer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { CallPayload } from '~/types/socket.types'

const { isConnected, getSocket } = useSocket()
const router = useRouter()

const call = ref<CallPayload | null>(null)
let audioCtx: AudioContext | null = null
let ringInterval: ReturnType<typeof setInterval> | null = null
let autoDeclineTimer: ReturnType<typeof setTimeout> | null = null

// --- Ring sound via Web Audio API ---
function startRing() {
  if (!import.meta.client) return
  try {
    audioCtx = new AudioContext()
    ringInterval = setInterval(() => playRingTone(), 2200)
    playRingTone()
  }
  catch { /* ignore audio errors */ }
}

function playRingTone() {
  if (!audioCtx) return
  // Two-tone phone ring
  ;[700, 840].forEach((freq, i) => {
    const osc = audioCtx!.createOscillator()
    const gain = audioCtx!.createGain()
    osc.connect(gain)
    gain.connect(audioCtx!.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    const start = audioCtx!.currentTime + i * 0.18
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.18, start + 0.04)
    gain.gain.linearRampToValueAtTime(0, start + 0.16)
    osc.start(start)
    osc.stop(start + 0.18)
  })
}

function stopRing() {
  if (ringInterval) { clearInterval(ringInterval); ringInterval = null }
  if (audioCtx) { audioCtx.close(); audioCtx = null }
}

function clearAutoDecline() {
  if (autoDeclineTimer) { clearTimeout(autoDeclineTimer); autoDeclineTimer = null }
}

// --- Handlers ---
function handleIncoming(data: CallPayload) {
  call.value = data
  startRing()
  // Auto-decline after 30s if no action
  autoDeclineTimer = setTimeout(() => decline(), 30_000)
}

function accept() {
  if (!call.value) return
  const { fromUid, meetingId } = call.value
  stopRing()
  clearAutoDecline()
  if (isConnected()) {
    getSocket().emit('call:answer', { toUid: fromUid, meetingId })
  }
  call.value = null
  router.push(`/meet/${meetingId}`)
}

function decline() {
  if (!call.value) return
  const { fromUid } = call.value
  stopRing()
  clearAutoDecline()
  if (isConnected()) {
    getSocket().emit('call:decline', { toUid: fromUid })
  }
  call.value = null
}

function handleCancelled() {
  if (!call.value) return
  stopRing()
  clearAutoDecline()
  call.value = null
}

// --- Lifecycle ---
// Always register on the singleton socket — listeners work even before connect()
onMounted(() => {
  const socket = getSocket()
  socket.on('call:incoming', handleIncoming)
  socket.on('call:cancelled', handleCancelled)
})

onUnmounted(() => {
  stopRing()
  clearAutoDecline()
  const socket = getSocket()
  socket.off('call:incoming', handleIncoming)
  socket.off('call:cancelled', handleCancelled)
})
</script>

<style scoped>
.call-slide-enter-active {
  animation: callSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.call-slide-leave-active {
  animation: callSlideOut 0.3s cubic-bezier(0.55, 0, 1, 0.45);
}

@keyframes callSlideIn {
  from { transform: translateX(-50%) translateY(-120%); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
}

@keyframes callSlideOut {
  from { transform: translateX(-50%) translateY(0);    opacity: 1; }
  to   { transform: translateX(-50%) translateY(-120%); opacity: 0; }
}
</style>
