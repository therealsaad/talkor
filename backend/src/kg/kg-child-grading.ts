import { evaluateKGSpeech, isKGBilingualBridge, type Letter } from './alphabet-content'

/**
 * KG Level 1 is a word-identification activity, not a phoneme-level pronunciation exam.
 * Whisper's verbose_json segment flags are not calibrated scores for children's voices.
 * A clear matching transcript from a real recording can pass even if those flags are low.
 * Blank speech, unrelated words and ambiguous transcripts never pass.
 * The noSpeech/voice-activity guard is enforced by the controller BEFORE this function.
 */
export function gradeKGTranscription(input: {
  transcript: string
  letter: Letter
  uncertain?: boolean
  confidence?: number
}): 'correct' | 'incorrect' | 'unclear' | 'supported' {
  const lexical = evaluateKGSpeech(input.transcript, input.letter, 'word')
  if (lexical === 'correct') return 'correct'
  // A Hindi translation demonstrates comprehension but NOT English pronunciation mastery.
  if (isKGBilingualBridge(input.transcript, input.letter) && input.uncertain !== true &&
    (input.confidence === undefined || (Number.isFinite(input.confidence) && input.confidence >= 0.5))) return 'supported'
  if (input.uncertain === true || (typeof input.confidence === 'number' && (!Number.isFinite(input.confidence) || input.confidence < 0.5))) {
    return 'unclear'
  }
  return lexical
}
