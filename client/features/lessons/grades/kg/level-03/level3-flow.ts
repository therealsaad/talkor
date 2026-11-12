export const LEVEL3_LETTERS = ['K', 'L', 'M', 'N', 'O', 'P'] as const
export type Letter = (typeof LEVEL3_LETTERS)[number]
export type Outcome = 'correct' | 'incorrect' | 'unclear'
export const LEVEL3_INTRO_COMPLETED_KEY = 'talkora:kg-level3-intro-completed'

export function canCompleteIntroVideo(
  video: { ended: boolean; duration: number; currentTime: number },
  maximumTime: number,
): boolean {
  if (!video.ended || !Number.isFinite(video.duration) || video.duration <= 0) return false
  const completionThreshold = Math.max(0, video.duration - 1.5)
  return video.currentTime >= completionThreshold && maximumTime >= completionThreshold
}

export function createSubmissionGate(): () => boolean {
  let claimed = false
  return () => {
    if (claimed) return false
    claimed = true
    return true
  }
}

export function resolveLevel3Attempt(letter: Letter, outcome: Outcome): {
  letter: Letter
  complete: boolean
  retry: boolean
} {
  if (outcome !== 'correct') return { letter, complete: false, retry: true }
  const index = LEVEL3_LETTERS.indexOf(letter)
  const next = LEVEL3_LETTERS[index + 1]
  return next ? { letter: next, complete: false, retry: false } : { letter, complete: true, retry: false }
}

export function microphoneFailureMessage(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error
    ? String(error.name)
    : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Please allow microphone access so Miss Julie can hear you, then tap Try again.'
  if (name === 'NotFoundError') return 'I could not find a microphone. Connect one, then tap Try again.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone is busy. Close another app using it, then try again.'
  if (name === 'NotSupportedError') return 'Please open the preview in a browser with microphone support.'
  if (name === 'TimeoutError') return 'Please choose Allow for the microphone, then tap Try again.'
  return 'The microphone paused. Check it, then try again when you are ready.'
}
