/**
 * Deterministic, server-owned KG feedback split into per-language segments.
 *
 * Why segments: a Hindi/Marathi coaching sentence should be spoken by a Hindi
 * or Marathi voice, while the English target word ("cat") must be spoken by the
 * English voice so the child hears the pronunciation they are meant to copy.
 *
 * This module has NO runtime imports on purpose. It is pure, instant (no I/O)
 * and unit-testable without credentials or a database.
 *
 * Verdicts are never decided here. The backend grades the answer first; this
 * only chooses wording for a verdict that already exists.
 */

export type KGLocale = 'en-IN' | 'hi-IN' | 'mr-IN'
export type KGFeedbackLetter = 'A' | 'B' | 'C' | 'D'
export type KGFeedbackOutcome = 'correct' | 'incorrect' | 'unclear' | 'supported'

export type KGFeedbackSegment = { text: string; locale: KGLocale }

export type KGFeedbackSegmentInput = {
  letter: KGFeedbackLetter
  mode: 'speak' | 'touch'
  outcome: KGFeedbackOutcome
  noSpeech?: boolean
  /** Sarvam's server-reported locale. Undefined means "not detected". */
  languageCode?: KGLocale
}

const ENGLISH_WORD: Record<KGFeedbackLetter, string> = { A: 'apple', B: 'ball', C: 'cat', D: 'dog' }
const ARTICLE: Record<KGFeedbackLetter, string> = { A: 'an', B: 'a', C: 'a', D: 'a' }
const HINDI_WORD: Record<KGFeedbackLetter, string> = { A: 'सेब', B: 'गेंद', C: 'बिल्ली', D: 'कुत्ता' }
const MARATHI_WORD: Record<KGFeedbackLetter, string> = { A: 'सफरचंद', B: 'चेंडू', C: 'मांजर', D: 'कुत्रा' }
/** Roman spelling for the English-voice Hinglish line when no language was detected. */
const ROMAN_NATIVE_WORD: Record<KGFeedbackLetter, string> = { A: 'seb', B: 'gend', C: 'billi', D: 'kutta' }

export function englishWordFor(letter: KGFeedbackLetter): string {
  return ENGLISH_WORD[letter]
}

/** Join adjacent segments that share a locale so each voice change is a real one. */
export function mergeAdjacentSegments(segments: KGFeedbackSegment[]): KGFeedbackSegment[] {
  const merged: KGFeedbackSegment[] = []
  for (const segment of segments) {
    const text = segment.text.replace(/\s+/g, ' ').trim()
    if (!text) continue
    const last = merged[merged.length - 1]
    if (last && last.locale === segment.locale) last.text = `${last.text} ${text}`
    else merged.push({ text, locale: segment.locale })
  }
  return merged
}

