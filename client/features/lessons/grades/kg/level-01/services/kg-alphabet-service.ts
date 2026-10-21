import { apiClient, apiClientBlob } from '@/lib/api-client'
import { kgRequest } from './kg-request'

export type KGOutcome = 'correct' | 'incorrect' | 'unclear'
export type KGLetter = 'A' | 'B' | 'C' | 'D'
export interface KGAlphabetState {
  version: string
  level: number
  title: string
  currentIndex: number
  totalActivities: number
  audioVersion: string
  introSeen: boolean
  completed: boolean
  completedAt: string | null
  level2Unlocked: boolean
  level2Available: boolean
  letters: Array<{ letter: KGLetter; word: string; emoji: string; color: string }>
  activity: { id: string; letter: KGLetter; mode: 'speak' | 'touch'; audioId: string } | null
  audio: Record<string, { text: string; url: string }>
}
export interface KGAttemptResponse {
  outcome: KGOutcome
  replay: boolean
  duplicate?: boolean
  state: KGAlphabetState
  feedbackAudioId?: string
  teachingHint?: string | null
  transcript?: string
  feedbackText?: string
  feedbackAudioBase64?: string | null
  feedbackVoice?: 'azure' | 'unavailable'
}
export type KGPreparedAttempt = { body: string }

const clipCache = new Map<string, Promise<string>>()
const MAX_CLIPS = 20
// Tab-memory-only. A fresh watch ticket is required for each KG Level 1 entry.
let playbackId: string | null = null

function audioPath(id: string, path?: string): string {
  if (path?.startsWith('/kg-alphabet/audio/v1/') && !path.includes('..')) return path
  return `/kg-alphabet/audio/v1/${encodeURIComponent(id)}`
}

async function audioUrl(id: string, path?: string): Promise<string> {
  const key = audioPath(id, path)
  const existing = clipCache.get(key)
  if (existing) return existing
  const promise = kgRequest((signal) => apiClientBlob(key, { cache: 'no-store', signal }), undefined, { retries: 0, timeoutMs: 45000 })
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => { clipCache.delete(key); throw error })
  clipCache.set(key, promise)
  if (clipCache.size > MAX_CLIPS) {
    const oldest = clipCache.keys().next().value
    if (oldest) {
      const previous = clipCache.get(oldest)
      clipCache.delete(oldest)
      void previous?.then((url) => URL.revokeObjectURL(url)).catch(() => undefined)
    }
  }
  return promise
}

async function playAudioUrl(url: string, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()
  audio.pause()
  audio.src = url
  audio.currentTime = 0
  await new Promise<void>((resolve, reject) => {
    const clean = () => { clearTimeout(clock); audio.onended = null; audio.onerror = null; signal?.removeEventListener('abort', abort) }
    const fail = (error: unknown) => { clean(); audio.pause(); reject(error) }
    const abort = () => fail(signal?.reason || new DOMException('Playback cancelled', 'AbortError'))
    const clock = window.setTimeout(() => fail(new Error('Miss Julie audio timed out')), 35000)
    audio.onended = () => { clean(); resolve() }
    audio.onerror = () => fail(new Error('Miss Julie audio could not play'))
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(fail)
  })
}

export const kgAlphabetService = {
  state: () => apiClient<KGAlphabetState>('/kg-alphabet/state'),
  hasIntroTicket: () => Boolean(playbackId),
  async beginIntro() {
    playbackId = null
    const session = await apiClient<{ playbackId: string }>('/kg-alphabet/intro/start', { method: 'POST' })
    playbackId = session.playbackId
    return session
  },
  introSeen: () => {
    if (!playbackId) throw new Error('Start the full story first')
    return apiClient('/kg-alphabet/intro-seen', { method: 'POST', body: JSON.stringify({ videoEnded: true, playbackId }) })
  },
  prefetch: (id: string, path?: string) => { void audioUrl(id, path).catch(() => undefined) },
  ensure: (id: string, path?: string) => audioUrl(id, path).then(() => undefined),
  audioUrl,
  /** Staff-only real audio preview, backed by uncached Azure TTS. */
  async previewPlay(id: string, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    const key = `/kg-alphabet/preview/audio/v1/${encodeURIComponent(id)}`
    const blob = await apiClientBlob(key, { signal, cache: 'no-store' })
    const url = URL.createObjectURL(blob)
    try { await playAudioUrl(url, audio, signal) }
    finally { URL.revokeObjectURL(url) }
  },
  async playFeedback(base64: string, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    if (!base64 || base64.length > 1_000_000) throw new Error('Invalid feedback audio')
    const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
    try { await playAudioUrl(url, audio, signal) }
    finally { URL.revokeObjectURL(url) }
  },
  previewSubmitPrepared: (prepared: KGPreparedAttempt, signal?: AbortSignal) =>
    kgRequest((requestSignal) => apiClient<Omit<KGAttemptResponse, 'state'>>('/kg-alphabet/preview/attempt', { method: 'POST', body: prepared.body, signal: requestSignal }), signal, { retries: 0, timeoutMs: 65000 }),
  async play(id: string, audio: HTMLAudioElement, path?: string, signal?: AbortSignal): Promise<void> {
    const url = await audioUrl(id, path)
    signal?.throwIfAborted()
    await playAudioUrl(url, audio, signal)
  },
  async prepare(input: { activityId: string; replay: boolean; selected?: string; audio?: Blob; durationMs?: number; timeSpentMs?: number; noSpeech?: boolean }): Promise<KGPreparedAttempt> {
    let audioBase64: string | undefined
    if (input.audio) {
      audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
        reader.onerror = () => reject(new Error('Unable to read recording'))
        reader.readAsDataURL(input.audio!)
      })
    }
    return { body: JSON.stringify({
        activityId: input.activityId, replay: input.replay, selected: input.selected,
        audioBase64, mimeType: input.audio?.type, durationMs: input.durationMs, timeSpentMs: input.timeSpentMs,
        noSpeech: input.noSpeech,
        submissionId: crypto.randomUUID().replace(/-/g, ''),
      }) }
  },
  submitPrepared(prepared: KGPreparedAttempt, signal?: AbortSignal): Promise<KGAttemptResponse> {
    return kgRequest((requestSignal) => apiClient<KGAttemptResponse>('/kg-alphabet/attempt', {
      method: 'POST', body: prepared.body, signal: requestSignal,
      headers: playbackId ? { 'X-KG-Intro-Playback': playbackId } : {},
    }), signal, { retries: 1, timeoutMs: 65000 })
  },
  async submit(input: { activityId: string; replay: boolean; selected?: string; audio?: Blob; durationMs?: number; timeSpentMs?: number }): Promise<KGAttemptResponse> {
    return this.submitPrepared(await this.prepare(input))
  },
  clearAudioCache() {
    for (const promise of clipCache.values()) void promise.then((url) => URL.revokeObjectURL(url)).catch(() => undefined)
    clipCache.clear()
  },
}
