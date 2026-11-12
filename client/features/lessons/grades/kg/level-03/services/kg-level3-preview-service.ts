import { apiClient, apiClientBlob } from '@/lib/api-client'
import { kgAlphabetService } from '../../level-01/services/kg-alphabet-service'
import type { Letter } from '../level3-flow'

export interface Level3AttemptResult {
  outcome: 'correct' | 'incorrect' | 'unclear'
}
type FeedbackAudioId = 'great' | 'try-again' | 'repeat'
const narrationBlobs = new Map<string, Promise<Blob>>()

function requestSignal(signal?: AbortSignal): AbortSignal {
  const timeout = AbortSignal.timeout(15_000)
  return signal ? AbortSignal.any([signal, timeout]) : timeout
}

function loadNarration(id: string, signal?: AbortSignal): Promise<Blob> {
  const cached = narrationBlobs.get(id)
  if (cached) return cached

  const request = apiClientBlob(`/kg-level3-preview/narration/${id}`, {
    cache: 'no-store',
    signal: requestSignal(signal),
  })
    .catch((error) => {
      narrationBlobs.delete(id)
      throw error
    })
  narrationBlobs.set(id, request)
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
    const fail = (error: unknown) => {
      clean()
      audio.pause()
      reject(error)
    }
    const abort = () => fail(signal?.reason || new DOMException('Playback cancelled', 'AbortError'))
    const clock = window.setTimeout(() => fail(new Error('Miss Julie narration timed out')), 35_000)
    audio.onended = () => { clean(); resolve() }
    audio.onerror = () => fail(new Error('Miss Julie narration playback failed'))
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(() => fail(new Error('Miss Julie narration playback failed')))
  })
}

export const kgLevel3PreviewService = {
  async playIntroduction(letter: Letter, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    try {
      signal?.throwIfAborted()
      const suffix = letter.toLowerCase()
      const [introduction, prompt] = await Promise.all([
        loadNarration(`letter-${suffix}`, signal),
        loadNarration(`prompt-${suffix}`, signal),
      ])
      await playBlob(introduction, audio, signal)
      await playBlob(prompt, audio, signal)
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error('Miss Julie narration playback failed', { cause: error })
    }
  },

  async playFeedback(id: FeedbackAudioId, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    try {
      await kgAlphabetService.previewPlay(id, audio, requestSignal(signal))
    } catch (error) {
      if (signal?.aborted) throw error
      throw new Error('Miss Julie feedback playback failed', { cause: error })
    }
  },

  async submitAttempt(input: {
    letter: Letter
    audio?: Blob
    durationMs: number
    noSpeech?: boolean
    signal?: AbortSignal
  }): Promise<Level3AttemptResult> {
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

    return apiClient<Level3AttemptResult>('/kg-level3-preview/attempt', {
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
