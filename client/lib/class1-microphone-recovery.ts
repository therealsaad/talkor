/** Class 1 voice-first recovery only; never changes grading or progress. */
export const CLASS1_AUTO_SILENCE_RETRIES = 1

/** Distinguish an unrecognized/empty voice clip from network, permission,
 * provider and teacher-audio failures. Those must remain explicit errors. */
export function isClass1NoSpeechError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /(?:no speech was detected|i could not hear enough|i could not hear that clearly|please speak for a little longer)/i.test(error.message)
}

/** A bounded one-time automatic re-listen. More silence waits for an explicit
 * child/teacher microphone tap, rather than making an infinite recording loop. */
export function class1SilenceRecovery(previousMisses: number): {
  misses: number; autoListen: boolean; feedback: string
} {
  const misses = Math.min(3, Math.max(0, Math.floor(previousMisses) || 0) + 1)
  return {
    misses,
    autoListen: misses <= CLASS1_AUTO_SILENCE_RETRIES,
    feedback: misses <= CLASS1_AUTO_SILENCE_RETRIES
      ? 'I did not catch your voice. Take your time. I will listen once more.'
      : 'I am still here! Tap the microphone when you are ready to say the line.',
  }
}
