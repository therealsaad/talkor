/**
 * Builds ONE Azure SSML document that switches voice per language segment.
 *
 * A mixed Hindi/English reply ("... इसे [cat] कहते हैं। बोलो, [cat]!") is a single
 * TTS request with several <voice> elements, not several requests stitched
 * together. That keeps latency at one network round trip, leaves no gaps
 * between pieces and gives the English target word a real English voice.
 *
 * Pure and dependency-free so it can be unit tested without Azure credentials.
 */

export type SsmlLocale = 'en-IN' | 'hi-IN' | 'mr-IN'
export type SsmlSegment = { text: string; locale: SsmlLocale }
export type SsmlVoiceMap = Record<SsmlLocale, string>

/** Same defaults as chooseTalkoraBilingualVoice(); override per deployment, not per request. */
export function resolveSsmlVoices(env: Record<string, string | undefined>): SsmlVoiceMap {
  return {
    'en-IN': env.AZURE_SPEECH_VOICE?.trim() || 'en-IN-NeerjaNeural',
    'hi-IN': env.AZURE_HI_SPEECH_VOICE?.trim() || 'hi-IN-SwaraNeural',
    'mr-IN': env.AZURE_MR_SPEECH_VOICE?.trim() || 'mr-IN-AarohiNeural',
  }
}

export function escapeSsmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const MAX_TOTAL_CHARS = 320
const MAX_SEGMENTS = 12
const SAFE_PROSODY = /^[+-]?\d{1,3}%$/

export function buildMultiVoiceSsml(
  segments: SsmlSegment[],
  options: { voices: SsmlVoiceMap; rate: string; pitch: string },
): string {
  if (!Array.isArray(segments) || segments.length === 0) throw new Error('At least one voice segment is required')
  if (segments.length > MAX_SEGMENTS) throw new Error('Too many voice segments')
  if (!SAFE_PROSODY.test(options.rate) || !SAFE_PROSODY.test(options.pitch)) throw new Error('Invalid prosody value')

  let total = 0
  const voices = segments.map((segment) => {
    const text = segment.text.replace(/\s+/g, ' ').trim()
    if (!text) throw new Error('Voice segment text is empty')
    const voice = options.voices[segment.locale]
    if (!voice) throw new Error(`No voice configured for ${segment.locale}`)
    total += text.length
    return `<voice name="${escapeSsmlText(voice)}"><prosody rate="${options.rate}" pitch="${options.pitch}">${escapeSsmlText(text)}</prosody></voice>`
  })
  if (total > MAX_TOTAL_CHARS) throw new Error('Voice text is too long')

  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${segments[0].locale}">${voices.join('')}</speak>`
}
