import type { AIStructuredResponse } from '../types'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS } from '../curriculum/class1-first-day-poem'
import { poemEvidence } from './first-day-evidence'

type Language = 'English' | 'Hindi' | 'Marathi'

function comparable(value: string): string {
  return value.normalize('NFKC').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isFirstDayPoemScene(sceneKey: string): boolean {
  return FIRST_DAY_POEM_STEPS.some(step => step.key === sceneKey)
}

/** The existing Python adapter can fall through to "Can you say at?" when it
 * does not recognize a poem title. Reject any such reply even when a stale
 * Python deployment is still running on the developer's port 8002.
 *
 * The scene key comes from the server-authorized MongoDB activity, and only
 * that scene can decide what Miss Julie models. This is teacher wording, not
 * student mastery or an XP/lesson publication decision.
 */
export function guardFirstDayPoemTurn(
  sceneKey: string,
  transcript: string,
  language: Language,
  ai?: AIStructuredResponse,
): AIStructuredResponse {
  const step = FIRST_DAY_POEM_STEPS.find(candidate => candidate.key === sceneKey)
  if (!step) throw new Error('FIRST_DAY_POEM_SCENE_NOT_AUTHORED')

  const full = sceneKey === 'poem-full'
  const lines = FIRST_DAY_POEM_LINES.slice(step.start, step.end)
  const model = lines.join('\n')
  const answered = poemEvidence(sceneKey, transcript).length > 0
  // Never overwhelm an uncertain six-year-old with ten spoken lines again.
  // The full authorized poem remains available through Hear these lines, and
  // independent full-recital evidence is still evaluated against all lines.
  const retryModel = full && !answered ? lines.slice(0, 2).join('\n') : model

  // Never treat a transcript's word "at" as the syllabus target. An AI reply
  // must include the complete correct model, not merely one word in its prose.
  const aiModel = comparable(ai?.modelSentence || '')
  const expectedModel = comparable(model)
  const aiText = [ai?.message, ai?.followUpQuestion].filter(Boolean).join(' ')
  const legacyHijack = /\b(?:can you say at|say the word at|short english word|say at\b|word at\b)/i.test(aiText)
  const pairAnchors: Record<string, string[]> = {
    'poem-pair-1': ['skip', 'run'],
    'poem-pair-2': ['school', 'walk'],
    'poem-pair-3': ['grin', 'smile', 'bell'],
    'poem-pair-4': ['jump', 'play'],
    'poem-pair-5': ['grade', 'hurray', 'hooray'],
    'poem-full': ['poem', 'school', 'skip', 'run'],
  }
  const anchored = (pairAnchors[sceneKey] || [])
    .some(word => new RegExp('\\b' + word + '\\b', 'i').test(ai?.message || ''))
  const aligned = Boolean(ai && !legacyHijack && anchored &&
    aiModel.includes(expectedModel) && ai.message.trim().length >= 8 &&
    // The full-poem AI text may be very long even when no evidence exists.
    // Use the short reviewed fallback for uncertain finale answers.
    (!full || answered))

  const help = full ? '' : language === 'Hindi' ? step.hintHi
    : language === 'Marathi' ? step.hintMr : ''
  // Gentle prompts reflect the same supported option the server already
  // credits. Keep the exact authored English model for optional practice,
  // but never demand perfect full-line repetition from a beginner.
  const preface = full
    ? language === 'Hindi' ? 'कविता को पाँच छोटे भागों में सीखते हैं। हर भाग से एक शब्द बोलो, या पूरी पंक्तियाँ बोलो।'
      : language === 'Marathi' ? 'कविता पाच छोट्या भागांत शिकूया. प्रत्येक भागातून एक शब्द बोल, किंवा पूर्ण ओळी म्हण.'
        : 'Let us learn the poem in five little parts. Try one word from each part, or say the full lines.'
    : language === 'Hindi' ? 'इन दो पंक्तियों को सुनो। एक शब्द बोलो, या दोनों पंक्तियाँ बोलने की कोशिश करो।'
      : language === 'Marathi' ? 'या दोन ओळी ऐक. एक शब्द बोल, किंवा दोन्ही ओळी म्हणायचा प्रयत्न कर.'
        : 'Listen to these two poem lines. You can say one word, or try both lines.'

  const message = aligned
    ? ai!.message
    : answered
      ? language === 'Hindi' ? 'बहुत अच्छी कोशिश! तुमने दोनों पंक्तियाँ बोलीं।'
        : language === 'Marathi' ? 'छान प्रयत्न! तू दोन्ही ओळी म्हटल्यास.'
          : 'Nice work! You tried both poem lines.'
      : [preface, help, retryModel].filter(Boolean).join('\n')

  return {
    message,
    emotion: answered ? 'encouraging' : 'modeling',
    responseQuality: answered ? 'ADEQUATE' : 'PARTIAL',
    corrections: [],
    hint: null,
    followUpQuestion: answered ? null
      : full ? 'Let us try the first part again. Say skip or run, or try both lines.'
        : 'Your turn! Say one word from these lines, or try both lines.',
    memoryUpdates: [],
    xpAwarded: 0,
    teachingAction: answered ? 'ASK_FOLLOW_UP' : 'MODEL_SENTENCE',
    modelSentence: retryModel,
    activityComplete: false,
    shouldRetry: !answered,
    hintLevel: answered ? 0 : 1,
    detectedSkills: [],
    remainingSkills: [],
  }
}
