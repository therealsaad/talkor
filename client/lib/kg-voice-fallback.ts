/**
 * Emergency on-device narration only when the authenticated S3 audio route fails.
 * Original S3/Priya voice remains the default. Never synthesize while recording.
 * Voice selection varies by browser; do not claim this is Miss Julie's AI voice.
 */
export function speakKGOnDevice(text: string, signal?: AbortSignal): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) ||
      !('SpeechSynthesisUtterance' in window) || !text.trim()) {
    return Promise.reject(new Error('No on-device voice is available'))
  }
  if (signal?.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'))
  return new Promise((resolve, reject) => {
    const engine = window.speechSynthesis
    const voice = new SpeechSynthesisUtterance(text)
    voice.lang = 'en-IN'
    voice.rate = 0.84
    voice.pitch = 1.14
    const voices = engine.getVoices()
    voice.voice = voices.find((item) => item.lang.toLowerCase() === 'en-in' && /female|neerja|heera|priya/i.test(item.name))
      ?? voices.find((item) => item.lang.toLowerCase() === 'en-in')
      ?? voices.find((item) => item.lang.toLowerCase().startsWith('en'))
      ?? null
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
      voice.onend = null
      voice.onerror = null
      if (err) reject(err)
      else resolve()
    }
    const abort = () => { engine.cancel(); finish(new DOMException('Cancelled', 'AbortError')) }
    const timeout = window.setTimeout(() => { engine.cancel(); finish(new Error('On-device voice timed out')) }, 22000)
    voice.onend = () => finish()
    voice.onerror = () => finish(new Error('On-device voice playback failed'))
    signal?.addEventListener('abort', abort, { once: true })
    engine.cancel()
    engine.speak(voice)
  })
}
