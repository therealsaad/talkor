import { LEVEL3_LETTERS, LEVEL3_WORDS, LEVEL3_NARRATION, gradeLevel3Transcription, type Level3Letter } from './level3-content'
import { LEVEL4_LETTERS, LEVEL4_WORDS, LEVEL4_NARRATION, gradeLevel4Transcription, type Level4Letter } from './level4-content'
import { LEVEL5_LETTERS, LEVEL5_NARRATION, gradeLevel5Transcription, type Level5Letter } from './level5-content'

/**
 * The only KG continuation lessons offered to opted-in student pilots.
 * Their staff preview workspaces remain editorial drafts. Adding a new
 * playable level requires explicit content, grading and media review here.
 * There is NEVER a fallback lesson that grants progress to a placeholder.
 */
export const KG_CONTINUATION_LEVELS = [3, 4, 5] as const
export type KGContinuationLevel = (typeof KG_CONTINUATION_LEVELS)[number]
export function isKGContinuationLevel(value: number): value is KGContinuationLevel {
  return KG_CONTINUATION_LEVELS.some((level) => level === value)
}

const words5 = { W: 'wolf', X: 'xylophone', Y: 'yak', Z: 'zebra' } as const

export function continuationLesson(level: KGContinuationLevel) {
  if (level === 3) return { level, title: 'Letters K to P', letters: LEVEL3_LETTERS,
    words: LEVEL3_WORDS, narration: LEVEL3_NARRATION as Readonly<Record<string, string>>,
    grade: (raw: string, letter: string, uncertain: boolean) =>
      gradeLevel3Transcription(raw, letter as Level3Letter, uncertain) }
  if (level === 4) return { level, title: 'Letters Q to V', letters: LEVEL4_LETTERS,
    words: LEVEL4_WORDS, narration: LEVEL4_NARRATION as Readonly<Record<string, string>>,
    grade: (raw: string, letter: string, uncertain: boolean) =>
      gradeLevel4Transcription(raw, letter as Level4Letter, uncertain) }
  return { level, title: 'Letters W to Z', letters: LEVEL5_LETTERS,
    words: words5, narration: LEVEL5_NARRATION as Readonly<Record<string, string>>,
    grade: (raw: string, letter: string, uncertain: boolean) =>
      gradeLevel5Transcription(raw, letter as Level5Letter, uncertain) }
}

export function getKGContinuationNarration(level: KGContinuationLevel, id: string): string | null {
  const lesson = continuationLesson(level)
  if (!Object.prototype.hasOwnProperty.call(lesson.narration, id)) return null
  // Level 5's staff preview pictures use wolf/yak rather than whale/yo-yo.
  // Keep the pilot's spoken word aligned with the displayed picture.
  if (level === 5 && id === 'word-w') return 'Wolf.'
  if (level === 5 && id === 'word-y') return 'Yak.'
  return lesson.narration[id] || null
}
