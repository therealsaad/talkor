import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { AIStructuredResponse } from '../types'
import type { LessonTeachingContext } from './lesson-teaching-context'
import { firstDaySceneSkills } from './first-day-evidence'

const practiceSchema = z.object({
  version: z.literal(1), contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  stage: z.enum(['LINE', 'WORD', 'JOIN']), lineIndex: z.number().int().min(0).max(9),
  misses: z.number().int().min(0).max(3),
}).strict()

/** Practice is not a curriculum cursor or evidence of lesson mastery. */
export type FirstDayPracticeState = z.infer<typeof practiceSchema>
type Language = 'English' | 'Hindi' | 'Marathi'

function normalized(value: string): string {
  const variants: Record<string, string> = { skipping: 'skip', running: 'run', walking: 'walk',
    smiling: 'smile', jumping: 'jump', playing: 'play', ringing: 'ring', rings: 'ring' }
  return value.normalize('NFKC').toLowerCase().replace(/\bi['’]m\b/g, 'i am')
    .replace(/\b(skipping|running|walking|smiling|jumping|playing|ringing|rings)\b/g, word => variants[word])
    .replace(/\bgrin\b/g, 'smile').replace(/\bhurray\b/g, 'hooray')
    .replace(/\bgo\s+inside\b/g, 'go in').replace(/\bgrade\s+1\b/g, 'grade one')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function smallPart(context: LessonTeachingContext, line: string): string {
  const focus = context.focus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const focused = line.match(new RegExp('\\b' + focus + '\\b', 'i'))
  if (focused) return focused[0]
  const words = line.match(/[a-z]+(?:['’][a-z]+)?/gi) || []
  const vocabulary = new Set(context.vocabulary.map(normalized))
  const common = new Set(['i', 'me', 'see', 'a', 'the', 'in', 'to', 'when', 'like', 'one'])
  return words.find(word => vocabulary.has(normalized(word)) && !common.has(normalized(word))) ||
    words.find(word => !common.has(normalized(word))) || words[0] || line
}

/** A bounded, read-only teaching decision over the authorized current lines.
 * The caller persists only the returned practice cursor in this conversation's
 * retry state. Whole-scene evidence and playback ACKs keep their existing gates.
 */
export function scaffoldFirstDayPractice(input: {
  context?: LessonTeachingContext; transcript: string; language: Language
  previous?: { waiting?: boolean; attempt?: number; practiceScaffold?: unknown }
  response: AIStructuredResponse
}): { response: AIStructuredResponse; state: FirstDayPracticeState } | undefined {
  const context = input.context
  if (!context || firstDaySceneSkills(context.sceneKey, input.transcript).length) return undefined
  const parsed = practiceSchema.safeParse(input.previous?.practiceScaffold)
  const contentHash = createHash('sha256').update(JSON.stringify([
    context.activityKey, context.revision, context.modelLines, context.vocabulary,
  ])).digest('hex')
  const prior = input.previous?.waiting && parsed.success && parsed.data.contentHash === contentHash &&
    parsed.data.lineIndex < context.modelLines.length ? parsed.data : undefined
  // Count this unsuccessful turn, not just saved prior turns: help starts on
  // the THIRD reply. Old records need no backfill or migration.
  if (!prior && (!input.previous?.waiting || (input.previous.attempt || 0) < 2)) return undefined
  let state: FirstDayPracticeState = prior ? { ...prior }
    : { version: 1, contentHash, stage: 'LINE', lineIndex: 0, misses: 0 }
  if (prior) {
    const pending = prior.stage === 'WORD' ? smallPart(context, context.modelLines[prior.lineIndex])
      : context.modelLines[prior.lineIndex]
    // Exact normalized practice is deliberately separate from the existing
    // curriculum evaluator. Questions, negation and injected instructions do
    // not match a quoted model. This never grants a skill or saves an attempt.
    const repeated = prior.stage !== 'JOIN' && !/[?？]/.test(input.transcript) &&
      normalized(input.transcript.slice(0, 400)) === normalized(pending)
    if (repeated) {
      state.misses = 0
      if (prior.stage === 'WORD') state.stage = 'LINE'
      else if (prior.lineIndex + 1 < context.modelLines.length) state.lineIndex += 1
      else state.stage = 'JOIN'
    } else {
      state.misses = Math.min(3, state.misses + 1)
      if (state.misses >= 3 && state.stage !== 'WORD') {
        state.stage = state.stage === 'LINE' ? 'WORD' : 'LINE'
        state.lineIndex = state.stage === 'LINE' ? 0 : state.lineIndex
        state.misses = 0
      }
    }
  }
  const part = state.stage === 'JOIN' ? context.modelLines.join('\n')
    : state.stage === 'WORD' ? smallPart(context, context.modelLines[state.lineIndex])
      : context.modelLines[state.lineIndex]
  const language = input.language === 'Hindi' ? 'hi' : input.language === 'Marathi' ? 'mr' : 'en'
  const intro = state.stage === 'JOIN'
    ? { en: 'Now put these lines together.', hi: 'अब इन पंक्तियों को साथ बोलो।', mr: 'आता या ओळी एकत्र म्हण.' }
    : { en: 'Let us try one small part.', hi: 'चलो, एक छोटा हिस्सा बोलें।', mr: 'चला, एक छोटा भाग म्हणूया.' }
  const teacherHelp = { en: 'Take your time. Ask your teacher to help, then try with me.',
    hi: 'आराम से बोलो। अपने शिक्षक की मदद लो, फिर मेरे साथ कोशिश करो।',
    mr: 'सावकाश म्हण. तुझ्या शिक्षकांची मदत घे, मग माझ्यासोबत प्रयत्न कर.' }
  // Preserve a short explanation/answer (including a volunteered home-language
  // translation), but do not read the whole poem before asking for one line.
  const currentMessage = input.response.message.trim()
  const repeatsModel = context.modelLines.some(line => normalized(currentMessage).includes(normalized(line)))
  const alignedModel = normalized(input.response.modelSentence || '') === normalized(context.modelLines.join(' '))
  const legacyHijack = /\b(?:can you say at|say the word at|short english word|say at\b|word at\b)/i.test(currentMessage)
  const explanation = alignedModel && !legacyHijack && currentMessage.length <= 240 && !repeatsModel ? currentMessage
    : context.hints[language] || ''
  return {
    state,
    response: {
      ...input.response,
      message: state.stage === 'WORD' && state.misses >= 3 ? teacherHelp[language]
        : [intro[language], explanation].filter(Boolean).join(' '),
      followUpQuestion: { en: 'Say with me: ', hi: 'मेरे साथ बोलो: ', mr: 'माझ्यासोबत म्हण: ' }[language] + part,
      // Keep the complete canonical model for validation/display. Only the
      // spoken invitation becomes smaller; grading never changes its target.
      modelSentence: context.modelLines.join('\n'),
      emotion: 'modeling', responseQuality: 'PARTIAL', corrections: [], hint: null, evaluation: undefined,
      correction: { needed: false, original: '', corrected: '', explanation: '' },
      teachingAction: 'MODEL_SENTENCE', shouldRetry: true, hintLevel: 3,
      activityComplete: false, xpAwarded: 0, memoryUpdates: [], detectedSkills: [], remainingSkills: [],
    },
  }
}
