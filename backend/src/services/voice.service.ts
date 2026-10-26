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



export type VoicePurpose = 'PAGE_GUIDANCE' | 'LESSON' | 'CONVERSATION' | 'FEEDBACK'

// A lesson's reviewed S3 key must use the immutable class/level/version layout.
// Never accept arbitrary bucket paths from a curriculum activity.
const APPROVED_LESSON_AUDIO_KEY = /^class-(?:0[1-9]|10)\/level-(?:0[1-9]|10)\/v[1-9]\d*\/[a-z0-9][a-z0-9_-]*\.(?:mp3|wav)$/

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
  options?: { conversation?: boolean },
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
    if (input.activityId) {
      // assertActivity is the authority for both ordinary published activities
      // and explicitly allowlisted KG pilot drafts. Re-fetching and requiring
      // global "active" status here incorrectly rejected every valid KG draft.
      const access = await CurriculumAccessService.assertActivity(studentId, input.activityId)
      const expectedStatus = access.isKGPilot || access.isClass1Demo ? 'draft' : 'active'
      if (access.activity.status !== expectedStatus) throw ApiError.notFound('Activity not found')
    }
    return VoiceSession.create({
      studentId,
      lessonId: input.lessonId,
      activityId: input.activityId,
      startedAt: new Date(),
      provider: getSpeechProvider().name,
      status: 'active',
      metadata: input.expectedPhrase ? { expectedPhrase: input.expectedPhrase } : undefined,
    })
  },

  async submitTranscript(studentId: string, sessionId: string, input: { transcript: string; expected?: string }) {
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

    const activity = session.activityId ? await Activity.findById(session.activityId).select('target prompt type aiEnabled metadata lessonId') : null
    const sessionExpected = typeof session.metadata?.expectedPhrase === 'string' ? session.metadata.expectedPhrase : undefined
    const conversationMode = activity?.metadata?.conversationMode === 'OPEN' || activity?.type === 'CONVERSATION'
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

    // For every school grade, an authorized lesson's reviewed immutable S3
    // narration wins. Dynamic Azure speech remains available for genuinely
    // new teaching, personal feedback, or a missing approved object.
    if (purpose === 'LESSON' && options.studentId && options.activityId) {
      const access = await CurriculumAccessService.assertActivity(options.studentId, options.activityId)
      const key = typeof access.activity.content?.audioKey === 'string'
        ? access.activity.content.audioKey.trim()
        : ''
      if (APPROVED_LESSON_AUDIO_KEY.test(key)) {
        try {
          const audio = await S3Service.getAudio(key)
          if (audio?.length) {
            return {
              body: streamFromBuffer(audio),
              contentType: key.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
              provider: 'ai4bharat-s3',
              metadata: { 'X-Talkora-Cache': 'STATIC-HIT' },
            }
          }
          logger.warn('Reviewed lesson audio is missing; using dynamic voice fallback', { activityId: options.activityId })
        } catch (error) {
          logger.warn('Static lesson audio lookup failed; using dynamic voice fallback', { activityId: options.activityId, error })
        }
      }
    }

    // Azure Neerja is Talkora's primary Miss Julie voice everywhere.
    // Groq is the fast vendor fallback and the existing Python/Priya pipeline
    // remains the final safety net for cached/legacy lesson audio.
    const azure = await tryStream(new AzureVoiceProvider(), text)
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
