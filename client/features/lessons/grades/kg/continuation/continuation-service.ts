import { apiClient, apiClientBlob, getStoredToken } from '@/lib/api-client'
import { lessonTurnTelemetry, setTelemetrySession } from '@/lib/lesson-turn-telemetry'
export type KGContinuationLevel = 3 | 4 | 5

// Telemetry compares logins through a fingerprint so a new student never inherits the last student's timings.
setTelemetrySession(() => getStoredToken())
export interface KGContinuationState {
  level: KGContinuationLevel
  title: string
  currentIndex: number
  totalActivities: number
  completed: boolean
  completedAt: string | null
  activity: { letter: string; mode: 'speak' } | null
  pendingFeedback: {
    submissionId: string; letter: string; outcome: 'correct' | 'incorrect' | 'unclear'; feedbackText: string
  } | null
}
export interface KGContinuationOverview {
  nextLevel: KGContinuationLevel | null
  levels: Array<{ level: KGContinuationLevel; title: string; status: 'CURRENT' | 'COMPLETED' | 'LOCKED'; currentIndex: number; totalActivities: number }>
  unavailableLevels: number[]
}
export interface KGContinuationAttemptResponse {
  outcome: 'correct' | 'incorrect' | 'unclear'
  submissionId: string
  feedbackText: string
  state: KGContinuationState
}
const url = (level: KGContinuationLevel) => '/kg-continuation/' + level
let ticket: string | null = null
let owner: string | null = null
let ticketLevel: KGContinuationLevel | null = null
let pending: Promise<{ playbackId: string }> | null = null
let pendingOwner: string | null = null
let pendingLevel: KGContinuationLevel | null = null
const receipts = new Map<string, string>()
function headers(level: KGContinuationLevel): Record<string, string> {
  const token = getStoredToken()
  if (!token || token !== owner || level !== ticketLevel || !ticket) {
    throw Error('The introduction must be watched again for your own login')
  }
  return { 'X-KG-Continuation-Intro': ticket }
}
function key(level: KGContinuationLevel, id: string) { return level + ':' + id }
function resetTicket() { ticket = null; owner = null; ticketLevel = null; receipts.clear() }
function playBlob(blob: Blob, audio: HTMLAudioElement, signal?: AbortSignal, onPlaying?: () => void): Promise<void> {
  signal?.throwIfAborted()
  const objectUrl = URL.createObjectURL(blob)
  audio.pause()
  audio.src = objectUrl
  audio.currentTime = 0
  return new Promise((resolve, reject) => {
    const clean = () => {
      window.clearTimeout(timeout)
      audio.onended = null
      audio.onerror = null
      audio.onplaying = null
      signal?.removeEventListener('abort', abort)
      URL.revokeObjectURL(objectUrl)
    }
    const fail = (cause: unknown) => { clean(); audio.pause(); reject(cause) }
    const abort = () => fail(signal?.reason || new DOMException('Session ended', 'AbortError'))
    const timeout = window.setTimeout(() => fail(Error('Audio playback timed out')), 35000)
    audio.onended = () => { clean(); resolve() }
    audio.onerror = () => fail(Error('Miss Julie audio could not play'))
    if (onPlaying) audio.onplaying = () => { audio.onplaying = null; onPlaying() }
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(fail)
  })
}
export const kgContinuationStudentService = {
  overview: () => apiClient<KGContinuationOverview>('/kg-continuation/overview', { cache: 'no-store' }),
  state: (level: KGContinuationLevel) => apiClient<KGContinuationState>(url(level) + '/state', { cache: 'no-store' }),
  async beginIntro(level: KGContinuationLevel) {
    const token = getStoredToken()
    if (!token) throw Error('Sign in to watch Miss Julie')
    if (pending && pendingOwner === token && pendingLevel === level) { await pending; return }
    resetTicket()
    pendingOwner = token
    pendingLevel = level
    let request: Promise<{ playbackId: string }>
    request = apiClient<{ playbackId: string }>(url(level) + '/intro/start', { method: 'POST' })
      .then((result) => {
        if (pending === request && pendingOwner === token && pendingLevel === level && getStoredToken() === token) {
          ticket = result.playbackId
          owner = token
          ticketLevel = level
        }
        return result
      }).finally(() => {
        if (pending === request) { pending = null; pendingOwner = null; pendingLevel = null }
      })
    pending = request
    await request
    headers(level)
  },
  async completeIntro(level: KGContinuationLevel) {
    await apiClient(url(level) + '/intro/complete', {
      method: 'POST', body: JSON.stringify({ playbackId: headers(level)['X-KG-Continuation-Intro'], videoEnded: true }),
    })
  },
  async playNarration(level: KGContinuationLevel, letter: string, audio: HTMLAudioElement, signal?: AbortSignal) {
    for (const part of ['letter-', 'word-', 'prompt-']) {
      const blob = await apiClientBlob(url(level) + '/narration/' + part + letter.toLowerCase(), {
        headers: headers(level), cache: 'no-store', signal,
      })
      await playBlob(blob, audio, signal)
    }
  },
  async submit(level: KGContinuationLevel, data: {
    letter: string; submissionId: string; audio?: Blob; durationMs: number; noSpeech: boolean; signal?: AbortSignal
  }) {
    let audioBase64: string | undefined
    if (data.audio && !data.noSpeech) {
      audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
        reader.onerror = () => reject(Error('Could not read the microphone recording'))
        reader.readAsDataURL(data.audio!)
      })
    }
    data.signal?.throwIfAborted()
    lessonTurnTelemetry.bind(data.submissionId)
    lessonTurnTelemetry.markFor(data.submissionId, 'requestStart')
    return apiClient<KGContinuationAttemptResponse>(url(level) + '/attempt', {
      method: 'POST', signal: data.signal, headers: headers(level),
      body: JSON.stringify({
        letter: data.letter, submissionId: data.submissionId, audioBase64,
        mimeType: data.audio?.type, durationMs: data.durationMs, noSpeech: data.noSpeech,
      }),
    }).then((result) => { lessonTurnTelemetry.markFor(data.submissionId, 'apiResponse'); return result })
  },
  async playFeedback(level: KGContinuationLevel, id: string, audio: HTMLAudioElement, signal?: AbortSignal) {
    receipts.delete(key(level, id))
    let receipt = ''
    lessonTurnTelemetry.markFor(id, 'audioRequestStart')
    const blob = await apiClientBlob(url(level) + '/attempt/' + encodeURIComponent(id) + '/feedback-audio', {
      headers: headers(level), cache: 'no-store', signal,
    }, (responseHeaders) => { receipt = responseHeaders.get('X-KG-Feedback-Receipt') || '' })
    if (!/^v1\.[0-9]+\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(receipt)) throw Error('Miss Julie audio receipt missing')
    lessonTurnTelemetry.markFor(id, 'audioDownloaded')
    await playBlob(blob, audio, signal, () => lessonTurnTelemetry.markFor(id, 'audioPlaying'))
    lessonTurnTelemetry.markFor(id, 'audioEnded')
    headers(level)
    // Never allow acknowledgement before the HTMLAudioElement ends playback.
    receipts.set(key(level, id), receipt)
  },
  async acknowledge(level: KGContinuationLevel, id: string, signal?: AbortSignal) {
    const receipt = receipts.get(key(level, id))
    if (!receipt) throw Error('Listen to Miss Julie before continuing')
    const updated = await apiClient<KGContinuationState>(url(level) + '/attempt/' + encodeURIComponent(id) + '/feedback-played', {
      method: 'POST', headers: headers(level), signal, body: JSON.stringify({ feedbackReceipt: receipt }),
    })
    receipts.delete(key(level, id))
    lessonTurnTelemetry.markFor(id, 'ackDone')
    return updated
  },
  resetForNewVisit: resetTicket,
}
