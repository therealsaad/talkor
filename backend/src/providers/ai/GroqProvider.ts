import { AIProvider, MissJulieContext, unitTeachingGuidance } from './AIProvider'
import { AIStructuredResponse } from '../../types'
import { aiStructuredResponseSchema } from '../../schemas/ai.schema'
import { ApiError } from '../../utils/ApiError'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export type LearnerLanguageHint =
  | 'HINDI' | 'MARATHI' | 'URDU' | 'ROMANIZED_HINDUSTANI'
  | 'ROMANIZED_MARATHI' | 'DEVANAGARI_UNDETERMINED' | 'ENGLISH_OR_OTHER'

/** Advisory transcript hint: Hindi and Marathi share Devanagari. Do not
 * treat writing system alone as a reliable learner-language detection. */
export function detectLearnerLanguage(message: string): LearnerLanguageHint {
  const text = message.slice(0, 240).normalize('NFKC')
  if (/[\u0600-\u06FF]/u.test(text)) return 'URDU'
  if (/[\u0900-\u097F]/u.test(text)) {
    const terms = text.match(/[\u0900-\u097F]+/gu) || []
    const marathi = new Set(['मला', 'काय', 'शाळा', 'मांजर', 'मराठी', 'आहे', 'पुन्हा', 'छान', 'समजत', 'चेंडू', 'म्हणा'])
    const hindi = new Set(['मुझे', 'कैसे', 'हिंदी', 'बिल्ली', 'नहीं', 'क्यों', 'क्या', 'हैं', 'हूँ'])
    const hasMarathi = terms.some((term) => marathi.has(term))
    const hasHindi = terms.some((term) => hindi.has(term))
    if (hasMarathi && !hasHindi) return 'MARATHI'
    if (hasHindi && !hasMarathi) return 'HINDI'
    return 'DEVANAGARI_UNDETERMINED'
  }
  if (/\b(mala|samjat|kaay|aahe|ahe|tumhi|chendu|manjar|shala|marathi)\b/i.test(text)) return 'ROMANIZED_MARATHI'
  if (/\b(kaise|kaisi|aap|tum|kya|hai|hain|ho|mera|mujhe|achha|shukriya)\b/i.test(text)) return 'ROMANIZED_HINDUSTANI'
  return 'ENGLISH_OR_OTHER'
}

export function buildSystemPrompt(): string {
  return [
    'You are Miss Julie, a warm English conversation coach for a school child.',
    'You understand English, Hindi, Marathi, Urdu and Romanized home-language speech, including mixed-language responses. Read what the child means before correcting them.',
    'Speak in brief, age-appropriate English. For KG–Class 2 or beginners, add short Hindi or Marathi explanations when needed, but always model the English lesson target. Never shame home-language use or assume grade equals speaking ability.',
    'When a child says a Hindi, Marathi or Urdu phrase such as "kaise ho", briefly teach its English equivalent: "In English, we say: How are you?" Answer naturally and ask one lesson-related question.',
    'Follow explicit support-language requests first, then the authenticated preferredExplanationLanguage hint when supplied. A DEVANAGARI_UNDETERMINED transcript is not proof of Hindi or Marathi; do not guess a language from its script.',
    'When the child makes an English grammar mistake, give one short corrected English sentence and a kind explanation. Do not invent a mistake when the answer is correct.',
    'Keep message plus followUpQuestion ideally under 180 characters for responsive speech. Preserve the meaning of the child response.',
    'Read the recent conversation. The student just answered the most recent Julie question. Respond to what the student actually said.',
    'Stay within the lesson topic and the remaining learning concepts. Follow the invisible teaching guidance computed from prior attempts. Ask ONE short, natural follow-up question. Do not repeat a previous question or switch to an unrelated topic.',
    'If the student answer is unclear, give one gentle hint and ask for a clearer answer to the SAME question. Never invent what the student said.',
    'Return exactly one JSON object, no markdown: {"message":"short reaction without a question","emotion":"encouraging","followUpQuestion":"one short question or null","responseQuality":"ADEQUATE","shouldRetry":false,"hintLevel":0,"modelSentence":null,"teachingAction":"ASK_FOLLOW_UP","corrections":[],"memoryUpdates":[]}.',
    'Valid emotion values: greeting, welcome, curious, listening, thinking, delighted, encouraging, gentle_correction, modeling, proud, surprised, retry, gentle_retry, hinting, celebrating, concerned.',
    'Set shouldRetry true only when a clear retry is needed. If shouldRetry is true, followUpQuestion should repeat or clarify the current question.',
  ].join(' ')
}

