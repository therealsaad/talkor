import { env } from '../config/env'
import { logger } from '../utils/logger'
import { guidedFeedbackSegments, needsQwenCoaching, segmentsToText, type KGFeedbackSegment } from '../kg/kg-bilingual-feedback'
import { resolveDeadlineMs, withDeadline } from './turn-deadline'
import type { KGFeedbackInput } from './kg-feedback.service'

/** The backend grades KG speech. Qwen may choose *wording*, never the verdict,
 * the next activity, a child's level, or pronunciation mastery.
 *
 * Speed policy: correct answers, translations ("billi"), silence and picture taps
 * already have a reviewed bilingual line, so they never wait on a model. Qwen is
 * only asked about a spoken attempt the backend could not accept, and it gets a
 * hard deadline (KG_QWEN_TIMEOUT_MS, default 1500 ms). On timeout or any failure
 * the child hears the reviewed line instead of silence.
 */
export const KGQwenFeedbackService = {
  async compose(input: KGFeedbackInput): Promise<{ text: string; source: 'qwen-8002' | 'guided'; segments?: KGFeedbackSegment[] }> {
    const target = { A: 'apple', B: 'ball', C: 'cat', D: 'dog' }[input.letter]
    const segments = guidedFeedbackSegments(input)
    const guided = { text: segmentsToText(segments), source: 'guided' as const, segments }
    if (!needsQwenCoaching(input)) return guided

    const key = env.talkoraServiceKey.trim()
    if (env.isProd && key.length < 32) return guided

    const deadlineMs = resolveDeadlineMs(process.env.KG_QWEN_TIMEOUT_MS)
    const outcome = await withDeadline<string | null>(async (signal) => {
      const baseUrl = (process.env.TALKORA_KG1_AI_URL || 'http://127.0.0.1:8002').replace(/\/$/, '')
      const spoken = input.transcript?.slice(0, 160).trim() || (input.selected ? `I selected ${input.selected.slice(0, 16)}` : 'I am trying.')
      const response = await fetch(`${baseUrl}/v1/brain/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'X-Talkora-Service-Key': key } : {}),
        },
        signal,
        body: JSON.stringify({
          grade: 0,
          levelId: 'g00-l01',
          studentName: 'Learner',
          activityTitle: `KG ABCD: ${input.letter} for ${target}`,
          currentQuestion: input.mode === 'speak' ? `Say the English word ${target}` : `Find the picture of ${target}`,
          learningObjectives: [`Understand and say ${target} in English; a Hindi/Marathi translation is NOT English speaking mastery`],
          allowedVocabulary: [target, input.letter],
          recentMistakes: [],
          conversationHistory: [],
          preferredExplanationLanguage: input.languageCode === 'hi-IN' ? 'Hindi'
            : input.languageCode === 'mr-IN' ? 'Marathi' : 'English',
          waitingForRetry: input.outcome !== 'correct',
          hintLevel: input.outcome === 'correct' ? 0 : 1,
          studentMessage: spoken,
        }),
      })
      if (!response.ok) return null
      const payload = await response.json() as { message?: unknown; followUpQuestion?: unknown }
      const message = typeof payload.message === 'string' ? payload.message.replace(/\s+/g, ' ').trim() : ''
      const question = typeof payload.followUpQuestion === 'string' ? payload.followUpQuestion.replace(/\s+/g, ' ').trim() : ''
      const text = [message, question].filter(Boolean).join(' ').slice(0, 280)
      // Strict deterministic guard: Qwen cannot praise a wrong attempt as
      // correct, skip the word, or introduce arbitrary lessons/identifying asks.
      if (text.length < 12 || text.length > 240 || !new RegExp(`\\b${target}\\b`, 'i').test(text) ||
          /[<>\\[\\]{}]|https?:|www\.|password|phone number|your address/i.test(text) ||
          (input.outcome !== 'correct' && /you got it|exactly right|correct answer|perfect|well done/i.test(text))) {
        return null
      }
      return text
    }, deadlineMs, () => null)

    if (outcome.source !== 'work') {
      // Qwen is a coaching enhancement, not a license to make a child wait or fake success.
      logger.warn('KG Qwen coaching fell back to the reviewed line', { reason: outcome.source, elapsedMs: outcome.elapsedMs, deadlineMs })
    }
    if (!outcome.value) return guided
    return { text: outcome.value, source: 'qwen-8002' }
  },
}
