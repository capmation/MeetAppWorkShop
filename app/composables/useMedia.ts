export const useMedia = () => {
  const localStream = ref<MediaStream | null>(null)
  const isCameraOn = ref(true)
  const isMicOn = ref(true)
  const permissionError = ref<string | null>(null)

  async function startMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      localStream.value = stream
      isCameraOn.value = video
      isMicOn.value = audio
      return stream
    }
    catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        permissionError.value = 'Camera/microphone access denied. Please allow permissions and try again.'
      }
      else {
        permissionError.value = 'Could not access camera or microphone.'
      }
      throw err
    }
  }

  function toggleCamera(): void {
    if (!localStream.value) return
    localStream.value.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled
    })
    isCameraOn.value = !isCameraOn.value
  }

  function toggleMic(): void {
    if (!localStream.value) return
    localStream.value.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled
    })
    isMicOn.value = !isMicOn.value
  }

  function stopMedia(): void {
    localStream.value?.getTracks().forEach(track => track.stop())
    localStream.value = null
  }

  return {
    localStream,
    isCameraOn,
    isMicOn,
    permissionError,
    startMedia,
    toggleCamera,
    toggleMic,
    stopMedia,
  }
}