/** Plain text for the on-screen caption and for what the server persists. */
export function segmentsToText(segments: KGFeedbackSegment[]): string {
  return segments.map((segment) => segment.text).join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Only an actual spoken attempt that the backend could not accept is worth a
 * Qwen call. Correct answers, translations ("billi"), silence, picture taps and
 * the picture helper all have a known, reviewed line and must never wait on an LLM.
 */
export function needsQwenCoaching(input: Pick<KGFeedbackSegmentInput, 'mode' | 'outcome' | 'noSpeech'>): boolean {
  if (input.noSpeech) return false
  if (input.mode !== 'speak') return false
  return input.outcome === 'incorrect' || input.outcome === 'unclear'
}

/** Prefer this attempt's detected language, then the child's last known one. */
export function resolveFeedbackLanguage(current: KGLocale | undefined, lastKnown: KGLocale | undefined): KGLocale | undefined {
  return current ?? lastKnown
}

export function guidedFeedbackSegments(input: KGFeedbackSegmentInput): KGFeedbackSegment[] {
  const word = ENGLISH_WORD[input.letter]
  const letter = input.letter
  const lang: KGLocale = input.languageCode === 'hi-IN' || input.languageCode === 'mr-IN' ? input.languageCode : 'en-IN'
  const en = (text: string): KGFeedbackSegment => ({ text, locale: 'en-IN' })
  const native = (text: string): KGFeedbackSegment => ({ text, locale: lang })

  let segments: KGFeedbackSegment[]

  if (input.noSpeech) {
    if (lang === 'hi-IN') segments = [native('मैं सुन रही हूँ बेटा। आराम से बोलो,'), en(`${word}!`)]
    else if (lang === 'mr-IN') segments = [native('मी ऐकतेय बेटा. शांतपणे बोला,'), en(`${word}!`)]
    else segments = [en(`I'm listening, superstar. Take your time! Say ${word} when you're ready.`)]
  } else if (input.outcome === 'correct') {
    const praise = en(`Yay! You did it! ${letter} is for ${word}. Wonderful!`)
    if (lang === 'hi-IN') segments = [native('शाबाश बेटा!'), praise]
    else if (lang === 'mr-IN') segments = [native('शाब्बास बेटा!'), praise]
    else segments = [praise]
  } else if (input.outcome === 'supported' && input.mode === 'touch') {
    // Picture helper: comprehension is shown, so the lesson moves on.
    segments = [en(`Great! You found the word! In English we say ${word}. Let’s keep learning!`)]
  } else if (input.outcome === 'supported') {
    // The child said the Hindi/Marathi word. Praise it, then model the English word.
    if (lang === 'hi-IN') {
      segments = [native(`अच्छा बेटा! ${HINDI_WORD[letter]}!`), native('पर अंग्रेज़ी में हम इसे'), en(word),
        native('कहते हैं। बोलो,'), en(`${word}!`)]
    } else if (lang === 'mr-IN') {
      segments = [native(`छान बेटा! ${MARATHI_WORD[letter]}!`), native('पण इंग्रजीत आपण याला'), en(word),
        native('म्हणतो. बोला,'), en(`${word}!`)]
    } else {
      segments = [en(`Achha bete! ${capitalize(ROMAN_NATIVE_WORD[letter])}! Par English mein hum ise ${word} kehte hain. Bolo, ${word}!`)]
    }
  } else if (input.outcome === 'unclear') {
    if (lang === 'hi-IN') segments = [native('कोई बात नहीं बेटा! चलो साथ में बोलें,'), en(`${word}!`)]
    else if (lang === 'mr-IN') segments = [native('काही हरकत नाही बेटा! चला एकत्र म्हणूया,'), en(`${word}!`)]
    else segments = [en(`Let's say ${word} together. Take your time. Koi baat nahi!`)]
  } else if (input.mode === 'speak') {
    if (lang === 'hi-IN') segments = [native('ध्यान से सुनो।'), en(`${letter} for ${word}.`), native('अब बोलो,'), en(`${word}!`)]
    else if (lang === 'mr-IN') segments = [native('नीट ऐका.'), en(`${letter} for ${word}.`), native('आता म्हणा,'), en(`${word}!`)]
    else segments = [en(`Listen slowly: ${letter} for ${word}. ${letter} se ${word}! Now say ${word}.`)]
  } else {
    if (lang === 'hi-IN') segments = [native('तस्वीरें देखो। ढूँढो,'), en(`${word}.`)]
    else if (lang === 'mr-IN') segments = [native('चित्रे बघा. शोधा,'), en(`${word}.`)]
    else segments = [en(`Look at the pictures. Find ${word}. ${word} ki tasveer chuno!`)]
  }

  return mergeAdjacentSegments(segments)
}

/** Safe "nice try" line when Qwen answered a wrong or unclear spoken attempt too slowly. */
export function modelWordSegments(letter: KGFeedbackLetter, languageCode?: KGLocale): KGFeedbackSegment[] {
  const word = ENGLISH_WORD[letter]
  if (languageCode === 'hi-IN') return mergeAdjacentSegments([{ text: 'अच्छी कोशिश बेटा! सुनो,', locale: 'hi-IN' }, { text: `${word}.`, locale: 'en-IN' }, { text: 'अब तुम बोलो,', locale: 'hi-IN' }, { text: `${word}!`, locale: 'en-IN' }])
  if (languageCode === 'mr-IN') return mergeAdjacentSegments([{ text: 'छान प्रयत्न बेटा! ऐका,', locale: 'mr-IN' }, { text: `${word}.`, locale: 'en-IN' }, { text: 'आता तुम्ही म्हणा,', locale: 'mr-IN' }, { text: `${word}!`, locale: 'en-IN' }])
  return [{ text: `Nice try! In English, we call that ${ARTICLE[letter]} ${word}. Listen: ${word}. Can you say ${word}?`, locale: 'en-IN' }]
}

function capitalize(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value
}
