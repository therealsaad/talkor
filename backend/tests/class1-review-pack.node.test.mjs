import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildClass1Level2ReviewPack, auditReviewPack, reviewPackPath,
  authoringFingerprint } from '../scripts/class1-level2-review-pack.mjs'

const clone = value => JSON.parse(JSON.stringify(value))
const script = fileURLToPath(new URL('../scripts/class1-level2-review-pack.mjs', import.meta.url))

test('the checked-in pack is the exact current authoring projection, not a second hand-maintained curriculum', () => {
  const saved = JSON.parse(readFileSync(reviewPackPath, 'utf8'))
  const built = buildClass1Level2ReviewPack()
  assert.deepEqual(saved, built)
  const report = auditReviewPack(saved)
  assert.equal(report.activities, 30)
  assert.equal(report.modelPractices, 5)
  assert.equal(report.educatorCheckpoints, 19)
  assert.equal(report.supplementaryPractices, 6)
  assert.equal(report.educatorApprovalClaimed, false)
  assert.equal(report.sourceEditionVerifiedByThisTool, false)
  assert.equal(report.runtimeIntegrated, false)
  assert.equal(report.studentPlayable, false)
  assert.equal(saved.authoringSources.length, 5)
  for (const activity of saved.activities.filter(item => item.kind === 'MODEL_PRACTICE')) {
    assert.ok(activity.teaching.hints.en && activity.teaching.hints.hi && activity.teaching.hints.mr)
    assert.ok(activity.teaching.expectedEvidence && activity.evidence.description)
    assert.equal(activity.approved, false)
  }
})

test('edited prompts, changed source digests and fabricated extra activities fail even if structurally well formed', () => {
  const original = buildClass1Level2ReviewPack()
  const prompt = clone(original)
  prompt.activities[0].prompt = 'Different teaching text needs an authoring review.'
  assert.throws(() => auditReviewPack(prompt), /differs/)
  const hash = clone(original)
  hash.authoringSources[0].sha256 = '0'.repeat(64)
  assert.throws(() => auditReviewPack(hash), /differs/)
  const extra = clone(original)
  extra.activities.push({ ...extra.activities[5], id: 'unmapped-supplementary-task' })
  assert.throws(() => auditReviewPack(extra), /differs/)
})

test('reducing both the exercise count and its declaration cannot silently remove a real source exercise', () => {
  const edited = buildClass1Level2ReviewPack()
  edited.activities = edited.activities.filter(item => !(item.chapter === '1.6' && item.exerciseNumber === 6))
  edited.chapters.find(item => item.code === '1.6').numberedExercisesExpected = 5
  assert.throws(() => auditReviewPack(edited), /differs/)
})

test('no release approval may be forged in an otherwise current snapshot', () => {
  const edited = buildClass1Level2ReviewPack()
  edited.gates.educator = 'APPROVED'
  assert.throws(() => auditReviewPack(edited))
})

test('source fingerprints survive Windows line endings while preserving real wording changes', () => {
  const text = 'Listen to the current line.\nThen try it.\n'
  assert.equal(authoringFingerprint(text), authoringFingerprint(text.replaceAll('\n', '\r\n')))
  assert.notEqual(authoringFingerprint(text), authoringFingerprint(text.replace('current', 'wrong')))
})

test('read-only CLI check reports pending gates and printing reproduces the exact source pack', () => {
  const checked = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' })
  assert.equal(checked.status, 0, checked.stderr)
  assert.equal(JSON.parse(checked.stdout).studentPlayable, false)
  const printed = spawnSync(process.execPath, [script, '--print'], { encoding: 'utf8' })
  assert.equal(printed.status, 0, printed.stderr)
  assert.deepEqual(JSON.parse(printed.stdout), buildClass1Level2ReviewPack())
})

for (const argument of ['--apply', '--publish', '--approved', '--mongodb-uri=synthetic.invalid', '--print --publish'])
  test('CLI refuses a mutation or unknown argument: ' + argument, () => {
    const before = readFileSync(reviewPackPath, 'utf8')
    const result = spawnSync(process.execPath, [script, argument], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Only|failed/)
    assert.equal(readFileSync(reviewPackPath, 'utf8'), before)
  })
