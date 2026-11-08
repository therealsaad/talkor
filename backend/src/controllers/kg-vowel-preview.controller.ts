import { ApiError } from '../utils/ApiError'
import { KGSpeechService } from '../services/kg-speech.service'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'

export const KG_VOWEL_TARGETS = [
  { activityId: 'vowel-a', letter: 'A' },
  { activityId: 'vowel-e', letter: 'E' },
  { activityId: 'vowel-i', letter: 'I' },
  { activityId: 'vowel-o', letter: 'O' },
  { activityId: 'vowel-u', letter: 'U' },
] as const

export type KGVowelOutcome = 'correct' | 'incorrect' | 'unclear' | 'silence'

const VOWEL_SPOKEN: Record<string, string> = { A: 'short a', E: 'short e', I: 'short i', O: 'short o', U: 'short u' }

export type KGVowelSpeechLine = 'intro' | 'prompt' | 'replay' | 'correct' | 'incorrect' | 'unclear' | 'silence' | 'complete' | 'microphone-error' | 'provider-error'

export function kgVowelSpeechScript(line: unknown, activityId: unknown): string {
  if (line === 'intro' && activityId === 'introduction') return 'Hello, friend! A vowel is a speech sound we make with an open mouth, while the air flows freely. A, E, I, O, and U are the five vowel letters. Each one has its own short sound. Listen to Miss Julie, feel how your mouth moves, then copy each sound.'
  if (line === 'complete' && activityId === 'completion') return 'Wonderful work! You learned five short vowel sounds: A, E, I, O, and U. You listened carefully and made each sound. See you next time in Rainbow Valley!'
  const target = KG_VOWEL_TARGETS.find((item) => item.activityId === activityId)
  if (target && line === 'microphone-error') return 'I can’t hear you yet. Please ask your teacher or grown-up to turn on the microphone, then try again.'
  if (target && line === 'provider-error') return 'I couldn’t check your answer just now. That’s not your fault. Let’s try again in a little while, or ask your teacher for help.'
  if (!target || !['prompt', 'replay', 'correct', 'incorrect', 'unclear', 'silence'].includes(String(line))) {
    throw ApiError.badRequest('Unknown Vowel Garden speech line')
  }
  const sound = '[[' + target.letter + ']]'
  if (line === 'prompt') return 'The vowel ' + target.letter + ' makes the ' + VOWEL_SPOKEN[target.letter] + ' sound. Listen: ' + sound + '. Now copy the sound: ' + sound + '. Your turn—say that sound.'
  if (line === 'replay') return 'Listen once more: ' + sound + '. Now make the same sound.'
  if (line === 'correct') return 'Wonderful! You made the sound ' + sound + '.'
  if (line === 'incorrect') return 'Nice try! Listen to the sound ' + sound + ' once more, then copy it.'
  if (line === 'silence') return 'Take your time. Listen: ' + sound + '. When you are ready, make the same sound.'
  return 'I did not hear that sound clearly. Listen once more: ' + sound + '. Then try it.'
}
/** Accept only a short isolated vowel sound; no word-picture phrases are targets. */
export function gradeKGVowelTranscript(transcript: string, letter: string, uncertain = false, confidence?: number): KGVowelOutcome {
  const normalized = transcript.toLocaleLowerCase('en-US').normalize('NFC').trim()
    .replace(/[\/()[\]]/g, '').replace(/[^a-zæɛɪɒʌɑ\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized || uncertain || (typeof confidence === 'number' && (!Number.isFinite(confidence) || confidence < 0.45))) return 'unclear'
  const target = KG_VOWEL_TARGETS.find((item) => item.letter.toLowerCase() === letter.toLowerCase())
  if (!target) return 'incorrect'
  const accepted: Record<string, string[]> = {
    A: ['a', 'ah', 'ae', 'æ'], E: ['e', 'eh', 'ɛ'], I: ['i', 'ih', 'ɪ'], O: ['o', 'oh', 'aw', 'ah', 'ɒ', 'ɑ'], U: ['u', 'uh', 'ʌ'],
  }
  return accepted[target.letter].includes(normalized) ? 'correct' : 'incorrect'
}
function validateAudio(input: Record<string, unknown>) {
  if (typeof input.durationMs !== 'number' || !Number.isInteger(input.durationMs) || input.durationMs < 250 || input.durationMs > 12_000) {
    throw ApiError.badRequest('Recording duration must be 0.25–12 seconds')
  }
  if (input.noSpeech === true) {
    if (input.audioBase64 !== undefined || input.mimeType !== undefined) throw ApiError.badRequest('Silence reports cannot include audio data')
    return null
  }
  const mimeType = typeof input.mimeType === 'string' ? input.mimeType : ''
  const audioBase64 = input.audioBase64
  if (!isSupportedVoiceAudioMimeType(mimeType) || typeof audioBase64 !== 'string' || audioBase64.length < 128 || audioBase64.length > 8_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
    throw ApiError.badRequest('A valid short microphone recording is required')
  }
  return { audioBase64, mimeType, durationMs: input.durationMs }
}

export const KGVowelPreviewController = {
  async speech(line: unknown, activityId: unknown) {
    const text = kgVowelSpeechScript(line, activityId)
    // Use one configured Miss Julie voice for every Level 6 line; do not switch providers between cards.
    const provider = new AzureVoiceProvider()
    return text.includes('[[') ? provider.synthesizeKGVowelUncached(text) : provider.synthesizeUncached(text)
  },
  async attempt(input: unknown): Promise<{ outcome: KGVowelOutcome }> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw ApiError.badRequest('A valid vowel practice request is required')
    const body = input as Record<string, unknown>
    if (Object.keys(body).some((key) => !['activityId', 'audioBase64', 'mimeType', 'durationMs', 'noSpeech'].includes(key))) {
      throw ApiError.badRequest('Unexpected vowel practice fields')
    }
    const target = KG_VOWEL_TARGETS.find((item) => item.activityId === body.activityId)
    if (!target) throw ApiError.badRequest('Unknown vowel activity')
    const audio = validateAudio(body)
    if (!audio) return { outcome: 'silence' }
    const stt = await KGSpeechService.transcribe(audio)
    if (!stt.available) throw ApiError.provider('Speech recognition is temporarily unavailable')
    const confidence = 'confidence' in stt && typeof stt.confidence === 'number' ? stt.confidence : undefined
    const uncertain = 'uncertain' in stt && stt.uncertain === true
    return { outcome: gradeKGVowelTranscript(String(stt.transcript || '').slice(0, 240), target.letter, uncertain, confidence) }
  },
}
