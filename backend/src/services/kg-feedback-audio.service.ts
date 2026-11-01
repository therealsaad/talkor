import { AzureVoiceProvider } from '../providers/voice/AzureVoiceProvider'
import { createFixedLineCache } from './fixed-line-cache'
import {
  guidedFeedbackSegments,
  segmentsToText,
  type KGFeedbackLetter,
  type KGFeedbackOutcome,
  type KGFeedbackSegment,
  type KGLocale,
} from '../kg/kg-bilingual-feedback'

/**
 * Turns a persisted KG feedback sentence into audio as fast as possible.
 *
 * - A reviewed, server-written line (praise, "say cat", the "billi" reply, silence
 *   prompts) is re-derived into per-language segments, spoken by one Azure request
 *   that switches voice per segment, and kept in a small in-memory cache. The
 *   second child who needs the same line gets audio without waiting on Azure.
 * - Anything else (a Qwen coaching sentence) is spoken once, uncached, exactly as
 *   before. Personalised text is never stored.
 *
 * Nothing here decides a verdict or progress; it only voices text the backend
 * already chose and persisted.
 */

export type KGFeedbackAudioTurn = {
  letter: KGFeedbackLetter
  mode: 'speak' | 'touch'
  outcome: KGFeedbackOutcome
  noSpeech?: boolean
  languageCode?: KGLocale
}

export type KGFeedbackAudio = {
  audio: Buffer
  contentType: string
  source: 'cache' | 'azure'
  multiVoice: boolean
}

type SegmentProvider = {
  synthesizeUncached(text: string, options?: { language?: KGLocale }): Promise<{ audio: Buffer; contentType: string }>
  synthesizeSegmentsUncached(segments: KGFeedbackSegment[]): Promise<{ audio: Buffer; contentType: string }>
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

/** Smoothing may have chosen a different language than this attempt's own detection, so try each. */
const LANGUAGE_FALLBACKS: Array<KGLocale | undefined> = [undefined, 'hi-IN', 'mr-IN']

/**
 * Finds the reviewed segments whose joined text equals the stored sentence.
 * Returns null when the sentence is not one of the reviewed lines (i.e. it came from Qwen).
 */
export function matchGuidedSegments(text: string, turn: KGFeedbackAudioTurn): KGFeedbackSegment[] | null {
  const wanted = normalize(text)
  if (!wanted) return null
  for (const languageCode of [turn.languageCode, ...LANGUAGE_FALLBACKS]) {
    const segments = guidedFeedbackSegments({ ...turn, languageCode })
    if (normalize(segmentsToText(segments)) === wanted) return segments
  }
  return null
}

export function segmentsCacheKey(segments: KGFeedbackSegment[]): string {
  return JSON.stringify(segments.map((segment) => [segment.locale, segment.text]))
}

const audioCache = createFixedLineCache<{ audio: Buffer; contentType: string }>({ maxItems: 160 })

async function synthesizeSegments(segments: KGFeedbackSegment[], provider: SegmentProvider) {
  if (segments.length === 1) {
    const only = segments[0]
    return only.locale === 'en-IN'
      ? provider.synthesizeUncached(only.text)
      : provider.synthesizeUncached(only.text, { language: only.locale })
  }
  return provider.synthesizeSegmentsUncached(segments)
}

const defaultProvider = (): SegmentProvider => new AzureVoiceProvider() as unknown as SegmentProvider

export const KGFeedbackAudioService = {
  /** Resolves to null when Azure fails, so the caller can use its Priya fallback. */
  async synthesize(text: string, turn: KGFeedbackAudioTurn, provider: SegmentProvider = defaultProvider()): Promise<KGFeedbackAudio | null> {
    const segments = matchGuidedSegments(text, turn)
    if (!segments) {
      try {
        const spoken = turn.languageCode && turn.languageCode !== 'en-IN'
          ? await provider.synthesizeUncached(text, { language: turn.languageCode })
          : await provider.synthesizeUncached(text)
        return { ...spoken, source: 'azure', multiVoice: false }
      } catch {
        return null
      }
    }

    const key = segmentsCacheKey(segments)
    const hit = audioCache.peek(key)
    if (hit) return { ...hit, source: 'cache', multiVoice: segments.length > 1 }
    const created = await audioCache.getOrCreate(key, async () => {
      const spoken = await synthesizeSegments(segments, provider)
      return spoken.audio.length >= 256 ? spoken : null
    })
    return created ? { ...created, source: 'azure', multiVoice: segments.length > 1 } : null
  },

  /**
   * Starts voicing a reviewed line right now, without waiting for it. Called the moment an attempt is graded so
   * synthesis overlaps the response trip to the browser; the browser's follow-up audio request then finds the
   * audio finished or in flight (concurrent requests share one Azure call). Anything that is not a reviewed
   * line (a Qwen sentence) is ignored, so personalised text is never synthesized twice or kept.
   */
  warm(text: string, turn: KGFeedbackAudioTurn, provider?: SegmentProvider): void {
    if (!matchGuidedSegments(text, turn)) return
    void this.synthesize(text, turn, provider).catch(() => undefined)
  },

  /** Every reviewed line a KG child can hear, de-duplicated by what is actually spoken. */
  guidedLines(): KGFeedbackSegment[][] {
    const letters: KGFeedbackLetter[] = ['A', 'B', 'C', 'D']
    const turns: Array<Omit<KGFeedbackAudioTurn, 'letter' | 'languageCode'>> = [
      { mode: 'speak', outcome: 'correct' },
      { mode: 'speak', outcome: 'supported' },
      { mode: 'speak', outcome: 'unclear' },
      { mode: 'speak', outcome: 'incorrect' },
      { mode: 'speak', outcome: 'unclear', noSpeech: true },
      { mode: 'touch', outcome: 'correct' },
      { mode: 'touch', outcome: 'supported' },
      { mode: 'touch', outcome: 'incorrect' },
    ]
    const languages: Array<KGLocale | undefined> = [undefined, 'hi-IN', 'mr-IN']
    const seen = new Map<string, KGFeedbackSegment[]>()
    for (const letter of letters) {
      for (const turn of turns) {
        for (const languageCode of languages) {
          const segments = guidedFeedbackSegments({ ...turn, letter, languageCode })
          seen.set(segmentsCacheKey(segments), segments)
        }
      }
    }
    return [...seen.values()]
  },

  /** Warms the cache in the background so a child's first turn is already a cache hit. Never throws. */
  async prewarm(options: { concurrency?: number; provider?: SegmentProvider } = {}): Promise<{ warmed: number; failed: number }> {
    const provider = options.provider ?? defaultProvider()
    const lines = this.guidedLines().filter((segments) => !audioCache.peek(segmentsCacheKey(segments)))
    const workers = Math.max(1, Math.min(6, options.concurrency ?? 3))
    let warmed = 0
    let failed = 0
    let next = 0
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < lines.length) {
        const segments = lines[next++]
        const result = await audioCache.getOrCreate(segmentsCacheKey(segments), async () => {
          const spoken = await synthesizeSegments(segments, provider)
          return spoken.audio.length >= 256 ? spoken : null
        })
        if (result) warmed += 1
        else failed += 1
      }
    }))
    return { warmed, failed }
  },

  clearCacheForTests: () => audioCache.clear(),
  cacheSize: () => audioCache.size(),
}
