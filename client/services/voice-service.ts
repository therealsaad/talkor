import { createSilentUnlockWav } from './silent-audio-unlock'
import {
  apiClient,
  getApiUrl,
  getStoredToken,
} from '@/lib/api-client'

function markLabSpeechActivity() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('talkora:student-activity'))
}

/* =========================================================
   PLAYBACK
   ========================================================= */

export type VoicePlaybackState =
  | 'idle'
  | 'loading'
  | 'speaking'
  | 'error'

export type VoicePlaybackResult =
  | 'spoken'
  | 'autoplay-blocked'
  | 'unavailable'

export type VoicePriority =
  | 'PAGE_GUIDANCE'
  | 'LESSON'
  | 'CONVERSATION'
  | 'FEEDBACK'

type PlaybackListener = (
  state: VoicePlaybackState,
  message?: string,
) => void

function detectVoiceLanguage(text: string): 'en-IN' | 'hi-IN' {
  return /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN'
}

function voicePriorityRank(priority: VoicePriority): number {
  switch (priority) {
    case 'CONVERSATION': return 4
    case 'FEEDBACK': return 3
    case 'LESSON': return 2
    case 'PAGE_GUIDANCE': return 1
    default: return 0
  }
}

/* =========================================================
   EVALUATION
   ========================================================= */

export interface VoiceEvaluationResult {
  score: number
  errors: string[]
  feedback: string
  available: boolean

  correctWords?: string[]
  wrongWords?: string[]
  missingWords?: string[]
  extraWords?: string[]

  wordOrderMatched?: boolean
  sentenceSimilarity?: number

  /**
   * Current Talkora speech evaluation is not
   * acoustic phoneme-level pronunciation scoring.
   */
  isAcousticPronunciationScore?: false
}

/* =========================================================
   CONVERSATION STATE
   ========================================================= */

export type VoiceConversationStatus =
  | 'ACTIVE'
  | 'COMPLETED'

export interface VoiceConversationState {
  id: string

  status: VoiceConversationStatus

  turnCount: number

  achievedConcepts: string[]

  requiredConcepts: string[]

  complete: boolean

  masteryStatus?: 'IN_PROGRESS' | 'MASTERED' | 'COMPLETED_WITH_SUPPORT' | 'NEEDS_PRACTICE'
  skillEvidence?: Array<{ skill: string; support: 'INDEPENDENT' | 'SUPPORTED'; utterance: string; turn: number }>
  retryState?: { waiting: boolean; targetSkill: string; attempt: number; hintLevel: number; originalUtterance: string; modelSentence?: string }
}

/* =========================================================
   AI RESPONSE
   ========================================================= */

export interface VoiceAIResponse {
  message: string

  emotion:
    | 'greeting' | 'welcome' | 'curious' | 'listening' | 'thinking'
    | 'delighted' | 'encouraging' | 'gentle_correction' | 'modeling'
    | 'proud' | 'surprised' | 'retry' | 'gentle_retry' | 'hinting'
    | 'celebrating' | 'concerned'

  responseQuality?: 'STRONG' | 'ADEQUATE' | 'PARTIAL' | 'UNCLEAR'

  followUpQuestion?: string | null

  corrections?: string[]
  correction?: { needed: boolean; original: string; corrected: string; explanation: string }

  hint?: string | null

  recommendation?: string | null
  teachingAction?: string | null
  modelSentence?: string | null
  activityComplete?: boolean
  shouldRetry?: boolean
  hintLevel?: number
  detectedSkills?: string[]
  remainingSkills?: string[]

  /**
   * Backend MissJulieService already returns
   * this for multi-turn curriculum conversations.
   */
  conversation?: VoiceConversationState
}

/* =========================================================
   VOICE SESSION
   ========================================================= */

export interface VoiceSessionData {
  _id: string

  evaluation?: VoiceEvaluationResult

  xpAwarded?: number

