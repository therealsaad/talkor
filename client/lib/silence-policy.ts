/**
 * When should a recording stop? Pure and free of browser APIs so it can be unit tested.
 *
 * A child waits for this silence before Miss Julie can even start to think, so it is the first part of every
 * turn. The default window is long on purpose: young children pause inside a word and between words, and
 * cutting one off is worse than a short wait. The policy therefore shortens the window only after the child
 * has clearly been speaking for a while, and never below a safe floor.
 */

/** No configuration may make the recorder stop on a silence shorter than this. */
export const MIN_SILENCE_MS = 500
/** Voiced time the child must have produced before the shorter window is allowed. */
export const DEFAULT_QUICK_SPEECH_MS = 450

export type SilencePolicyInput = {
  now: number
  startedAt: number
  lastVoiceAt: number
  heardVoice: boolean
  /** Total time the child has been audibly speaking so far. */
  voicedMs: number
  /** Silence needed to stop when the child has said little (the cautious default). */
  silenceMs: number
  /** Shorter silence allowed once `quickSpeechMs` of speech has been heard. Omit to keep `silenceMs`. */
  silenceAfterSpeechMs?: number
  quickSpeechMs?: number
  minimumSpeechMs: number
  noSpeechTimeoutMs: number
}

/** Silence needed to end the recording right now. Never below the floor, never above the cautious window. */
export function silenceLimitMs(
  voicedMs: number,
  silenceMs: number,
  silenceAfterSpeechMs?: number,
  quickSpeechMs: number = DEFAULT_QUICK_SPEECH_MS,
): number {
  if (silenceAfterSpeechMs === undefined || !Number.isFinite(silenceAfterSpeechMs) || voicedMs < quickSpeechMs) return silenceMs
  return Math.min(silenceMs, Math.max(MIN_SILENCE_MS, silenceAfterSpeechMs))
}

export function shouldStopRecording(input: SilencePolicyInput): boolean {
  if (!input.heardVoice) return input.now - input.startedAt > input.noSpeechTimeoutMs
  if (input.now - input.startedAt < input.minimumSpeechMs) return false
  const limit = silenceLimitMs(input.voicedMs, input.silenceMs, input.silenceAfterSpeechMs, input.quickSpeechMs)
  return input.now - input.lastVoiceAt > limit
}

/** Reads a tunable silence value (for example from an env var); bad or missing input uses the fallback. */
export function parseSilenceMs(raw: string | undefined, fallback: number, ceiling: number): number {
  const parsed = Number(raw)
  if (!raw || !Number.isFinite(parsed)) return fallback
  return Math.min(ceiling, Math.max(MIN_SILENCE_MS, Math.round(parsed)))
}
