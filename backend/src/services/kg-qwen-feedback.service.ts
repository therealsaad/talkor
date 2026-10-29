import { env } from '../config/env'
import { safeKGFeedback, type KGFeedbackInput } from './kg-feedback.service'

/** The backend grades KG speech. Qwen may choose *wording*, never the verdict,
 * the next activity, a child's level, or pronunciation mastery. */
export const KGQwenFeedbackService = {
  async compose(input: KGFeedbackInput): Promise<{ text: string; source: 'qwen-8002' | 'guided' }> {
    const target = { A: 'apple', B: 'ball', C: 'cat', D: 'dog' }[input.letter]
    const guided = input.outcome === 'supported'
      ? `Nice try! In English, we call that an ${target}. Listen: ${target}. Can you say ${target}?`
      : safeKGFeedback(input)
    // No LLM may turn a translation, silence or a supported-picture answer
    // into independent English evidence. Keep those short, concrete and safe.
    if (input.outcome === 'supported' || input.noSpeech) return { text: guided, source: 'guided' }
    const key = env.talkoraServiceKey.trim()
    if (env.isProd && key.length < 32) return { text: guided, source: 'guided' }
    try {
      const baseUrl = (process.env.TALKORA_KG1_AI_URL || 'http://127.0.0.1:8002').replace(/\/$/, '')
      const spoken = input.transcript?.slice(0, 160).trim() || (input.selected ? `I selected ${input.selected.slice(0, 16)}` : 'I am trying.')
      const response = await fetch(`${baseUrl}/v1/brain/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'X-Talkora-Service-Key': key } : {}),
        },
        signal: AbortSignal.timeout(7000),
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
          preferredExplanationLanguage: 'English',
          waitingForRetry: input.outcome !== 'correct',
          hintLevel: input.outcome === 'correct' ? 0 : 1,
          studentMessage: spoken,
        }),
      })
      if (!response.ok) return { text: guided, source: 'guided' }
      const payload = await response.json() as { message?: unknown; followUpQuestion?: unknown }
      const message = typeof payload.message === 'string' ? payload.message.replace(/\s+/g, ' ').trim() : ''
      const question = typeof payload.followUpQuestion === 'string' ? payload.followUpQuestion.replace(/\s+/g, ' ').trim() : ''
      const text = [message, question].filter(Boolean).join(' ').slice(0, 280)
      // Strict deterministic guard: Qwen cannot praise a wrong attempt as
      // correct, skip the word, or introduce arbitrary lessons/identifying asks.
      if (text.length < 12 || text.length > 240 || !new RegExp(`\\b${target}\\b`, 'i').test(text) ||
          /[<>\\[\\]{}]|https?:|www\.|password|phone number|your address/i.test(text) ||
          (input.outcome !== 'correct' && /you got it|exactly right|correct answer|perfect|well done/i.test(text))) {
        return { text: guided, source: 'guided' }
      }
      return { text, source: 'qwen-8002' }
    } catch {
      // Qwen is a coaching enhancement, not a license to fake success.
      // The guarded local teacher line still teaches the correct target.
      return { text: guided, source: 'guided' }
    }
  },
}
