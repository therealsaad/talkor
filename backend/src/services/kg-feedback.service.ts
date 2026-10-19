import { env } from '../config/env'
import { kgTeachingHint } from './kg-teaching-hint'
import type { Letter } from '../kg/alphabet-content'

export type KGFeedbackInput = {
  letter: Letter
  mode: 'speak' | 'touch'
  outcome: 'correct' | 'incorrect' | 'unclear'
  transcript?: string
  selected?: string
  noSpeech?: boolean
}

const WORDS: Record<Letter, string> = { A: 'apple', B: 'ball', C: 'cat', D: 'dog' }

export function safeKGFeedback(input: KGFeedbackInput): string {
  const word = WORDS[input.letter]
  if (input.outcome === 'correct') return `Yay! You did it! ${input.letter} is for ${word}. Wonderful!`
  if (input.noSpeech) return `I'm listening, superstar. Take your time! Say ${word} when you're ready.`
  if (input.outcome === 'unclear') return `Let's say ${word} together. Take your time. Koi baat nahi!`
  return kgTeachingHint(input.letter, input.mode, input.outcome) || `Let's try ${word} together!`
}

/** Groq supplies *wording only*. Speech/picture grades are computed by the backend, never by the LLM. */
export async function generateKGFeedback(input: KGFeedbackInput): Promise<{ text: string; source: 'groq' | 'guided' }> {
  const fallback = safeKGFeedback(input)
  if (!env.groqApiKey || input.noSpeech) return { text: fallback, source: 'guided' }
  const word = WORDS[input.letter]
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.groqApiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6500),
      body: JSON.stringify({
        model: env.conversationGroqModel,
        temperature: 0.55,
        max_tokens: 110,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are Miss Julie, a warm, enthusiastic kindergarten English teacher for a 4-year-old. Return only a JSON object {"text":"..."}. One or two VERY short friendly sentences, under 130 characters. The backend has already graded the answer. Never alter its verdict. For wrong or unclear answers, model the target English word and invite one retry. For correct answers, celebrate warmly. No markdown, emojis, scary language, name, or unrelated topics. Do not quote a child saying anything they did not say.' },
          { role: 'user', content: JSON.stringify({
            targetLetter: input.letter, targetWord: word, activity: input.mode,
            verifiedOutcome: input.outcome, heard: (input.transcript || '').slice(0, 100), selectedPicture: (input.selected || '').slice(0, 16),
          }) },
        ],
      }),
    })
    if (!response.ok) return { text: fallback, source: 'guided' }
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}') as { text?: unknown }
    const text = typeof parsed.text === 'string' ? parsed.text.replace(/\s+/g, ' ').trim() : ''
    if (text.length < 12 || text.length > 140 || /[<>\[\]{}]/.test(text)) return { text: fallback, source: 'guided' }
    // Prevent an LLM from acknowledging a wrong answer as correct or failing to model the target.
    if (input.outcome !== 'correct' && (!text.toLowerCase().includes(word) ||
        /\b(you got it|exactly right|correct answer|well done|perfect answer)\b/i.test(text))) return { text: fallback, source: 'guided' }
    return { text, source: 'groq' }
  } catch {
    return { text: fallback, source: 'guided' }
  }
}
