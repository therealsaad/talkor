import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  loadRegistry, auditObjectiveRelease, buildUnsignedTeacherReviewPacket,
} from './audit-objective-release.mjs'

const registry = loadRegistry()

test('never treats source-verified textbook chapters as teacher-approved live lessons', () => {
  const audit = auditObjectiveRelease(registry)
  assert.equal(audit.sourceRuntimeStatus, 'NOT_AUTHORIZED_FOR_STUDENTS')
  assert.equal(audit.releaseDecision, 'BLOCKED_REQUIRES_EXTERNAL_HUMAN_APPROVAL')
  assert.equal(audit.eligibleForStudents, false)
  assert.equal(audit.totalObjectiveCount, 84)
  assert.equal(audit.draftPendingCount, 84)
  assert.equal(audit.unexpectedReviewOrRevisionCount, 0)
  assert.deepEqual(audit.duplicateObjectiveIds, [])
  assert.deepEqual(audit.books.map(b => [b.objectiveCount, b.chapters.length]), [[40, 10], [44, 11]])
})

test('reports source-chapter-to-earliest-level ordering risks for both textbooks without inventing a fix', () => {
  const audit = auditObjectiveRelease(registry)
  assert.equal(audit.chronologyReviewFlagCount, 4)
  const bal = audit.books.find(book => book.trackId === 'ENGLISH_MEDIUM')
  assert.ok(bal)
  assert.deepEqual(bal.orderReviewFlags.map(v => [v.previousChapter, v.laterChapter]), [
    ['1.6', '1.7'],
  ])
  const meb = audit.books.find(book => book.trackId === 'NON_ENGLISH_MEDIUM')
  assert.ok(meb)
  assert.deepEqual(meb.orderReviewFlags.map(v => [v.previousChapter, v.laterChapter]), [
    ['1.3', '1.4'], ['1.5', '1.6'], ['1.7', '1.8'],
  ])
  assert.ok(meb.chapters.some(ch => ch.chapter === '1.11'))
  assert.ok(meb.chapters.some(ch => ch.chapter === '1.10'))
})

test('generates 84 unsigned review records without inventing reviewers, licenses or published IDs', () => {
  const packet = buildUnsignedTeacherReviewPacket(registry)
  assert.equal(packet.state, 'UNSIGNED_DRAFT_DO_NOT_PUBLISH')
  assert.equal(packet.rows.length, 84)
  assert.deepEqual([...new Set(packet.rows.map(r => r.objectiveId))].length, 84)
  assert.equal(packet.rows.filter(r => r.trackId === 'ENGLISH_MEDIUM').length, 40)
  assert.equal(packet.rows.filter(r => r.trackId === 'NON_ENGLISH_MEDIUM').length, 44)
  for (const row of packet.rows) {
    assert.ok(row.objectiveId)
    assert.equal(row.existingApprovedRevision, null)
    assert.equal(row.teacherReview.decision, null)
    assert.equal(row.teacherReview.authorizedReviewerRef, null)
    assert.equal(row.teacherReview.rightsPermissionRef, null)
    assert.equal(row.schoolTrackAuthorizationRef, null)
    assert.equal(row.approvedCanonicalLessonId, null)
    assert.equal(row.approvedCanonicalActivityId, null)
  }
})

test('does not silently authorize content even if someone changes JSON to claim approved status', () => {
  const changed = structuredClone(registry)
  changed.runtimeStatus = 'AUTHORIZED_FOR_STUDENTS'
  changed.books[0].objectives[0].reviewStatus = 'APPROVED'
  changed.books[0].objectives[0].approvedRevision = 'approved-unverified-1'
  const audit = auditObjectiveRelease(changed)
  assert.equal(audit.eligibleForStudents, false)
  assert.equal(audit.unexpectedReviewOrRevisionCount, 1)
  assert.equal(audit.draftPendingCount, 83)
  assert.equal(audit.sourceRuntimeStatus, 'AUTHORIZED_FOR_STUDENTS')
  assert.equal(buildUnsignedTeacherReviewPacket(changed).state, 'UNSIGNED_DRAFT_DO_NOT_PUBLISH')
})

test('detects book identity collisions in review source without generating fake remediation', () => {
  const changed = structuredClone(registry)
  changed.books[1].objectives[0].objectiveId = changed.books[0].objectives[0].objectiveId
  const audit = auditObjectiveRelease(changed)
  assert.deepEqual(audit.duplicateObjectiveIds, [changed.books[0].objectives[0].objectiveId])
  assert.equal(audit.eligibleForStudents, false)
})
