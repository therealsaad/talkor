import { env } from '../../config/env'
import { aiStructuredResponseSchema } from '../../schemas/ai.schema'
import { AIStructuredResponse } from '../../types'
import { AIProvider, MissJulieContext, unitTeachingGuidance } from './AIProvider'
import { GroqProvider } from './GroqProvider'
import { class1ExplanationLanguage } from './class1-language'
import { ApiError } from '../../utils/ApiError'

export class PythonAIProvider implements AIProvider {
  name = 'python-qwen'
  private fallbackGroq = new GroqProvider()

  async generate(context: MissJulieContext): Promise<AIStructuredResponse> {
    const startedAt = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.aiServiceTimeoutMs)
    const unitGuidance = unitTeachingGuidance(context)
    const isClass1Pilot = context.grade === 1 && context.levelId === 'g01-l01'
    const pilotEnabled = isClass1Pilot
    const serviceKey = env.talkoraServiceKey.trim()
    if (pilotEnabled && isClass1Pilot && env.isProd && serviceKey.length < 32) {
      // Never call a production bridge without server-to-server authentication.
      throw ApiError.provider('CLASS1_AI_SERVICE_AUTH_NOT_CONFIGURED')
    }
    const baseUrl = pilotEnabled && isClass1Pilot
      ? process.env.TALKORA_CLASS1_AI_URL || 'http://127.0.0.1:8002'
      : env.aiServiceUrl

    try {
      if (env.nodeEnv !== 'production') {
        console.info('[TALKORA AI] QWEN_REQUEST', {
          grade: context.grade,
          levelId: context.levelId,
          messageLength: context.studentMessage.length,
        })
      }

      const response = await fetch(
        `${baseUrl.replace(/\/$/, '')}/v1/brain/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(serviceKey ? { 'X-Talkora-Service-Key': serviceKey } : {}),
          },
          signal: controller.signal,
          body: JSON.stringify({
            studentName: context.studentName,
            grade: context.grade,
            ...(isClass1Pilot && pilotEnabled ? { levelId: context.levelId } : {}),
            avatarType: context.avatarType || 'BOY',
            unitNumber: context.unitNumber || 1,
            unitTitle: context.levelTitle || 'My Favourite Things',
            lessonTitle: context.lessonTitle,
            stage: context.stage || context.promptContext,
            activityTitle: context.activityTitle || '',
            digitalType: context.digitalType || '',
            julieProfile: context.julieProfile || {},
            currentQuestion: context.activityTarget || context.activityTitle || '',
            allowedVocabulary: context.allowedVocabulary || [],
            learningObjectives: unitGuidance
              ? [...(context.learningObjectives || []), unitGuidance]
              : context.learningObjectives || [],
            recentMistakes: context.recentMistakes,
            studentMemory: context.memoryFacts,
            learningEvidence: context.learningEvidence || [],
            conversationHistory: context.conversationHistory || [],
            requiredConcepts: context.requiredConcepts || [],
            achievedConcepts: context.achievedConcepts || [],
            remainingConcepts: context.remainingConcepts || [],
            hintLevel: context.hintLevel || 0,
            waitingForRetry: Boolean(context.waitingForRetry),
            retryTargetSkill: context.retryTargetSkill || '',
            recentJulieOpeners: context.recentJulieOpeners || [],
            preferredExplanationLanguage: isClass1Pilot && pilotEnabled ? class1ExplanationLanguage(context) : 'English',
            studentMessage: context.studentMessage,
          }),
        },
      )

      if (!response.ok) {
        // Avoid echoing upstream response bodies or student text to logs.
        throw new Error(`Python AI service returned HTTP ${response.status}`)
      }

      const brain = (await response.json()) as {
        message: string
        reaction: string
        responseQuality?: string
        followUpQuestion?: string | null
        correction?: {
          needed?: boolean
          original?: string
          corrected?: string
          explanation?: string
        }
        memoryUpdates?: Array<{
          key: string
          value: string
          category: string
          confidence: number
        }>
        recommendedAction?: string
        teachingAction?: string
        modelSentence?: string | null
        activityComplete?: boolean
        shouldRetry?: boolean
        hintLevel?: number
        detectedSkills?: string[]
        remainingSkills?: string[]
      }

      const result = aiStructuredResponseSchema.parse({
        message: brain.message,
        emotion: brain.reaction,
        responseQuality: brain.responseQuality || 'ADEQUATE',
        corrections:
          brain.correction?.needed && brain.correction.corrected
            ? [brain.correction.corrected]
            : [],
        correction: brain.correction
          ? {
              needed: Boolean(brain.correction.needed),
              original: brain.correction.original || '',
              corrected: brain.correction.corrected || '',
              explanation: brain.correction.explanation || '',
            }
          : undefined,
        hint: brain.correction?.needed
          ? brain.correction.explanation || null
          : null,
        followUpQuestion: brain.followUpQuestion || null,
        memoryUpdates: brain.memoryUpdates || [],
        xpAwarded: 0,
        recommendation: brain.recommendedAction || null,
        teachingAction:
          brain.teachingAction || brain.recommendedAction || null,
        modelSentence: brain.modelSentence || null,
        activityComplete: Boolean(brain.activityComplete),
        shouldRetry: Boolean(brain.shouldRetry),
        hintLevel: brain.hintLevel || 0,
        detectedSkills: brain.detectedSkills || [],
        remainingSkills: brain.remainingSkills || [],
      })

      if (env.nodeEnv !== 'production') {
        console.info('[TALKORA AI] QWEN_RESPONSE', {
          latencyMs: Date.now() - startedAt,
          responseQuality: result.responseQuality,
          activityComplete: result.activityComplete,
        })
      }

      return result
    } catch (error) {
      console.warn(
        '[TALKORA AI] Local Qwen unavailable.',
        error instanceof Error ? error.message : error,
      )

      // Never route an unavailable Class 1 curriculum turn to an unrestricted
      // provider: it could switch syllabus or make unsupported claims.
      if (isClass1Pilot && pilotEnabled) {
        throw ApiError.provider('AI_SERVICE_UNAVAILABLE')
      }

      // A configured real cloud provider is an acceptable explicit fallback.
      // Never silently replace a failed Qwen turn with MockAIProvider because
      // that makes a broken local AI stack look healthy.
      if (env.groqApiKey) {
        try {
          return await this.fallbackGroq.generate(context)
        } catch (groqError) {
          console.warn(
            '[TALKORA AI] Groq fallback failed.',
            groqError instanceof Error ? groqError.message : groqError,
          )
        }
      }

      throw ApiError.provider('AI_SERVICE_UNAVAILABLE')
    } finally {
      clearTimeout(timeout)
    }
  }
}
