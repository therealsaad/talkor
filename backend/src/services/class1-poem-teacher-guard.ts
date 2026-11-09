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

  // Never treat a transcript's word "at" as the syllabus target. An AI reply
  // must include the complete correct model, not merely one word in its prose.
  const aiModel = comparable(ai?.modelSentence || '')
  const expectedModel = comparable(model)
  const aiText = [ai?.message, ai?.followUpQuestion].filter(Boolean).join(' ')
  const legacyHijack = /\b(?:can you say at|say the word at|short english word|say at together)\b/i.test(aiText)
  const aligned = Boolean(ai && !legacyHijack && aiModel.includes(expectedModel) &&
    ai.message.trim().length >= 8)

  const help = language === 'Hindi' ? step.hintHi
    : language === 'Marathi' ? step.hintMr : ''
  const preface = full
    ? language === 'Hindi' ? 'फिर से पूरी कविता सुनो, फिर धीरे बोलो।'
      : language === 'Marathi' ? 'पूर्ण कविता पुन्हा ऐक, मग सावकाश म्हण.'
        : 'Let us listen to the whole poem again, then recite it.'
    : language === 'Hindi' ? 'इन दोनों पंक्तियों को ध्यान से सुनो, फिर साथ बोलो।'
      : language === 'Marathi' ? 'या दोन्ही ओळी ऐक, मग सोबत म्हण.'
        : 'Listen to BOTH poem lines, then say them with me.'

  const message = aligned
    ? ai!.message
    : answered
      ? language === 'Hindi' ? 'बहुत अच्छी कोशिश! तुमने दोनों पंक्तियाँ बोलीं।'
        : language === 'Marathi' ? 'छान प्रयत्न! तू दोन्ही ओळी म्हटल्यास.'
          : 'Nice work! You tried both poem lines.'
      : [preface, help, model].filter(Boolean).join('\n')

  return {
    message,
    emotion: answered ? 'encouraging' : 'modeling',
    responseQuality: answered ? 'ADEQUATE' : 'PARTIAL',
    corrections: [],
    hint: null,
    followUpQuestion: answered ? null
      : full ? 'Now try the whole poem, two lines at a time.'
        : 'Your turn! Say BOTH lines slowly.',
    memoryUpdates: [],
    xpAwarded: 0,
    teachingAction: answered ? 'ASK_FOLLOW_UP' : 'MODEL_SENTENCE',
    modelSentence: model,
    activityComplete: false,
    shouldRetry: !answered,
    hintLevel: answered ? 0 : 1,
    detectedSkills: [],
    remainingSkills: [],
  }
}
