export const useClipboard = () => {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string): Promise<boolean> {
    if (!navigator?.clipboard) return false
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { copied.value = false }, 2000)
      return true
    }
    catch {
      return false
    }
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return { copied, copy }
}
