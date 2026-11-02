import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { createFixedLineCache } from './fixed-line-cache'
import { safeKGFeedback, type KGFeedbackInput } from './kg-feedback.service'

/**
 * Turns a persisted KG feedback sentence into audio with as little waiting as possible.
 *
 * The wording and the voice are NOT decided here. safeKGFeedback() writes the sentence and
 * AzureVoiceProvider.synthesizeUncached() voices it exactly as before (including its Hindi/Marathi
 * explanation + English practice voice split). This module only adds speed:
 *
 * - A sentence that safeKGFeedback() itself would write for this turn is a fixed, reviewed line.
 *   Its audio is kept in a small in-memory cache, so the second child who needs "great job, say cat"
 *   gets it without waiting on Azure. Concurrent requests for one line share a single Azure call.
 * - Anything else (a Qwen sentence, which can quote the child's words) is spoken once and never kept.
 *
 * It never decides a verdict, a receipt or progress.
 */

export type KGFeedbackLocale = 'en-IN' | 'hi-IN' | 'mr-IN'
export type KGFeedbackAudioTurn = Pick<KGFeedbackInput, 'letter' | 'mode' | 'outcome' | 'noSpeech'> & {
  /** The language the stored sentence was written for (the attempt's stable feedback language). */
  languageCode?: KGFeedbackLocale
}

export type KGFeedbackAudio = { audio: Buffer; contentType: string; source: 'cache' | 'azure' }

type SpeechProvider = {
  synthesizeUncached(text: string, options?: { language?: KGFeedbackLocale }): Promise<{ audio: Buffer; contentType: string }>
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()
const MIN_CACHEABLE_BYTES = 256

/** True only when `text` is exactly a sentence safeKGFeedback() writes for this turn. Qwen text never matches. */
export function isFixedFeedbackLine(text: string, turn: KGFeedbackAudioTurn): boolean {
  const wanted = normalize(text)
  if (!wanted) return false
  return normalize(safeKGFeedback({ ...turn })) === wanted
}

/** The language hint is part of the key because it changes which voices Azure uses. */
export function feedbackCacheKey(text: string, language: KGFeedbackLocale | undefined): string {
  return `${language ?? 'default'}\u0000${normalize(text)}`
}

const audioCache = createFixedLineCache<{ audio: Buffer; contentType: string }>({ maxItems: 160 })

const defaultProvider = (): SpeechProvider => new AzureVoiceProvider()

function speak(provider: SpeechProvider, text: string, language: KGFeedbackLocale | undefined) {
  // Same call shape the route used before, so voice selection is unchanged.
  return language ? provider.synthesizeUncached(text, { language }) : provider.synthesizeUncached(text)
}

export const KGFeedbackAudioService = {
  /** Resolves to null when Azure fails, so the caller can use its Priya fallback. */
  async synthesize(text: string, turn: KGFeedbackAudioTurn, provider: SpeechProvider = defaultProvider()): Promise<KGFeedbackAudio | null> {
    if (!isFixedFeedbackLine(text, turn)) {
      try {
        return { ...(await speak(provider, text, turn.languageCode)), source: 'azure' }
      } catch {
        return null
      }
    }
    const key = feedbackCacheKey(text, turn.languageCode)
    const hit = audioCache.peek(key)
    if (hit) return { ...hit, source: 'cache' }
    const created = await audioCache.getOrCreate(key, async () => {
      const spoken = await speak(provider, text, turn.languageCode)
      return spoken.audio.length >= MIN_CACHEABLE_BYTES ? spoken : null
    })
    return created ? { ...created, source: 'azure' } : null
  },

  /**
   * Starts voicing a fixed line right now, without waiting for it. Called as soon as an attempt is graded so
   * synthesis overlaps the response trip to the browser; the browser's follow-up audio request then finds the
   * audio ready or shares the in-flight Azure call. A Qwen sentence is ignored, so personalised text is never
   * synthesized twice or kept.
   */
  warm(text: string, turn: KGFeedbackAudioTurn, provider?: SpeechProvider): void {
    if (!isFixedFeedbackLine(text, turn)) return
    void this.synthesize(text, turn, provider).catch(() => undefined)
  },

  /** Every fixed line a KG child can hear, de-duplicated by what is actually spoken. */
  fixedLines(): Array<{ text: string; turn: KGFeedbackAudioTurn }> {
    const letters: KGFeedbackAudioTurn['letter'][] = ['A', 'B', 'C', 'D']
    const turns: Array<Pick<KGFeedbackAudioTurn, 'mode' | 'outcome' | 'noSpeech'>> = [
      { mode: 'speak', outcome: 'correct' },
      { mode: 'speak', outcome: 'supported' },
      { mode: 'speak', outcome: 'unclear' },
      { mode: 'speak', outcome: 'incorrect' },
      { mode: 'speak', outcome: 'unclear', noSpeech: true },
      { mode: 'touch', outcome: 'correct' },
      { mode: 'touch', outcome: 'supported' },
      { mode: 'touch', outcome: 'incorrect' },
    ]
    const languages: Array<KGFeedbackLocale | undefined> = [undefined, 'hi-IN', 'mr-IN']
    const seen = new Map<string, { text: string; turn: KGFeedbackAudioTurn }>()
    for (const letter of letters) {
      for (const turn of turns) {
        for (const languageCode of languages) {
          const full: KGFeedbackAudioTurn = { ...turn, letter, languageCode }
          const text = normalize(safeKGFeedback({ ...full }))
          seen.set(feedbackCacheKey(text, languageCode), { text, turn: full })
        }
      }
    }
    return [...seen.values()]
  },

  /** Warms the cache in the background so a child's first turn is already a hit. Never throws. */
  async prewarm(options: { concurrency?: number; provider?: SpeechProvider } = {}): Promise<{ warmed: number; failed: number }> {
    const provider = options.provider ?? defaultProvider()
    const lines = this.fixedLines().filter((line) => !audioCache.peek(feedbackCacheKey(line.text, line.turn.languageCode)))
    const workers = Math.max(1, Math.min(6, options.concurrency ?? 3))
    let warmed = 0
    let failed = 0
    let next = 0
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < lines.length) {
        const line = lines[next++]
        const result = await this.synthesize(line.text, line.turn, provider)
        if (result) warmed += 1
        else failed += 1
      }
    }))
    return { warmed, failed }
  },

  clearCacheForTests: () => audioCache.clear(),
  cacheSize: () => audioCache.size(),
}
