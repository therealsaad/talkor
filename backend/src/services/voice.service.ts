// TALKORA_CLASS1_STUDENT_DEMO_ROUTE_V1
import { VoiceSession } from '../models/VoiceSession'
import { getSpeechProvider } from '../providers/speech'
import { getVoiceProvider } from '../providers/voice'
import { getPronunciationProvider } from '../providers/pronunciation'
import { ApiError } from '../utils/ApiError'
import { Activity } from '../models/Activity'
import { ProgressService } from './progress.service'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { MissJulieService } from './missJulie.service'
import { CurriculumAccessService } from './curriculum-access.service'
import { logger } from '../utils/logger'
import type { VoiceStreamResult } from '../providers/voice/VoiceProvider'
import { GroqVoiceProvider } from '../providers/voice/GroqVoiceProvider'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { PythonVoiceProvider } from '../providers/voice/PythonVoiceProvider'
import { S3Service } from './S3Service'
import { class1SupportFromSarvam } from '../providers/ai/class1-stt-language'
import class1VoiceManifest from '../scripts/class1-level1-ai4bharat-lines.json'
import firstDayVoices from '../scripts/class1-first-day-voice-v3.json'



export type VoicePurpose = 'PAGE_GUIDANCE' | 'LESSON' | 'CONVERSATION' | 'FEEDBACK'

// A lesson's reviewed S3 key must use the immutable class/level/version layout.
// Never accept arbitrary bucket paths from a curriculum activity.
const APPROVED_LESSON_AUDIO_KEY = /^class-(?:0[1-9]|10)\/level-(?:0[1-9]|10)\/v[1-9]\d*\/[a-z0-9][a-z0-9_-]*\.(?:mp3|wav)$/

// Only these immutable, human-reviewed Class 1 narration keys can be shared
// across students. A browser-provided activityId or purpose is never sufficient.
const CLASS1_STATIC_LINES = new Map(
  [...class1VoiceManifest.lines, ...firstDayVoices.lines].map((line) => [line.s3Key, line.text] as const),
)
const STATIC_AUDIO_MAX_ITEMS = 16
const STATIC_AUDIO_MAX_ITEM_BYTES = 2 * 1024 * 1024
const STATIC_AUDIO_TTL_MS = 5 * 60 * 1000
type StaticAudio = { audio: Buffer; contentType: string; provider: string }
const staticAudioCache = new Map<string, { value: StaticAudio; expiresAt: number }>()
const staticAudioInFlight = new Map<string, Promise<StaticAudio | null>>()

function sameNarration(left: string, right: string): boolean {
  return left.normalize('NFC').replace(/\s+/g, ' ').trim() ===
    right.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function getStaticAudio(key: string, text: string): Promise<StaticAudio | null> {
  const cacheKey = [key, process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED === 'true' ? 'reviewed' : 'pending',
    process.env.AZURE_VOICE_PROFILE_VERSION || 'v2-mp3',
    process.env.AZURE_SPEECH_VOICE || 'en-IN-NeerjaNeural'].join(':')
  const existing = staticAudioCache.get(cacheKey)
  if (existing && existing.expiresAt > Date.now()) return Promise.resolve(existing.value)
  if (existing) staticAudioCache.delete(cacheKey)
  const pending = staticAudioInFlight.get(cacheKey)
  if (pending) return pending

  const loader = (async (): Promise<StaticAudio | null> => {
    let saved: Buffer | null = null
    // Uploading a WAV is not the same as educator approval. Pilot defaults to
    // Azure fixed-line fallback until the S3 narration is explicitly reviewed.
    if (process.env.TALKORA_CLASS1_STATIC_AUDIO_APPROVED === 'true') {
      try {
        saved = await S3Service.getAudio(key)
      } catch (error) {
        logger.warn('Class 1 static audio lookup unavailable', { key, error })
      }
    }
    if (saved?.length) {
      return { audio: saved, provider: 'ai4bharat-s3', contentType: key.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav' }
    }
    if (key.startsWith('class-01/level-01/v3/')) {
      // Never spend a surprise Azure credit when a promised reviewed S3
      // First Day clip is missing or not approved. Fail explicitly instead.
      throw ApiError.provider('CLASS1_FIRST_DAY_APPROVED_AUDIO_MISSING')
    }
    // Fixed, manifest-verified line only. Never cache student transcripts, names,
    // personalised feedback, or free-form LLM replies.
    try {
      const voice = await new AzureVoiceProvider().synthesize(text)
      if (!voice.audioBase64) return null
      return {
        audio: Buffer.from(voice.audioBase64, 'base64'),
        provider: voice.provider || 'azure-neerja',
        contentType: voice.contentType || 'audio/mpeg',
      }
    } catch (error) {
      logger.warn('Class 1 fixed narration Azure fallback unavailable', { key, error })
      return null
    }
  })().then((result) => {
    if (result && result.audio.length && result.audio.length <= STATIC_AUDIO_MAX_ITEM_BYTES) {
      if (staticAudioCache.size >= STATIC_AUDIO_MAX_ITEMS) {
        const oldest = staticAudioCache.keys().next().value
        if (oldest) staticAudioCache.delete(oldest)
      }
      staticAudioCache.set(cacheKey, { value: result, expiresAt: Date.now() + STATIC_AUDIO_TTL_MS })
    }
    return result
  }).finally(() => staticAudioInFlight.delete(cacheKey))

  staticAudioInFlight.set(cacheKey, loader)
  return loader
}

function streamFromBuffer(audio: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(audio)
      controller.close()
    },
  })
}

