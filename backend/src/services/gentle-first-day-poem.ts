import { createHash } from 'node:crypto'
import type { AIStructuredResponse } from '../types'
import type { LessonTeachingContext } from './lesson-teaching-context'
import { normalizeFirstDayPoemRecognition } from './first-day-evidence'

/** A version-scoped, server-owned aid for Class 1 poem pairs.
 * STT words are not acoustic pronunciation scores. Credit each distinct word
 * once per microphone turn; never claim independent full-line recitation.
 */
export type GentlePoemState = {
  version: 1
  contentHash: string
  recognizedLines: number[]
}

const pairWords: Record<string, {
  words: readonly [string, string]
  patterns: readonly [RegExp, RegExp]
}> = {
  'poem-pair-1': { words: ['skip', 'run'], patterns: [/\bskipp?(?:ing)?\b/, /\brunn?(?:ing)?\b/] },
  'poem-pair-2': { words: ['school', 'walk'], patterns: [/\bschool\b/, /\bwalk(?:ing)?\b/] },
  'poem-pair-3': { words: ['grin', 'bell'], patterns: [/\b(?:grin|smil(?:e|ing))\b/, /\b(?:bell|ring|rings|ringing)\b/] },
  'poem-pair-4': { words: ['jump', 'play'], patterns: [/\bjump(?:ing)?\b/, /\bplay(?:ing)?\b/] },
  'poem-pair-5': { words: ['grade one', 'hurray'], patterns: [/\bgrade\s+(?:one|1)\b/, /\b(?:hurray|hooray)\b/] },
}

const nonAnswer = /[?？]|\b(?:what|why|how|help|repeat|again|meaning|explain|don't|dont|didn't|not|never|can't|cannot|no\s+idea|please\s+say|ignore|award|skip\s+the\s+lesson)\b|क्या|काय|म्हणजे|नाही|नहीं|मदद|समजत|मतलब|समझा/u

function validState(value: GentlePoemState | undefined, expected: string): number[] {
  if (value?.version !== 1 || value.contentHash !== expected || !Array.isArray(value.recognizedLines)) return []
  if (value.recognizedLines.length > 2 || value.recognizedLines.some(x => x !== 0 && x !== 1)) return []
  return [...new Set(value.recognizedLines)].sort()
}

export type GentlePoemObservation = {
  state: GentlePoemState
  kind: 'new-word' | 'repeated-word' | 'unclear'
  recognizedWord?: string
  pairWords: readonly [string, string]
  nextWord: string
  completedWithSupport: boolean
}

/** Only the authenticated, DB-authorized current poem pair determines what
 * the child may receive credit for. No user-supplied word bank or grade rules.
 */
export function observeGentlePoem(input: {
  context?: LessonTeachingContext
  transcript: string
  previous?: GentlePoemState
  inputMode?: 'MIC' | 'TEXT' | 'OPTION'
}): GentlePoemObservation | undefined {
  const context = input.context
  if (context?.mode !== 'RECITE' || context.modelLines.length !== 2 ||
      context.activityKey !== 'class1-l01-v4-' + context.sceneKey ||
      input.inputMode !== 'MIC') return undefined
  const pair = pairWords[context.sceneKey]
  if (!pair) return undefined
  const contentHash = createHash('sha256').update(JSON.stringify([
    context.activityKey, context.revision, context.modelLines, context.vocabulary,
  ])).digest('hex')
  const recognizedLines = validState(input.previous, contentHash)
  const said = normalizeFirstDayPoemRecognition(input.transcript).trim()
  const clear = said.length > 0 && said.length <= 100 && said.split(/\s+/).length <= 8 &&
    !nonAnswer.test(said) && /^[a-z0-9'’.,!\s-]+$/i.test(said)
  // Disconnected "skip run" is not two separately demonstrated words.
  // Complete two-line speech is handled by the original independent gate.
  const matched = clear ? pair.patterns.flatMap((pattern, index) => pattern.test(said) ? [index] : []) : []
  const index = matched.length === 1 ? matched[0] : -1
  const isNew = index >= 0 && !recognizedLines.includes(index)
  const updated = isNew ? [...recognizedLines, index].sort() : recognizedLines
  const nextIndex = updated.includes(0) ? 1 : 0
  return {
    state: { version: 1, contentHash, recognizedLines: updated },
    kind: index < 0 ? 'unclear' : isNew ? 'new-word' : 'repeated-word',
    recognizedWord: index >= 0 ? pair.words[index] : undefined,
    pairWords: pair.words,
    nextWord: pair.words[nextIndex],
    completedWithSupport: isNew && updated.length === 2,
  }
}

/** Short deterministic wording for recognized words. No Qwen turn needed.
 * This only coaches: Node still decides mastery and signed Azure ACK.
 */
export function gentlePoemTeacherResponse(
  observed: GentlePoemObservation,
  language: 'English' | 'Hindi' | 'Marathi',
): AIStructuredResponse | undefined {
  if (observed.kind === 'unclear') return undefined
  const word = observed.recognizedWord!
  const messages = observed.completedWithSupport
    ? { English: 'Wonderful! You said ' + observed.pairWords.join(' and ') + '! Great trying!',
        Hindi: 'बहुत अच्छे! तुमने दोनों शब्द बोले। शाबाश!',
        Marathi: 'खूप छान! तू दोन्ही शब्द म्हटलेस. शाब्बास!' }
    : observed.kind === 'repeated-word'
      ? { English: 'Yes, ' + word + '! You know that one.',
          Hindi: 'हाँ, ' + word + '! बहुत अच्छे।',
          Marathi: 'हो, ' + word + '! छान!' }
      : { English: 'Great! I heard ' + word + '!',
          Hindi: 'शाबाश! ' + word + ' सही बोला।',
          Marathi: 'छान! ' + word + ' बरोबर बोललास.' }
  return {
    message: messages[language],
    emotion: observed.completedWithSupport ? 'celebrating' : 'encouraging',
    responseQuality: observed.completedWithSupport ? 'ADEQUATE' : 'PARTIAL',
    corrections: [], hint: null,
    followUpQuestion: observed.completedWithSupport ? null : 'Now say: ' + observed.nextWord + '.',
    memoryUpdates: [], xpAwarded: 0,
    teachingAction: observed.completedWithSupport ? 'ASK_FOLLOW_UP' : 'MODEL_SENTENCE',
    shouldRetry: !observed.completedWithSupport,
    hintLevel: 1, activityComplete: false,
    detectedSkills: [], remainingSkills: [],
  }
}
