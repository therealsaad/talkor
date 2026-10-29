import { ApiError } from '../utils/ApiError'
import { KGSpeechService } from '../services/kg-speech.service'
import { isSupportedVoiceAudioMimeType } from '../schemas/voice.schema'
import { PythonVoiceProvider } from '../providers/voice/PythonVoiceProvider'
import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'

const KG_LEVEL1_VOICE_ID = 'talkora-priya-v6-indian-kids-teacher'
const KG_VOICE_LANGUAGE = 'en-IN'

export const KG_VOWEL_TARGETS = [
  { activityId: 'say-a-apple', letter: 'A', word: 'apple' },
  { activityId: 'say-e-elephant', letter: 'E', word: 'elephant' },
  { activityId: 'say-i-igloo', letter: 'I', word: 'igloo' },
  { activityId: 'say-o-orange', letter: 'O', word: 'orange' },
  { activityId: 'say-u-umbrella', letter: 'U', word: 'umbrella' },
] as const

export type KGVowelOutcome = 'correct' | 'incorrect' | 'unclear' | 'silence'

const VOWEL_LETTER_SPEECH: Record<string, string> = { A: 'ay', E: 'ee', I: 'eye', O: 'oh', U: 'you' }

export type KGVowelSpeechLine = 'intro' | 'prompt' | 'replay' | 'correct' | 'incorrect' | 'unclear' | 'silence' | 'complete' | 'microphone-error' | 'provider-error'

export function kgVowelSpeechScript(line: unknown, activityId: unknown): string {
  if (line === 'intro' && activityId === 'introduction') return 'Hello, friend! Welcome to Vowel Garden in Rainbow Valley. Listen to Miss Julie, look at each picture, and say the letter and word with me. Ready? Let’s begin!'
  if (line === 'complete' && activityId === 'completion') return 'You did it! You learned A for apple, E for elephant, I for igloo, O for orange, and U for umbrella. Wonderful work, friend! See you next time in Rainbow Valley!'
  const target = KG_VOWEL_TARGETS.find((item) => item.activityId === activityId)
  if (target && line === 'microphone-error') return 'I can’t hear you yet. Please ask your teacher or grown-up to turn on the microphone, then try again.'
  if (target && line === 'provider-error') return 'I couldn’t check your answer just now. That’s not your fault. Let’s try again in a little while, or ask your teacher for help.'
  if (!target || !['prompt', 'replay', 'correct', 'incorrect', 'unclear', 'silence'].includes(String(line))) {
    throw ApiError.badRequest('Unknown Vowel Garden speech line')
  }
  const phrase = `${target.letter} for ${target.word}`
  if (line === 'prompt') return `Look at the picture. ${phrase}. Now you say: ${phrase}.`
  if (line === 'replay') return `Let’s listen once more. ${phrase}. Now you try: ${phrase}.`
  if (line === 'correct') return `You said ${phrase}! Wonderful speaking!`
  if (line === 'incorrect') return `Nice try! The phrase is ${phrase}. Listen: ${phrase}. You can try again when you’re ready.`
  if (line === 'silence') return `Take your time. When you’re ready, say ${phrase} after me.`
  return `I didn’t hear the whole phrase clearly. Listen once more, then try saying ${phrase}.`
}
/** Exact server-side target check. Raw transcripts are never returned or stored. */
export function gradeKGVowelTranscript(transcript: string, word: string, uncertain = false, confidence?: number): KGVowelOutcome {
  const normalized = transcript.toLocaleLowerCase('en-US').trim().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized || uncertain || (typeof confidence === 'number' && (!Number.isFinite(confidence) || confidence < 0.5))) return 'unclear'
  const target = KG_VOWEL_TARGETS.find((item) => item.word === word)
  if (!target) return 'incorrect'
  const acceptedPhrases = [
    `${target.letter.toLocaleLowerCase('en-US')} for ${target.word}`,
    `${VOWEL_LETTER_SPEECH[target.letter]} for ${target.word}`,
  ]
  return acceptedPhrases.includes(normalized) ? 'correct' : 'incorrect'
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
    try {
      const result = await new PythonVoiceProvider().synthesizeWithVoice(text, KG_LEVEL1_VOICE_ID, KG_VOICE_LANGUAGE)
      if (!result.available || !result.audioBase64) throw ApiError.provider('Level 1 Priya voice is unavailable')
      return { audio: Buffer.from(result.audioBase64, 'base64'), contentType: result.contentType || 'audio/wav' }
    } catch {
      // Keep lessons audible when the local Level 1 voice service is offline.
      // Azure Neerja is Talkora’s standard Miss Julie voice; browser/system TTS is never used.
      try {
        return await new AzureVoiceProvider().synthesizeUncached(text)
      } catch {
        throw ApiError.provider('Miss Julie voice is unavailable')
      }
    }
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
    return { outcome: gradeKGVowelTranscript(String(stt.transcript || '').slice(0, 240), target.word, uncertain, confidence) }
  },
}
