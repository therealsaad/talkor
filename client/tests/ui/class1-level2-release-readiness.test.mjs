import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  auditClass1Level2, readClass1Level2Authoring,
} from '../../scripts/report-class1-level2-readiness.mjs'

test('every Balbharati 1.2–1.6 chapter has a native-language voice scaffold and 19 distinct numbered exercise checkpoints', () => {
  const result = auditClass1Level2(readClass1Level2Authoring())
  assert.deepEqual(result.errors, [])
  assert.equal(result.address, 'g01-l02')
  assert.equal(result.status, 'DRAFT_NOT_PUBLISHED')
  assert.equal(result.chaptersMapped, 5)
  assert.equal(result.originalVoiceModels, 5)
  assert.equal(result.numberedExercisesMapped, 19)
  assert.deepEqual(result.chapterExerciseCounts, {
    '1.2': 3, '1.3': 3, '1.4': 4, '1.5': 3, '1.6': 6,
  })
  assert.equal(result.studentPlayable, false)
  assert.equal(result.hostedNarrationVerified, false)
  assert.equal(result.supervisedStudentAcceptance, false)
})

test('the audit rejects missing, duplicate or out-of-order exercises before a misleading coverage claim', () => {
  const input = readClass1Level2Authoring()
  input.exercises = input.exercises.filter(x => !(x.chapter === '1.6' && x.number === 6))
  input.exercises.push({ ...input.exercises.find(x => x.chapter === '1.2'), number: 2 })
  const result = auditClass1Level2(input)
  assert.ok(result.errors.includes('MISSING_OR_DUPLICATE_NUMBERED_EXERCISES:1.2'))
  assert.ok(result.errors.includes('MISSING_OR_DUPLICATE_NUMBERED_EXERCISES:1.6'))
})

test('the audit rejects one edited scene that pretends an unreviewed lesson is student-playable', () => {
  const input = readClass1Level2Authoring()
  input.scenes[0] = { ...input.scenes[0], studentPlayable: true, reviewed: true }
  const result = auditClass1Level2(input)
  assert.ok(result.errors.includes('EDITORIAL_SCENE_NOT_APPROVED_FOR_STUDENTS:1.2'))
  assert.equal(result.studentPlayable, false)
})

test('the audit rejects missing Marathi teaching support, wrong pages and unverified curriculum status', () => {
  const input = readClass1Level2Authoring()
  input.steps[2] = { ...input.steps[2], hintMr: '' }
  input.chapters[4] = { ...input.chapters[4], page: 25 }
  input.config.studentPlayable = true
  const result = auditClass1Level2(input)
  assert.ok(result.errors.includes('MISSING_NATIVE_LANGUAGE_OR_EVIDENCE:1.4'))
  assert.ok(result.errors.includes('PRINTED_PAGE_MISMATCH:1.6'))
  assert.ok(result.errors.includes('DRAFT_PUBLICATION_BOUNDARY_BROKEN'))
})
