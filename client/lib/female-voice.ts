/**
 * Browser SpeechSynthesis is intentionally disabled for Miss Julie.
 *
 * Talkora has one teacher identity: Priya through the backend -> local
 * AI service -> Indic Parler TTS pipeline. Keeping this compatibility module
 * prevents old imports from crashing while ensuring a random browser voice can
 * never silently replace Miss Julie.
 */
export function findFemaleEnglishVoice(): SpeechSynthesisVoice | null {
  return null
}

export function speakAsMissJulie(_text: string, _rate = 1): false {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[Talkora] Browser SpeechSynthesis is disabled. Use voiceService.speak() for Priya.',
    )
  }
  return false
}
