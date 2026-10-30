import { apiClient, apiClientBlob } from '@/lib/api-client'
import { kgRequest } from './kg-request'

export type KGOutcome = 'correct' | 'incorrect' | 'unclear' | 'supported'
export type KGLetter = 'A' | 'B' | 'C' | 'D'
export type KGAudioKind = 'curriculum_static' | 'dynamic_tts'
export interface KGAlphabetState {
  version: string
  level: number
  title: string
  currentIndex: number
  totalActivities: number
  audioVersion: string
  introSeen: boolean
  completed: boolean
  pronunciationNeedsPractice?: KGLetter[]
  fallbackAvailable?: boolean
  completedAt: string | null
  xp: number
  stars: number
  homework: { id: string; audioId: string; text: string; status: 'not-assigned' | 'pending' | 'completed'; assignedAt: string | null; completedAt: string | null }
  level2Unlocked: boolean
  level2Available: boolean
  letters: Array<{ letter: KGLetter; word: string; emoji: string; color: string }>
  activity: { id: string; letter: KGLetter; mode: 'speak' | 'touch'; audioId: string } | null
  audio: Record<string, { text: string; url: string; kind: KGAudioKind }>
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
  submissionId?: string
  feedbackVoice?: 'dynamic_tts' | 'curriculum_static' | 'azure' | 'unavailable'
}
export type KGPreparedAttempt = { body: string }

type ClipCacheEntry = { promise: Promise<string>; settled: boolean; url: string | null; expiresAt: number }
const clipCache = new Map<string, ClipCacheEntry>()
const MAX_CLIPS = 20
const MISSING_CLIP_TTL_MS = 60_000

// Tab-memory-only. A fresh watch ticket is required for every KG Level 1 entry.
let playbackId: string | null = null

function audioPath(id: string, path?: string): string {
  if (path?.startsWith('/kg-alphabet/audio/v1/') && !path.includes('..')) return path
  return `/kg-alphabet/audio/v1/${encodeURIComponent(id)}`
}

function missingClip(error: unknown): boolean {
  const failure = error as { code?: string; status?: number }
  return failure?.code === 'KG_AUDIO_MISSING' || failure?.status === 404
}

function trimClipCache() {
  while (clipCache.size > MAX_CLIPS) {
    const candidate = [...clipCache.entries()].find(([, entry]) => entry.settled)
    if (!candidate) return // Keep all in-flight requests deduplicated.
    const [key, entry] = candidate
    clipCache.delete(key)
    if (entry.url) URL.revokeObjectURL(entry.url)
  }
}

async function loadAudioUrl(key: string, signal?: AbortSignal, kind: KGAudioKind = 'curriculum_static'): Promise<string> {
  const existing = clipCache.get(key)
  if (existing && (!existing.expiresAt || existing.expiresAt > Date.now())) {
    clipCache.delete(key)
    clipCache.set(key, existing)
    return existing.promise
  }
  if (existing) clipCache.delete(key)

  const entry: ClipCacheEntry = { promise: Promise.resolve(''), settled: false, url: null, expiresAt: 0 }
  entry.promise = kgRequest(
    (requestSignal) => apiClientBlob(key, { cache: 'no-store', signal: requestSignal }),
    signal,
    { retries: 1, timeoutMs: kind === 'dynamic_tts' ? 35000 : 30000, delayMs: 300 },
  ).then((blob) => {
    if (clipCache.get(key) !== entry) throw new DOMException('Audio request is no longer active', 'AbortError')
    entry.url = URL.createObjectURL(blob)
    entry.settled = true
    trimClipCache()
    return entry.url
  }, (error) => {
    entry.settled = true
    if (clipCache.get(key) === entry) {
      if (missingClip(error)) entry.expiresAt = Date.now() + MISSING_CLIP_TTL_MS
      else clipCache.delete(key)
    }
    throw error
  })
  clipCache.set(key, entry)
  return entry.promise
}

async function audioUrl(id: string, path?: string, signal?: AbortSignal, kind?: KGAudioKind): Promise<string> {
  return loadAudioUrl(audioPath(id, path), signal, kind)
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
  state: () => apiClient<KGAlphabetState>('/kg-alphabet/state', { cache: 'no-store' }),

  hasIntroTicket: () => Boolean(playbackId),

  async beginIntro() {
    playbackId = null
    const session = await apiClient<{ playbackId: string }>('/kg-alphabet/intro/start', {
      method: 'POST', cache: 'no-store',
    })
    playbackId = session.playbackId
    return session
  },

  introSeen: () => {
    if (!playbackId) throw new Error('Start the full story first')
    return apiClient('/kg-alphabet/intro-seen', {
      method: 'POST', cache: 'no-store', body: JSON.stringify({ videoEnded: true, playbackId }),
    })
  },
  completeHomework: () => apiClient<KGAlphabetState>('/kg-alphabet/homework/complete', {
    method: 'POST', body: JSON.stringify({ homeworkId: 'kg-abcd-picture-homework-v1' }),
  }),
  prefetch: (id: string, path?: string, kind?: KGAudioKind) => { void audioUrl(id, path, undefined, kind).catch(() => undefined) },
  ensure: (id: string, path?: string, kind?: KGAudioKind) => audioUrl(id, path, undefined, kind).then(() => undefined),
  audioUrl,
  /** Staff-only preview uses the same manifest-selected S3/Priya delivery as the student route. */
  async previewPlay(id: string, audio: HTMLAudioElement, signal?: AbortSignal, kind?: KGAudioKind): Promise<void> {
    const key = `/kg-alphabet/preview/audio/v1/${encodeURIComponent(id)}`
    const url = await loadAudioUrl(key, signal, kind)
    await playAudioUrl(url, audio, signal)
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
  async play(id: string, audio: HTMLAudioElement, path?: string, signal?: AbortSignal, kind?: KGAudioKind): Promise<void> {
    const url = await audioUrl(id, path, signal, kind)
    signal?.throwIfAborted()
    await playAudioUrl(url, audio, signal)
  },
  async prepare(input: { activityId: string; replay: boolean; selected?: string; audio?: Blob; durationMs?: number; timeSpentMs?: number; noSpeech?: boolean; assistedPicture?: boolean }): Promise<KGPreparedAttempt> {
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
        noSpeech: input.noSpeech, assistedPicture: input.assistedPicture,
        submissionId: crypto.randomUUID().replace(/-/g, ''),
      }) }
  },
  async playAttemptFeedback(submissionId: string, audio: HTMLAudioElement, signal?: AbortSignal) {
    const url = await loadAudioUrl(`/kg-alphabet/attempt/${encodeURIComponent(submissionId)}/feedback-audio`, signal, 'dynamic_tts')
    await playAudioUrl(url, audio, signal)
  },
  acknowledgeFeedback(submissionId: string, signal?: AbortSignal) {
    return apiClient<{ state: KGAlphabetState }>(`/kg-alphabet/attempt/${encodeURIComponent(submissionId)}/feedback-played`, { method: 'POST', signal })
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
    for (const entry of clipCache.values()) if (entry.url) URL.revokeObjectURL(entry.url)
    clipCache.clear()
  },
}