  conversationMode?:
    | 'OPEN'
    | 'CONTROLLED'

  aiResponse?: VoiceAIResponse
}

/* =========================================================
   TRANSCRIPTION RESPONSE
   ========================================================= */

interface TranscriptionResponse {
  transcript: string | null
  languageCode?: 'en-IN' | 'hi-IN' | 'mr-IN'
}

export type VoiceTranscription = { transcript: string; languageCode?: 'en-IN' | 'hi-IN' | 'mr-IN' }

/* =========================================================
   SYNTHESIS RESULT
   ========================================================= */

export interface VoiceSynthesisResult {
  available: boolean
  provider?: string
}

/* =========================================================
   SERVICE
   ========================================================= */

export const voiceService = {
  activeAudio:
    null as HTMLAudioElement | null,

  playbackRequest: 0,

  activeAbort:
    null as AbortController | null,

  lastText: '',

  lastTurnId: '',

  lastPriority: 'LESSON' as VoicePriority,

  lastActivityId: undefined as string | undefined,

  lastLanguage: undefined as 'en-IN' | 'hi-IN' | 'mr-IN' | undefined,

  activePriority: 'PAGE_GUIDANCE' as VoicePriority,

  playedTurns: new Set<string>(),

  audioCache: new Map<string, Blob>(),

  turnPlayback: new Map<string, Promise<VoicePlaybackResult>>(),

  playbackUnlocked: false,

  /* =======================================================
     AUDIO UNLOCK
     ======================================================= */

  async unlockPlayback(): Promise<boolean> {
    if (
      typeof window === 'undefined'
    ) {
      return false
    }

    if (!this.activeAudio) {
      this.activeAudio =
        new Audio()
    }

    const player =
      this.activeAudio

    // A muted, header-only WAV can play without granting unmuted autoplay.
    // Request a real but silent clip inside the user gesture instead.
    const unlockUrl = URL.createObjectURL(createSilentUnlockWav())
    player.muted = false
    player.src = unlockUrl

    try {
      await player.play()

      player.pause()

      player.currentTime = 0

      player.muted = false

      this.playbackUnlocked =
        true

      if (
        process.env.NODE_ENV !==
        'production'
      ) {
        console.info(
          '[TALKORA AUDIO] PLAYBACK_UNLOCKED',
        )
      }

      return true
    } catch {
      player.muted = false

      this.playbackUnlocked =
        false

      return false
    } finally {
      player.pause()
      if (player.src === unlockUrl) player.removeAttribute('src')
      URL.revokeObjectURL(unlockUrl)
    }
  },

  /* =======================================================
     SESSION
     ======================================================= */

  async startSession(params: {
    lessonId?: string
    activityId?: string
    expectedPhrase?: string
  }): Promise<VoiceSessionData> {
    return apiClient<VoiceSessionData>(
      '/voice/sessions',
      {
        method: 'POST',

        body:
          JSON.stringify(
            params,
          ),
      },
    )
  },

  /* =======================================================
     TRANSCRIPT SUBMISSION
     ======================================================= */
async submitTranscript(
  sessionId: string,
  transcript: string,
  inputMode: 'MIC' | 'TEXT' | 'OPTION',
  detectedLanguage?: VoiceTranscription['languageCode'],
): Promise<VoiceSessionData> {
  return apiClient<VoiceSessionData>(
    `/voice/sessions/${sessionId}/transcript`,
    {
      method: 'POST',

      body:
        JSON.stringify({
          transcript,
          inputMode,
          ...(detectedLanguage ? { detectedLanguage } : {}),
        }),
    },
  )
},

  /* =======================================================
     CANCEL SESSION
     ======================================================= */

  async cancelSession(
    sessionId: string,
  ): Promise<VoiceSessionData> {
    return apiClient<VoiceSessionData>(
      `/voice/sessions/${sessionId}/cancel`,
      {
        method: 'POST',
      },
    )
  },

  /* =======================================================
     SPEECH-TO-TEXT TRANSCRIPTION
     ======================================================= */

  async transcribeAudio(
    audio: Blob,
    durationMs?: number,
    _source?: string,
    mode: 'fast' | 'accurate' = 'fast',
  ): Promise<string> {
    const result = await this.transcribeAudioDetailed(audio, durationMs, _source, mode)
    return result.transcript
  },

  /** Same single Sarvam STT request; preserve explicit detected language only
   * for the Class 1 tutor. Older transcript-only callers stay unchanged. */
  async transcribeAudioDetailed(
    audio: Blob,
    durationMs?: number,
    _source?: string,
    mode: 'fast' | 'accurate' = 'fast',
  ): Promise<VoiceTranscription> {
    if (!audio.size) throw new Error('The recording is empty. Please try again.')
    markLabSpeechActivity()

    const form = new FormData()
    const extension = audio.type.includes('ogg')
      ? 'ogg'
      : audio.type.includes('wav')
        ? 'wav'
        : audio.type.includes('mp4') || audio.type.includes('m4a')
          ? 'm4a'
          : 'webm'

    form.append('audio', audio, `student-speech.${extension}`)
    if (Number.isFinite(durationMs)) form.append('durationMs', String(Math.round(durationMs!)))
    form.append('mode', mode)

    const token = getStoredToken()
    let response: Response
    try {
      response = await fetch(getApiUrl('/voice/transcribe'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
    } catch {
      throw new Error('Could not reach speech recognition. Check your connection and try again.')
    }

    if (!response.ok) {
      if (response.status === 502 || response.status >= 500) {
        throw new Error('Speech recognition is temporarily unavailable. Please try again in a moment.')
      }
      if (response.status === 429) {
        throw new Error('Speech recognition is busy. Please wait a moment and try again.')
      }
      throw await createVoiceError(response)
    }

    const payload = (await response.json()) as {
      success?: boolean
      data?: TranscriptionResponse
      transcript?: string | null
    }
    const transcript = (payload.data?.transcript ?? payload.transcript)?.trim()
    if (!transcript) throw new Error('No speech was detected. Please try again.')
    const language = payload.data?.languageCode
    return {
      transcript,
      languageCode: language === 'en-IN' || language === 'hi-IN' || language === 'mr-IN'
        ? language
        : undefined,
    }
  },

  /* =======================================================
     SYNTHESIS CHECK
     ======================================================= */

  async synthesize(
    text: string,
    priority: VoicePriority = 'LESSON',
  ): Promise<VoiceSynthesisResult> {
    const cleanedText =
      text.trim()

    if (!cleanedText) {
      return {
        available: false,
      }
    }

    markLabSpeechActivity()
    const token =
      getStoredToken()

    if (!token) return { available: false }

    const response =
      await fetch(
        getApiUrl(
          '/voice/synthesize',
        ),
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },

          body:
            JSON.stringify({
              text:
                cleanedText,
              purpose: priority,
              language: detectVoiceLanguage(cleanedText),
            }),
        },
      )

    if (!response.ok) {
      throw await createVoiceError(
        response,
      )
    }

    const contentType =
      response.headers.get(
        'content-type',
      ) || ''

    return {
      available:
        contentType.startsWith(
          'audio/',
        ),

      provider:
        response.headers.get(
          'x-voice-provider',
        ) ||
        undefined,
    }
  },

  /* =======================================================
     PRIYA SPEAK
     ======================================================= */

  async speak(
    text: string,
    listener?: PlaybackListener,
    turnId?: string,
    priority: VoicePriority = 'LESSON',
    activityId?: string,
    language?: 'en-IN' | 'hi-IN' | 'mr-IN',
  ): Promise<VoicePlaybackResult> {
    if (
      typeof window ===
        'undefined' ||
      !text.trim()
    ) {
      return 'unavailable'
    }

    const cleanedText =
      text.trim()

    const identity = turnId || `text:${cleanedText.toLowerCase().replace(/\s+/g, ' ')}`

    this.lastTurnId = identity

    if (this.playedTurns.has(identity)) {
      if (process.env.NODE_ENV !== 'production') console.info(`[JulieVoice] turn=${identity} already played - skip`)
      return 'spoken'
    }

    const existing = this.turnPlayback.get(identity)
    if (existing) return existing

    const playback = this.speakTurn(cleanedText, identity, listener, false, priority, activityId, language)
      .finally(() => this.turnPlayback.delete(identity))
    this.turnPlayback.set(identity, playback)
    return playback
  },

  async speakTurn(
    cleanedText: string,
    turnId: string,
    listener?: PlaybackListener,
    replay = false,
    priority: VoicePriority = 'LESSON',
    activityId?: string,
    language?: 'en-IN' | 'hi-IN' | 'mr-IN',
  ): Promise<VoicePlaybackResult> {

    const hasActivePlayback = Boolean(this.activeAbort || (this.activeAudio && !this.activeAudio.paused))
    if (hasActivePlayback && voicePriorityRank(priority) < voicePriorityRank(this.activePriority)) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[JulieVoice] lower-priority request ignored', { priority, activePriority: this.activePriority, turnId })
      }
      return 'unavailable'
    }

    this.lastText =
      cleanedText

    this.lastPriority =
      priority

    this.lastActivityId = activityId
    this.lastLanguage = language

    this.stop()
    this.activePriority = priority

    const requestId =
      ++this.playbackRequest

    const abort =
      new AbortController()

    this.activeAbort =
      abort

    listener?.(
      'loading',
    )

    if (
      process.env.NODE_ENV !==
      'production'
    ) {
      console.info(
        '[TALKORA AUDIO] AUDIO_REQUESTED',
        {
          turn: turnId,
        },
      )
    }

    try {
      const result =
        await this.playServerAudio(
          cleanedText,
          requestId,
          abort.signal,
          listener,
          turnId,
          priority,
          activityId,
          language,
        )

      if (result === 'spoken' && !replay) this.playedTurns.add(turnId)

      if (
        result ===
        'unavailable'
      ) {
        listener?.(
          'error',
          'Miss Julie voice service unavailable.',
        )
      }

      return result
    } catch (error) {
      if (
        requestId !==
        this.playbackRequest
      ) {
        return 'unavailable'
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Miss Julie could not speak right now.'

      listener?.(
        'error',
        message,
      )

      return 'unavailable'
    } finally {
      // Clear only the request that still owns playback. A newer, higher-priority
      // turn may already have replaced it.
      if (this.activeAbort === abort) this.activeAbort = null
      if (requestId === this.playbackRequest) this.activePriority = 'PAGE_GUIDANCE'
    }
  },

  /* =======================================================
     REPLAY
     ======================================================= */

  async replay(
    listener?: PlaybackListener,
  ): Promise<VoicePlaybackResult> {
    if (this.lastText && this.lastTurnId && process.env.NODE_ENV !== 'production') {
      console.info(`[JulieVoice] turn=${this.lastTurnId} replay cached audio`)
    }
    const existing = this.lastTurnId ? this.turnPlayback.get(this.lastTurnId) : undefined
    if (existing) return existing
    if (!this.lastText || !this.lastTurnId) return 'unavailable'
    const turnId = this.lastTurnId
    const playback = this.speakTurn(this.lastText, turnId, listener, true, this.lastPriority, this.lastActivityId, this.lastLanguage)
      .finally(() => this.turnPlayback.delete(turnId))
    this.turnPlayback.set(turnId, playback)
    return playback
  },

  /* =======================================================
     STOP
     ======================================================= */

  stop(): void {
    if (
      typeof window ===
      'undefined'
    ) {
      return
    }

    this.playbackRequest +=
      1

    this.activeAbort?.abort()

    this.activeAbort =
      null

    this.activePriority = 'PAGE_GUIDANCE'

    if (
      this.activeAudio
    ) {
      this.activeAudio.pause()

      this.activeAudio.currentTime =
        0

      if (
        this.activeAudio.src.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          this.activeAudio.src,
        )
      }

      this.activeAudio.src = ''
    }
  },

  /* =======================================================
     LEGACY COMPATIBILITY
     ======================================================= */

  speakText(
    text: string,
    onEnd?: () => void,
  ): void {
    void this.speak(
      text,
      (state) => {
        if (
          state === 'idle' ||
          state === 'error'
        ) {
          onEnd?.()
        }
      },
    )
  },

  stopSpeaking(): void {
    this.stop()
  },

  /* =======================================================
     SERVER AUDIO
     ======================================================= */

  async playServerAudio(
    text: string,
    requestId: number,
    signal: AbortSignal,
    listener?: PlaybackListener,
    turnId = '',
    priority: VoicePriority = 'LESSON',
    activityId?: string,
    language?: 'en-IN' | 'hi-IN' | 'mr-IN',
  ): Promise<VoicePlaybackResult> {
    markLabSpeechActivity()
    const requestedAt =
      performance.now()

    // Do not reuse audio from a different sentence in the same activity.
    // Open conversations/feedback can include child-specific information and
    // must never enter this shared browser memory cache.
    const cacheKey = priority === 'LESSON'
      ? `lesson:${activityId || 'generic'}:${detectVoiceLanguage(text)}:${text.trim().replace(/\s+/g, ' ')}`
      : null
    try {
      let audioBlob = cacheKey ? this.audioCache.get(cacheKey) : undefined
      if (!audioBlob) {
        if (process.env.NODE_ENV !== 'production') console.info(`[JulieVoice] turn=${turnId} synthesis requested`)
        const token = getStoredToken()
        if (!token) throw new Error('Sign in to enable personalised Miss Julie voice.')
        const response = await fetch(
          getApiUrl(
            '/voice/synthesize',
          ),
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                text,
                purpose: priority,
                language: language || detectVoiceLanguage(text),
                ...(activityId ? { activityId } : {}),
              }),

            signal,
          },
        )

        if (!response.ok) throw await createVoiceError(response)

        const contentType = response.headers.get('content-type') || ''

        if (!contentType.startsWith('audio/')) throw new Error('Miss Julie returned a non-audio response.')

      if (
        requestId !==
        this.playbackRequest
      ) {
        return 'unavailable'
      }

        audioBlob = await response.blob()

        if (!audioBlob.size) throw new Error('Miss Julie returned an empty audio response.')
        if (cacheKey) this.audioCache.set(cacheKey, audioBlob)
        if (this.audioCache.size > 40) {
          const oldest = this.audioCache.keys().next().value
          if (oldest) this.audioCache.delete(oldest)
        }
        if (process.env.NODE_ENV !== 'production') console.info(`[JulieVoice] turn=${turnId} synthesis ready`)

        if (process.env.NODE_ENV !== 'production') {
        console.info(
          '[Talkora AI] TTS_NETWORK',
          {
            ms:
              Math.round(
                performance.now() -
                  requestedAt,
              ),

            bytes:
              audioBlob.size,

            cache:
              response.headers.get(
                'x-talkora-cache',
              ),

            provider:
              response.headers.get(
                'x-voice-provider',
              ),
          },
        )
        }
      }

      if (requestId !== this.playbackRequest) return 'unavailable'

      const previousAudio =
        this.activeAudio

      if (
        previousAudio?.src.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          previousAudio.src,
        )
      }

      const audio =
        previousAudio ||
        new Audio()

      const objectUrl =
        URL.createObjectURL(
          audioBlob,
        )

      audio.src =
        objectUrl
      audio.preload =
        'auto'
      audio.volume =
        1
      audio.currentTime =
        0

      this.activeAudio =
        audio

      return await new Promise<VoicePlaybackResult>(
        (resolve) => {
          let settled =
            false

          const onAbort = () => {
            audio.pause()
            if (audio.src === objectUrl) {
              URL.revokeObjectURL(objectUrl)
              audio.removeAttribute('src')
            }
            finish('unavailable')
          }

          const finish = (
            result: VoicePlaybackResult,
          ) => {
            if (
              settled
            ) {
              return
            }

            settled =
              true
            signal.removeEventListener('abort', onAbort)

            resolve(
              result,
            )
          }

          audio.onended =
            () => {
              if (
                process.env.NODE_ENV !==
                'production'
              ) {
                console.info(
                  '[TALKORA AUDIO] AUDIO_PLAY_ENDED',
                )
              }

              if (
                audio.src ===
                objectUrl
              ) {
                URL.revokeObjectURL(
                  objectUrl,
                )

                audio.removeAttribute(
                  'src',
                )
              }

              listener?.(
                'idle',
              )

              finish(
                'spoken',
              )
            }

          audio.onerror =
            () => {
              if (
                audio.src ===
                objectUrl
              ) {
                URL.revokeObjectURL(
                  objectUrl,
                )

                audio.removeAttribute(
                  'src',
                )
              }

              listener?.(
                'error',
                'Miss Julie audio could not be played.',
              )

              finish(
                'unavailable',
              )
            }

          const startPlayback = () => {
            void audio.play()
              .then(() => {
                if (requestId !== this.playbackRequest) {
                  audio.pause()
                  finish('unavailable')
                  return
                }
                this.playbackUnlocked =
                  true

                if (process.env.NODE_ENV !== 'production') console.info(`[JulieVoice] turn=${turnId} autoplay`)

                if (
                  process.env.NODE_ENV !==
                  'production'
                ) {
                  console.info(
                    '[Talkora AI] AUDIO_START',
                    {
                      ms:
                        Math.round(
                          performance.now() -
                            requestedAt,
                        ),
                    },
                  )
                }

                listener?.(
                  'speaking',
                )
              })
              .catch((error) => {
                if (
                  audio.src ===
                  objectUrl
                ) {
                  URL.revokeObjectURL(
                    objectUrl,
                  )

                  audio.removeAttribute(
                    'src',
                  )
                }

                if (
                  error instanceof DOMException &&
                  error.name ===
                    'NotAllowedError'
                ) {
                  this.playbackUnlocked =
                    false

                  if (
                    process.env.NODE_ENV !==
                    'production'
                  ) {
                    console.warn(
                      '[TALKORA AUDIO] AUTOPLAY_BLOCKED',
                    )
                  }

                  listener?.(
                    'error',
                    'Tap Listen to hear Miss Julie.',
                  )

                  finish(
                    'autoplay-blocked',
                  )

                  return
                }

                listener?.(
                  'error',
                  'Miss Julie audio could not be played.',
                )

                finish(
                  'unavailable',
                )
              })
          }

          signal.addEventListener('abort', onAbort, { once: true })
          if (signal.aborted) onAbort()
          else startPlayback()
        },
      )
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name ===
          'AbortError'
      ) {
        return 'unavailable'
      }

      throw error
    }
  },
}

/* =========================================================
   STRUCTURED VOICE ERRORS
   ========================================================= */

async function createVoiceError(
  response: Response,
) {
  let message =
    `Voice request failed (${response.status}).`

  try {
    const data =
      (await response.json()) as {
        error?: {
          message?: string
          code?: string
        }
        message?: string
      }

    const serverMessage =
      data.error?.message ||
      data.message

    if (
      serverMessage?.trim()
    ) {
      message =
        serverMessage.trim()
    }
  } catch {
    /*
     * Audio endpoints may return no JSON
     * body on transport/provider errors.
     */
  }

  return new Error(
    message,
  )
}
