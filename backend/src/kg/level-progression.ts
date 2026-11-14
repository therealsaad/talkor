import { gradeLevel2Transcription, LEVEL2_LETTERS, type Level2Letter } from './level2-content'
import { gradeLevel3Transcription, LEVEL3_LETTERS, type Level3Letter } from './level3-content'
import { gradeLevel4Transcription, LEVEL4_LETTERS, type Level4Letter } from './level4-content'
import { gradeLevel5Transcription, LEVEL5_LETTERS, type Level5Letter } from './level5-content'

export const KG_LEVEL_LETTERS = {
  1: ['A', 'B', 'C', 'D'],
  2: LEVEL2_LETTERS,
  3: LEVEL3_LETTERS,
  4: LEVEL4_LETTERS,
  5: LEVEL5_LETTERS,
} as const

export type KGLevelNumber = keyof typeof KG_LEVEL_LETTERS
export type KGLevelStatus = 'locked' | 'available' | 'in_progress' | 'completed'
export type KGExtendedLetter = (typeof KG_LEVEL_LETTERS)[2][number] |
  (typeof KG_LEVEL_LETTERS)[3][number] |
  (typeof KG_LEVEL_LETTERS)[4][number] |
  (typeof KG_LEVEL_LETTERS)[5][number]

export function nextIncompletePlayableKGLevel(
  playableLevels: readonly KGLevelNumber[],
  completedLevels: readonly number[],
): KGLevelNumber | null {
  return [...playableLevels].sort((a, b) => a - b).find((level) => !completedLevels.includes(level)) ?? null
}

export function kgLevelStatus(input: {
  level: KGLevelNumber
  playable: boolean
  unlocked: boolean
  completed: boolean
  current: boolean
  currentIndex: number
}): KGLevelStatus {
  if (!input.playable) return 'locked'
  if (input.completed) return 'completed'
  if (!input.unlocked || !input.current) return 'locked'
  if (input.current && input.currentIndex > 0) return 'in_progress'
  return 'available'
}

export function isKGLevelNumber(value: unknown): value is KGLevelNumber {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5
}

export function lettersForLevel(level: KGLevelNumber): readonly string[] {
  return KG_LEVEL_LETTERS[level]
}

export function gradeKGLevelLetter(level: Exclude<KGLevelNumber, 1>, transcript: string, letter: string, uncertain: boolean) {
  switch (level) {
    case 2:
      return gradeLevel2Transcription(transcript, letter as Level2Letter, uncertain)
    case 3:
      return gradeLevel3Transcription(transcript, letter as Level3Letter, uncertain)
    case 4:
      return gradeLevel4Transcription(transcript, letter as Level4Letter, uncertain)
    case 5:
      return gradeLevel5Transcription(transcript, letter as Level5Letter, uncertain)
  }
}
