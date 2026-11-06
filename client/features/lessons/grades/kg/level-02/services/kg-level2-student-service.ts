import { apiClient, apiClientBlob, getStoredToken } from '@/lib/api-client'
import type { Level2Letter } from '../level2-flow'

export interface KGLevel2State {
  version: string
  level: 2
  title: string
  currentIndex: number
  totalActivities: 6
  completed: boolean
  completedAt: string | null
  activity: { letter: Level2Letter; mode: 'speak' } | null
  pendingFeedback: {
    submissionId: string
    letter: Level2Letter
    outcome: 'correct' | 'incorrect' | 'unclear'
    feedbackText: string
  } | null
}
export interface KGLevel2AttemptResult {
  outcome: 'correct' | 'incorrect' | 'unclear'
  submissionId: string
  feedbackText: string
  state: KGLevel2State
}

let introTicket: string | null = null
let introOwner: string | null = null
let pendingIntro: Promise<{ playbackId: string }> | null = null
let pendingOwner: string | null = null
const heardReceipts = new Map<string, string>()

function ticketHeader(): Record<string, string> {
  const token = getStoredToken()
  if (!token || !introTicket || introOwner !== token) throw Error('Your Level 2 story belongs to another session. Please watch it again.')
  return { 'X-KG-Level2-Intro': introTicket }
}
function clearIntro() {
  introTicket = null
  introOwner = null
  heardReceipts.clear()
}
function playBlob(blob: Blob, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted()
  const url = URL.createObjectURL(blob)
  audio.pause()
  audio.src = url
  audio.currentTime = 0
  return new Promise((resolve, reject) => {
    const clean = () => {
      window.clearTimeout(timer)
      audio.onended = null
      audio.onerror = null
      signal?.removeEventListener('abort', abort)
      URL.revokeObjectURL(url)
    }
    const fail = (cause: unknown) => { clean(); audio.pause(); reject(cause) }
    const abort = () => fail(signal?.reason || new DOMException('Session ended', 'AbortError'))
    const timer = window.setTimeout(() => fail(Error('Miss Julie audio timed out')), 35_000)
    audio.onended = () => { clean(); resolve() }
    audio.onerror = () => fail(Error('Miss Julie audio could not play'))
    signal?.addEventListener('abort', abort, { once: true })
    void audio.play().catch(fail)
  })
}
export const kgLevel2StudentService = {
  state: () => apiClient<KGLevel2State>('/kg-level2/state', { cache: 'no-store' }),

  async beginIntro(): Promise<void> {
    const token = getStoredToken()
    if (!token) throw Error('Sign in to start your Level 2 story')
    if (pendingIntro && pendingOwner === token) { await pendingIntro; return }
    clearIntro()
    let request: Promise<{ playbackId: string }>
    pendingOwner = token
    request = apiClient<{ playbackId: string }>('/kg-level2/intro/start', { method: 'POST' })
      .then((result) => {
        if (pendingIntro === request && pendingOwner === token && getStoredToken() === token) {
          introTicket = result.playbackId
          introOwner = token
        }
        return result
      }).finally(() => {
        if (pendingIntro === request) { pendingIntro = null; pendingOwner = null }
      })
    pendingIntro = request
    await request
    ticketHeader()
  },

  async completeIntro(): Promise<void> {
    const token = ticketHeader()['X-KG-Level2-Intro']
    await apiClient('/kg-level2/intro/complete', {
      method: 'POST', body: JSON.stringify({ playbackId: token, videoEnded: true }),
    })
  },

  async playNarration(letter: Level2Letter, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    for (const id of ['letter-', 'prompt-']) {
      const blob = await apiClientBlob('/kg-level2/narration/' + id + letter.toLowerCase(), {
        headers: ticketHeader(), signal, cache: 'no-store',
      })
      await playBlob(blob, audio, signal)
    }
  },

  async submit(input: { letter: Level2Letter; submissionId: string; audio?: Blob; durationMs: number; noSpeech: boolean; signal?: AbortSignal }) {
    let audioBase64: string | undefined
    if (input.audio && !input.noSpeech) {
      audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
        reader.onerror = () => reject(Error('Microphone recording could not be read'))
        reader.readAsDataURL(input.audio!)
      })
    }
    input.signal?.throwIfAborted()
    return apiClient<KGLevel2AttemptResult>('/kg-level2/attempt', {
      method: 'POST', headers: ticketHeader(), signal: input.signal,
      body: JSON.stringify({
        letter: input.letter, submissionId: input.submissionId,
        durationMs: input.durationMs, noSpeech: input.noSpeech,
        audioBase64, mimeType: input.audio?.type,
      }),
    })
  },

  async playFeedback(submissionId: string, audio: HTMLAudioElement, signal?: AbortSignal): Promise<void> {
    heardReceipts.delete(submissionId)
    let receipt = ''
    const blob = await apiClientBlob(
      '/kg-level2/attempt/' + encodeURIComponent(submissionId) + '/feedback-audio',
      { headers: ticketHeader(), signal, cache: 'no-store' },
      (headers) => { receipt = headers.get('X-KG-Feedback-Receipt') || '' },
    )
    if (!/^v1\.[0-9]+\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(receipt)) throw Error('Audio playback receipt missing')
    await playBlob(blob, audio, signal)
    // No ACK can be sent before HTMLAudioElement.onended.
    ticketHeader()
    heardReceipts.set(submissionId, receipt)
  },

  async acknowledge(submissionId: string, signal?: AbortSignal): Promise<KGLevel2State> {
    const receipt = heardReceipts.get(submissionId)
    if (!receipt) throw Error('Listen to Miss Julie before continuing')
    const fresh = await apiClient<KGLevel2State>(
      '/kg-level2/attempt/' + encodeURIComponent(submissionId) + '/feedback-played',
      { method: 'POST', headers: ticketHeader(), signal, body: JSON.stringify({ feedbackReceipt: receipt }) },
    )
    heardReceipts.delete(submissionId)
    return fresh
  },

  resetForNewVisit: () => clearIntro(),
}