export function buildUserPrompt(context: MissJulieContext): string {
  const unitGuidance = unitTeachingGuidance(context)
  return JSON.stringify({
    student: context.studentName,
    grade: context.grade,
    level: context.levelTitle,
    lesson: context.lessonTitle,
    activity: context.activityTitle,
    currentQuestion: context.activityTarget,
    activityGoal: context.activityTarget,
    digitalType: context.digitalType,
    julieProfile: context.julieProfile,
    recentConversation: context.conversationHistory?.slice(-8),
    unitTeachingGuidance: unitGuidance,
    remainingConcepts: context.remainingConcepts,
    requiredConcepts: context.requiredConcepts,
    learningObjectives: unitGuidance
      ? [...(context.learningObjectives || []), unitGuidance]
      : context.learningObjectives,
    recentJulieOpeners: context.recentJulieOpeners,
    waitingForRetry: context.waitingForRetry,
    retryTargetSkill: context.retryTargetSkill,
    recentMistakes: context.recentMistakes,
    teachingEvidence: context.learningEvidence,
    knownFacts: context.memoryFacts,
    interactionContext: context.promptContext,
    studentMessage: context.studentMessage,
    studentLanguageHint: detectLearnerLanguage(context.studentMessage),
    preferredExplanationLanguage: context.preferredExplanationLanguage ?? null,
  })
}

export class GroqProvider implements AIProvider {
  name = 'groq'
  constructor(private readonly model = env.conversationGroqModel) {}

  async generate(context: MissJulieContext): Promise<AIStructuredResponse> {
    if (!env.groqApiKey) {
      throw ApiError.provider('AI provider is not configured (missing GROQ_API_KEY)')
    }

    const startedAt = Date.now()
    let response: Response
    try {
      response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.groqApiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.5,
          max_completion_tokens: 700,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: buildUserPrompt(context) },
          ],
        }),
        signal: AbortSignal.timeout(env.aiServiceTimeoutMs),
      })
    } catch (err) {
      const metadata = {
        model: this.model,
        errorName: err instanceof Error ? err.name : 'UnknownError',
        latencyMs: Date.now() - startedAt,
      }
      if (err instanceof Error && err.name === 'TimeoutError') {
        logger.warn('Groq AI request timed out', metadata)
        throw ApiError.gatewayTimeout('Groq AI timed out. Please try again shortly.')
      }
      logger.error('Groq request failed', metadata)
      throw ApiError.provider('Could not reach the Groq AI provider. Please try again shortly.')
    }

    if (!response.ok) {
      const providerBody = await response.json().catch(() => null) as {
        error?: { type?: unknown }
      } | null
      const rawType = providerBody?.error?.type
      const providerErrorType = typeof rawType === 'string' && /^[\w.-]{1,80}$/.test(rawType)
        ? rawType
        : undefined
      const metadata = {
        status: response.status,
        model: this.model,
        providerErrorType,
        latencyMs: Date.now() - startedAt,
      }

      if (response.status === 429) {
        logger.warn('Groq rate-limited an AI request', metadata)
        throw ApiError.rateLimited('Groq AI is busy right now. Please try again shortly.')
      }

      logger.error('Groq returned an error', metadata)
      if (response.status === 401 || response.status === 403) {
        throw ApiError.provider(`The Groq AI provider rejected its configured key (HTTP ${response.status}). Check GROQ_API_KEY.`)
      }

      throw ApiError.provider(`The Groq AI provider could not answer (HTTP ${response.status}). Please try again shortly.`)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw ApiError.provider('The AI provider returned an empty response')

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(raw)
    } catch {
      throw ApiError.provider('The AI provider returned malformed JSON')
    }

    // Never trust raw AI JSON — validate it against the same schema controllers rely on.
    const result = aiStructuredResponseSchema.safeParse(parsedJson)
    if (!result.success) {
      logger.error('Groq response failed schema validation', { issues: result.error.issues })
      throw ApiError.provider('The AI provider returned an unexpected response shape')
    }
    logger.info('Groq AI completed', { model: this.model, latencyMs: Date.now() - startedAt })
    return result.data
  }
}
