export const LEVEL4_LETTERS = ['Q', 'R', 'S', 'T', 'U', 'V'] as const
export type Level4Letter = typeof LEVEL4_LETTERS[number]
export type Level4Outcome = 'correct' | 'incorrect' | 'unclear'

export function createSubmissionGate(): () => boolean {
  let claimed = false
  return () => {
    if (claimed) return false
    claimed = true
    return true
  }
}

export function resolveLevel4Attempt(letter: Level4Letter, outcome: Level4Outcome) {
  if (outcome !== 'correct') return { letter, complete: false, retry: true }
  const index = LEVEL4_LETTERS.indexOf(letter)
  const next = LEVEL4_LETTERS[index + 1]
  return next ? { letter: next, complete: false, retry: false } : { letter, complete: true, retry: false }
}

export function canCompleteIntroVideo(
  video: { ended: boolean; duration: number; currentTime: number },
  maximumTime: number,
): boolean {
  if (!video.ended || !Number.isFinite(video.duration) || video.duration <= 0) return false
  const threshold = Math.max(0, video.duration - 1.5)
  return video.currentTime >= threshold && maximumTime >= threshold
}

export function microphoneFailureMessage(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Please allow microphone access so Miss Julie can hear you, then try again.'
  if (name === 'NotFoundError') return 'I could not find a microphone. Connect one, then try again.'
  if (name === 'NotReadableError' || name === 'AbortError') return 'The microphone is busy. Close another app using it, then try again.'
  if (name === 'NotSupportedError') return 'Please open the preview in a browser with microphone support.'
  return 'The microphone paused. Check it, then try again when you are ready.'
}
