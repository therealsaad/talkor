import { apiClient, apiClientBlob } from '@/lib/api-client'
import { kgAlphabetService } from '../../level-01/services/kg-alphabet-service'
import type { Level5Letter } from '../level5-flow'

type NarrationId = `letter-${Lowercase<Level5Letter>}` | `word-${Lowercase<Level5Letter>}` | `prompt-${Lowercase<Level5Letter>}`
type FeedbackAudioId = 'great' | 'try-again' | 'repeat'
const narrationCache = new Map<string, Promise<Blob>>()

function requestSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(15_000)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

function loadNarration(id: NarrationId, signal?: AbortSignal) {
  const existing = narrationCache.get(id)
  if (existing) return existing
  const request = apiClientBlob(`/kg-level5-preview/narration/${id}`, {
    cache: 'no-store',
    signal: requestSignal(signal),
  }).catch((error) => {
    narrationCache.delete(id)
    throw error
  })
  narrationCache.set(id, request)
  return request
}

function playBlob(blob: Blob, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()
  const url = URL.createObjectURL(blob)
  audio.pause()
  audio.src = url
  audio.currentTime = 0
  return new Promise((resolve, reject) => {
    const clean = () => {
      window.clearTimeout(clock)
      audio.onended = null
      audio.onerror = null
      signal?.removeEventListener('abort', abort)
      URL.revokeObjectURL(url)
    }
    const fail = (error: unknown) => { clean(); audio.pause(); reject(error) }
    const abort = () => fail(signal?.reason || new DOMException('Playback cancelled', 'AbortError'))
    const clock = window.setTimeout(() => fail(new Error('Miss Julie narration timed out')), 35_000)
    audio.onended = () => { clean(); resolve() }
    audio.onerror = () => fail(new Error('Miss Julie narration playback failed'))
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(() => fail(new Error('Miss Julie narration playback failed')))
  })
}

export const kgLevel5PreviewService = {
  async playIntroduction(letter: Level5Letter, audio: HTMLAudioElement, signal?: AbortSignal) {
    const suffix = letter.toLowerCase() as Lowercase<Level5Letter>
    try {
      for (const id of [`letter-${suffix}`, `word-${suffix}`, `prompt-${suffix}`] as NarrationId[]) {
        await playBlob(await loadNarration(id, signal), audio, signal)
      }
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error('Miss Julie narration playback failed', { cause: error })
    }
  },
  playFeedback(id: FeedbackAudioId, audio: HTMLAudioElement, signal?: AbortSignal) {
    return kgAlphabetService.previewPlay(id, audio, requestSignal(signal))
  },
  async submitAttempt(input: { letter: Level5Letter; audio?: Blob; durationMs: number; noSpeech?: boolean; signal?: AbortSignal }) {
    let audioBase64: string | undefined
    if (input.audio) {
      audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
        reader.onerror = () => reject(new Error('Unable to read microphone recording'))
        reader.readAsDataURL(input.audio!)
      })
    }
    input.signal?.throwIfAborted()
    return apiClient<{ outcome: 'correct' | 'incorrect' | 'unclear' }>('/kg-level5-preview/attempt', {
      method: 'POST',
      body: JSON.stringify({
        letter: input.letter,
        audioBase64,
        mimeType: input.audio?.type,
        durationMs: input.durationMs,
        noSpeech: input.noSpeech,
      }),
      signal: requestSignal(input.signal),
    })
  },
}


