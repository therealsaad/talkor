import { apiClientBlob } from '@/lib/api-client'

type SpeechLine = 'intro' | 'prompt' | 'replay' | 'correct' | 'incorrect' | 'unclear' | 'silence' | 'complete' | 'microphone-error' | 'provider-error'

const speechCache = new Map<string, Promise<Blob>>()

function requestSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(15_000)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

function loadSpeech(line: SpeechLine, activityId: string, signal?: AbortSignal): Promise<Blob> {
  const key = `vowel-sounds-v2:${line}:${activityId}`
  const cached = speechCache.get(key)
  if (cached) return cached

  const request = apiClientBlob(
    `/kg-level4-preview/vowel/speech/${encodeURIComponent(line)}/${encodeURIComponent(activityId)}`,
    { cache: 'no-store', signal: requestSignal(signal) },
  ).then((blob) => {
    if (!blob.size || !blob.type.toLowerCase().startsWith('audio/')) {
      throw new Error('Miss Julie’s voice service returned an invalid audio response.')
    }
    return blob
  }).catch((error) => {
    speechCache.delete(key)
    throw error
  })

  speechCache.set(key, request)
  return request
}

/** Play one Azure teacher line through the same single audio channel as KG Level 4. */
export async function playLevel6VowelSpeech(
  line: SpeechLine,
  activityId: string,
  audio: HTMLAudioElement,
  signal?: AbortSignal,
): Promise<void> {
  signal?.throwIfAborted()
  const blob = await loadSpeech(line, activityId, signal)
  signal?.throwIfAborted()

  const url = URL.createObjectURL(blob)
  audio.pause()
  audio.src = url
  audio.currentTime = 0
  audio.muted = false
  audio.volume = 1
  // Match Level 4 playback speed. Slowing both Azure SSML and the browser
  // player made the previous Vowel Garden voice unnaturally slow.
  audio.playbackRate = 1
  audio.preservesPitch = true

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const clean = () => {
      window.clearTimeout(clock)
      audio.onended = null
      audio.onerror = null
      audio.onpause = null
      signal?.removeEventListener('abort', abort)
      URL.revokeObjectURL(url)
    }
    const finish = (error?: unknown) => {
      if (settled) return
      settled = true
      clean()
      if (error) reject(error)
      else resolve()
    }
    const abort = () => finish(signal?.reason || new DOMException('Speech playback cancelled', 'AbortError'))
    const clock = window.setTimeout(() => finish(new Error('Miss Julie’s narration timed out.')), 35_000)

    audio.onended = () => finish()
    audio.onerror = () => finish(new Error('Miss Julie’s narration could not play.'))
    audio.onpause = () => {
      if (!audio.ended && !signal?.aborted) finish(new Error('Miss Julie’s narration was interrupted.'))
    }
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(finish)
  })
}
