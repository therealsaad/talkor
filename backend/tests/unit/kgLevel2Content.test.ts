import { expect, it } from '@jest/globals'
import {
  gradeLevel2Transcription,
  LEVEL2_LETTERS,
  LEVEL2_NARRATION,
} from '../../src/kg/level2-content'

it('keeps narration and accepted speech names specific to E–J', () => {
  expect(LEVEL2_LETTERS).toEqual(['E', 'F', 'G', 'H', 'I', 'J'])
  expect(Object.keys(LEVEL2_NARRATION)).toHaveLength(12)
  expect(gradeLevel2Transcription('E', 'E')).toBe('correct')
  expect(gradeLevel2Transcription('eff', 'F')).toBe('correct')
  expect(gradeLevel2Transcription('gee', 'G')).toBe('correct')
  expect(gradeLevel2Transcription('haitch', 'H')).toBe('correct')
  expect(gradeLevel2Transcription('eye', 'I')).toBe('correct')
  expect(gradeLevel2Transcription('jay', 'J')).toBe('correct')
  expect(gradeLevel2Transcription('kay', 'E')).toBe('incorrect')
  expect(gradeLevel2Transcription('', 'E')).toBe('unclear')
  expect(gradeLevel2Transcription('E', 'E', true)).toBe('unclear')
})
