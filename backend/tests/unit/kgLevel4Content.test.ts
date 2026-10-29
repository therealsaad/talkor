import { expect, it } from '@jest/globals'
import {
  gradeLevel4Transcription,
  LEVEL4_LETTERS,
  LEVEL4_NARRATION,
} from '../../src/kg/level4-content'

it('restricts staff-preview narration and grading to Q–V', () => {
  expect(LEVEL4_LETTERS).toEqual(['Q', 'R', 'S', 'T', 'U', 'V'])
  expect(Object.keys(LEVEL4_NARRATION)).toHaveLength(18)
  expect(gradeLevel4Transcription('cue', 'Q')).toBe('correct')
  expect(gradeLevel4Transcription('ar', 'R')).toBe('correct')
  expect(gradeLevel4Transcription('ess', 'S')).toBe('correct')
  expect(gradeLevel4Transcription('tee', 'T')).toBe('correct')
  expect(gradeLevel4Transcription('you', 'U')).toBe('correct')
  expect(gradeLevel4Transcription('vee', 'V')).toBe('correct')
  expect(gradeLevel4Transcription('dog', 'V')).toBe('incorrect')
  expect(gradeLevel4Transcription('', 'Q')).toBe('unclear')
  expect(gradeLevel4Transcription('cue', 'Q', true)).toBe('unclear')
})