async function tryStream(
  provider: { name: string; synthesizeStream?: (text: string, options?: { conversation?: boolean }) => Promise<VoiceStreamResult> },
  text: string,
  options?: { conversation?: boolean; class1Lesson?: boolean },
): Promise<VoiceStreamResult | null> {
  if (!provider.synthesizeStream) return null
  try {
    return await provider.synthesizeStream(text, options)
  } catch (error) {
    logger.warn('Voice provider failed; trying fallback', { provider: provider.name, error })
    return null
  }
}

function evaluateOpenResponse(transcript: string) {
  const words = transcript.toLowerCase().match(/[a-z']+/g) || []
  const completeThought = words.length >= 3
  return {
    score: completeThought ? 85 : 55,
    feedback: completeThought
      ? 'I heard a complete response. Miss Julie will continue the conversation.'
      : 'I heard you. Try adding a few more words to make a complete answer.',
    correctWords: words,
    wrongWords: [],
    missingWords: [],
    extraWords: [],
    wordOrderMatched: true,
    sentenceSimilarity: completeThought ? 85 : 55,
    isAcousticPronunciationScore: false as const,
  }
}

export const VoiceService = {
  async startSession(studentId: string, input: { lessonId?: string; activityId?: string; expectedPhrase?: string }) {
    let authoritativeExpectedPhrase: string | undefined
    if (input.activityId) {
      // assertActivity is the authority for both ordinary published activities
      // and explicitly allowlisted KG pilot drafts. Re-fetching and requiring
      // global "active" status here incorrectly rejected every valid KG draft.
      const access = await CurriculumAccessService.assertActivity(studentId, input.activityId)
      const expectedStatus = access.isKGPilot || access.isClass1Demo ? 'draft' : 'active'
      if (access.activity.status !== expectedStatus) throw ApiError.notFound('Activity not found')
      // A Class 1 student may speak with an accent, but must not pick their
      // own marking target through an API payload. Use the lesson's server
      // target for controlled speech, keeping open conversations flexible.
      if (access.isClass1Demo && access.activity.type !== 'CONVERSATION') {
        authoritativeExpectedPhrase = access.activity.target?.trim()
        if (!authoritativeExpectedPhrase) throw ApiError.badRequest('This activity is missing its approved speaking target')
      }
    }
    const expectedPhrase = authoritativeExpectedPhrase ?? input.expectedPhrase
    return VoiceSession.create({
      studentId,
      lessonId: input.lessonId,
      activityId: input.activityId,
      startedAt: new Date(),
      provider: getSpeechProvider().name,
      status: 'active',
      metadata: expectedPhrase ? { expectedPhrase } : undefined,
    })
  },

  async submitTranscript(studentId: string, sessionId: string, input: {
    transcript: string
    expected?: string
    detectedLanguage?: 'en-IN' | 'hi-IN' | 'mr-IN'
  }) {
    const session = await VoiceSession.findOne({ _id: sessionId, studentId })
    if (!session) throw ApiError.notFound('Voice session not found')
    if (session.status === 'completed') {
      if (!session.aiResponse && session.activityId) {
        const completedActivity = await Activity.findById(session.activityId).select('aiEnabled')
        if (completedActivity?.aiEnabled) throw ApiError.conflict('This voice session has no teacher reply. Please try a new response.')
      }
      return session
    }
    if (session.status !== 'active') throw ApiError.conflict('Voice session is no longer active')

    const activity = session.activityId ? await Activity.findById(session.activityId).select('target prompt type aiEnabled activityKey metadata lessonId') : null
    const sessionExpected = typeof session.metadata?.expectedPhrase === 'string' ? session.metadata.expectedPhrase : undefined
    const conversationMode = activity?.metadata?.conversationMode === 'OPEN' || activity?.type === 'CONVERSATION'
    // The code comes from Sarvam's single existing STT request. A missing or
    // ambiguous code leaves explicit spoken requests and conversation history
    // in charge. Only canonical Class 1 demo tutoring uses this preference.
    const class1Language = class1SupportFromSarvam(activity?.activityKey, input.detectedLanguage)
    const expected = sessionExpected || (typeof activity?.metadata?.expectedPhrase === 'string' ? activity.metadata.expectedPhrase : activity?.target)
    if (!conversationMode && !expected) throw ApiError.badRequest('This voice activity has no pronunciation target')
    let evaluation
    if (conversationMode) {
      evaluation = evaluateOpenResponse(input.transcript)
    } else {
      const pronunciationProvider = getPronunciationProvider()
      const result = await pronunciationProvider.evaluate({ word: expected as string, transcript: input.transcript })
      evaluation = {
        score: result.score ?? 0,
        feedback: result.feedback,
        correctWords: result.correctWords,
        wrongWords: result.wrongWords,
        missingWords: result.missingWords,
        extraWords: result.extraWords,
        wordOrderMatched: result.wordOrderMatched,
        sentenceSimilarity: result.sentenceSimilarity,
        isAcousticPronunciationScore: false as const,
      }
    }

    session.transcript = input.transcript
    session.evaluation = evaluation
    session.endedAt = new Date()
    session.duration = session.endedAt.getTime() - session.startedAt.getTime()

    // Speaking progress is recorded only after the server-side pronunciation evaluation;
    // the browser never gets to choose a score or award itself XP.
    let progressResult: Awaited<ReturnType<typeof ProgressService.submitAttempt>> | undefined
    const priorSuccessfulAttempt = session.activityId
      ? await ActivityAttempt.exists({ studentId, activityId: session.activityId, correct: true })
      : null
    if (session.activityId && evaluation && !priorSuccessfulAttempt && !(conversationMode && activity?.aiEnabled)) {
      progressResult = await ProgressService.submitAttempt({
        studentId,
        activityId: session.activityId.toString(),
        answer: input.transcript,
        startedAt: session.startedAt,
        hintsUsed: 0,
        idempotencyKey: `voice:${session._id.toString()}`,
        evaluation: { score: evaluation.score, feedback: evaluation.feedback },
      })
    }

    const aiResponse = activity?.aiEnabled && conversationMode
      ? await MissJulieService.converse(studentId, {
          message: input.transcript,
          lessonId: (session.lessonId || activity.lessonId)?.toString(),
          activityId: activity._id.toString(),
          context: conversationMode ? 'speaking' : 'pronunciation',
          inputMode: 'MIC',
          currentTarget: expected || activity.prompt || undefined,
          preferredExplanationLanguage: class1Language,
        })
      : undefined

    session.aiResponse = aiResponse
    session.xpAwarded = progressResult?.xpAwarded ?? 0
    session.conversationMode = conversationMode ? 'OPEN' : 'CONTROLLED'
    session.status = 'completed'
    await session.save()

    return session
  },

  async cancelSession(studentId: string, sessionId: string) {
    const session = await VoiceSession.findOne({ _id: sessionId, studentId })
    if (!session) throw ApiError.notFound('Voice session not found')
    if (session.status === 'active') {
      session.status = 'cancelled'
      session.endedAt = new Date()
      session.duration = session.endedAt.getTime() - session.startedAt.getTime()
      await session.save()
    }
    return session
  },

  async synthesize(text: string, options: { purpose?: VoicePurpose } = {}) {
    const provider = getVoiceProvider()
    return provider.synthesize(text)
  },

  async streamSynthesize(
    text: string,
    options: { studentId?: string; purpose?: VoicePurpose; language?: string; activityId?: string } = {},
  ) {
    const purpose = options.purpose ?? 'LESSON'

    // Only serve a Class 1 static clip if its approved script is exactly the
    // requested line. This prevents a child's dynamic teacher feedback being
    // replaced with an unrelated activity clip.
    let azureAlreadyTried = false
    if (purpose === 'LESSON' && options.studentId && options.activityId) {
      const access = await CurriculumAccessService.assertActivity(options.studentId, options.activityId)
      const key = typeof access.activity.content?.audioKey === 'string'
        ? access.activity.content.audioKey.trim()
        : ''
      if (APPROVED_LESSON_AUDIO_KEY.test(key)) {
        const class1Text = CLASS1_STATIC_LINES.get(key)
        if (key.startsWith('class-01/level-01/')) {
          if (class1Text && sameNarration(text, class1Text)) {
            // The shared fallback may itself call Azure once; do not retry a
            // failed charge through the generic Azure provider below.
            azureAlreadyTried = true
            const fixed = await getStaticAudio(key, class1Text)
            if (fixed) return {
              body: streamFromBuffer(fixed.audio),
              contentType: fixed.contentType,
              provider: fixed.provider,
              metadata: { 'X-Talkora-Cache': fixed.provider === 'ai4bharat-s3' ? 'STATIC-HIT' : 'FIXED-FALLBACK' },
            }
          } else {
            logger.warn('Class 1 narration text mismatch; ignoring static key', { activityId: options.activityId })
          }
        } else {
          // Other grades retain their existing immutable S3 lesson lookup.
          try {
            const audio = await S3Service.getAudio(key)
            if (audio?.length) return {
              body: streamFromBuffer(audio),
              contentType: key.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
              provider: 'ai4bharat-s3',
              metadata: { 'X-Talkora-Cache': 'STATIC-HIT' },
            }
          } catch (error) {
            logger.warn('Static lesson audio lookup failed; using dynamic voice fallback', { activityId: options.activityId, error })
          }
        }
      }
    }

    // Azure Neerja is Talkora's primary Miss Julie voice everywhere.
    // Groq is the fast vendor fallback and the existing Python/Priya pipeline
    // remains the final safety net for cached/legacy lesson audio.
    const isClass1Lesson = Boolean(options.studentId && options.activityId &&
      (await CurriculumAccessService.assertActivity(options.studentId, options.activityId)).activity.activityKey?.startsWith('class1-l01-'))
    const azure = azureAlreadyTried ? null : await tryStream(new AzureVoiceProvider(), text, { class1Lesson: isClass1Lesson })
    if (azure) return azure

    const groq = await tryStream(new GroqVoiceProvider(), text, {
      conversation: purpose === 'CONVERSATION' || purpose === 'FEEDBACK',
    })
    if (groq) return groq

    const python = await tryStream(new PythonVoiceProvider(), text)
    if (python) return python

    throw ApiError.provider(
      purpose === 'CONVERSATION' || purpose === 'FEEDBACK'
        ? 'Miss Julie voice is unavailable. Check Azure Speech, Groq TTS, and the Python voice service.'
        : 'Lesson voice is unavailable. Check Azure Speech, Groq TTS, and the cached Python voice service.',
    )
  },

  getProvider() {
    return getVoiceProvider()
  },

  async transcribeAudio(
    input: { audioBase64: string; mimeType?: string; durationMs?: number; mode?: 'fast' | 'accurate' },
    studentId?: string,
  ) {
    if (studentId) {
      await CurriculumAccessService.context(studentId)
    }
    return getSpeechProvider().transcribe(input)
  },
}
