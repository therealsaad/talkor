import type { MissJulieContext } from './AIProvider'

type SupportLanguage = 'English' | 'Hindi' | 'Marathi'

/** A transcript is not a language classifier: Hindi and Marathi share script.
 * Only explicit help requests or unmistakable school-child phrases change the
 * response language. Session preference, when available, takes priority over
 * older conversation turns. This does not change the English learning goal.
 */
function explicitSupportLanguage(text: string): SupportLanguage | null {
  const speech = text.slice(0, 300).toLowerCase()
  if (/मराठीत|मराठीमध्ये|मराठी\s*(?:बोला|शिकवा)|मला\s*(?:समजत|कळत|समजलं)\s*नाही|\b(?:marathit|marathimadhe|(?:explain|teach|speak)\s+(?:in\s+)?marathi|marathi\s+(?:please|mein))\b/i.test(speech)) return 'Marathi'
  if (/हिंदी\s*(?:में|बोलो|समझाओ)|हिन्दी\s*में|मुझे\s+समझ\s+नहीं|\b(?:(?:explain|teach|speak)\s+(?:in\s+)?hindi|hindi\s+(?:please|me|mein))\b/i.test(speech)) return 'Hindi'
  if (/\b(?:in english|english please)\b|अंग्रेजी\s*में|इंग्लिश\s*में/i.test(speech)) return 'English'
  return null
}

export function class1ExplanationLanguage(context: MissJulieContext): SupportLanguage {
  const fromSpeech = explicitSupportLanguage(context.studentMessage)
  if (fromSpeech) return fromSpeech

  const selected = context.preferredExplanationLanguage?.toLowerCase().trim()
  if (selected === 'hi' || selected === 'hindi') return 'Hindi'
  if (selected === 'mr' || selected === 'marathi') return 'Marathi'
  if (selected === 'en' || selected === 'english') return 'English'

  // Retain a recent spoken language request for the following turn; do not
  // turn a generic Devanagari utterance into a guess about the child's origin.
  for (const turn of (context.conversationHistory || []).slice(-4).reverse()) {
    const language = explicitSupportLanguage(turn)
    if (language) return language
  }
  return 'English'
}
