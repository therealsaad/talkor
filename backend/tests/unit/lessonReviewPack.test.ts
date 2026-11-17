import fixture from '../../src/curriculum/review-packs/g01-l02.json'
import { lessonReviewPackSchema } from '../../src/curriculum/lesson-review-pack'
import { lessonTeachingContextSchema } from '../../src/services/lesson-teaching-context'

const copy = (): any => JSON.parse(JSON.stringify(fixture))
function rejects(change: (pack: any) => void) {
  const input = copy()
  change(input)
  expect(lessonReviewPackSchema.safeParse(input).success).toBe(false)
}

test('the review pack preserves five English models, nineteen educator checkpoints and six supplementary activities', () => {
  const pack = lessonReviewPackSchema.parse(fixture)
  expect(pack.activities).toHaveLength(30)
  expect(pack.activities.filter(item => item.kind === 'MODEL_PRACTICE')).toHaveLength(5)
  expect(pack.activities.filter(item => item.kind === 'EDUCATOR_CHECKPOINT')).toHaveLength(19)
  expect(pack.activities.filter(item => item.kind === 'SUPPLEMENTARY_PRACTICE')).toHaveLength(6)
  expect(pack.chapters.map(item => item.numberedExercisesExpected)).toEqual([3, 3, 4, 3, 6])
  expect(pack.studentPlayable).toBe(false)
  expect(pack.source.edition).toBeNull()
  expect(pack.source.reviewStatus).toBe('UNVERIFIED_FOR_RELEASE')
  expect(pack.gates.publication).toBe('LOCKED')
  for (const item of pack.activities.filter(item => item.kind === 'MODEL_PRACTICE')) {
    if (item.kind !== 'MODEL_PRACTICE') throw new Error('Expected a model')
    expect(item.teaching.hints.en.length).toBeGreaterThan(0)
    expect(item.teaching.hints.hi.length).toBeGreaterThan(0)
    expect(item.teaching.hints.mr.length).toBeGreaterThan(0)
    expect(item.teaching.expectedEvidence.length).toBeGreaterThan(0)
  }
})

test.each([
  (p: any) => { p.status = 'PUBLISHED' }, (p: any) => { p.studentPlayable = true },
  (p: any) => { p.syllabusVerified = true }, (p: any) => { p.gates.educator = 'APPROVED' },
  (p: any) => { p.gates.language = 'APPROVED' }, (p: any) => { p.gates.media = 'APPROVED' },
  (p: any) => { p.gates.runtime = 'ENABLED' }, (p: any) => { p.gates.physicalVoice = 'VERIFIED' },
  (p: any) => { p.gates.publication = 'PUBLISHED' }, (p: any) => { p.activities[0].approved = true },
  (p: any) => { p.source.reviewStatus = 'VERIFIED' }, (p: any) => { p.xpAwarded = 999 },
  (p: any) => { p.studentName = 'Do not accept learner data' },
  (p: any) => { p.activities[0].gradingRules = ['trust the model'] },
])('a review file cannot grant release, grading, progress or personal-data authority (%#)', change => rejects(change))

test.each([
  [-1, 2, 'g01-l02'], [11, 2, 'g11-l02'], [1, 0, 'g01-l00'], [1, 11, 'g01-l11'],
  [true, 2, 'g01-l02'], [2, 2, 'g01-l02'], [1, 3, 'g01-l02'],
])('rejects noncanonical grade/level/address %s/%s/%s', (grade, level, lessonKey) => {
  rejects(p => Object.assign(p, { grade, level, lessonKey }))
})

test('a serialized review pack cannot enter the live Class 1 teaching contract', () => {
  expect(lessonTeachingContextSchema.safeParse(fixture).success).toBe(false)
  expect(lessonTeachingContextSchema.safeParse({ ...fixture, lessonKey: 'g01-l01' }).success).toBe(false)
})

test('numbered textbook work needs separate human review and cannot be converted into a model', () => {
  rejects(p => { p.activities[11].teaching = p.activities[0].teaching })
  rejects(p => { p.activities[11].kind = 'MODEL_PRACTICE' })
  rejects(p => { p.activities[11].evidence.kind = 'PRACTICE_REVIEW_REQUIRED' })
  rejects(p => { p.activities[11].exerciseNumber = null })
})

test('missing, duplicated, cross-chapter or renumbered exercises cannot fake complete coverage', () => {
  rejects(p => { p.activities.pop() })
  rejects(p => { p.activities[12].id = p.activities[11].id })
  rejects(p => { p.activities[12].exerciseNumber = p.activities[11].exerciseNumber })
  rejects(p => { p.activities[11].chapter = '1.99' })
  rejects(p => { p.chapters[1].code = p.chapters[0].code })
})

test('a model needs bounded exact line identities, complete language support and actual whole-word targets', () => {
  rejects(p => { p.activities[0].teaching.lineIds[0] = 'another-activity:model-1' })
  rejects(p => { p.activities[0].teaching.modelLines.push('Another line without an ID') })
  rejects(p => { p.activities[0].teaching.targets = ['a']; p.activities[0].teaching.modelLines = ['cat'] })
  rejects(p => { p.activities[0].teaching.hints.mr = '' })
  rejects(p => { p.activities[0].teaching.hints.hi = null })
  rejects(p => { p.activities[0].teaching.modelLines[0] = 'x'.repeat(161) })
  rejects(p => { p.activities[0].teaching.modelLines[0] = 'I can clap.\u0000' })
  rejects(p => { p.activities[0].teaching.teacherQuestion = 'x'.repeat(1401) })
})

test('source references and authoring fingerprints cannot be forged into unsafe paths or duplicates', () => {
  rejects(p => { p.source.reference = 'https://example.invalid/not-the-school-book.pdf' })
  rejects(p => { p.source.reference = 'not-a-url' })
  rejects(p => { p.source.reference = 'https://user:password@ebooks.ebalbharati.in/pdfs/103050001.pdf' })
  rejects(p => { p.authoringSources[0].path = 'client/../../private.ts' })
  rejects(p => { p.authoringSources[1].path = p.authoringSources[0].path })
  rejects(p => { p.authoringSources[0].sha256 = 'not-a-hash' })
})

test('oversized review input is rejected before it becomes an unbounded prompt transport', () => {
  rejects(p => {
    const source = p.activities[5]
    for (let i = 0; i < 100; i++) p.activities.push({ ...source, id: 'extra-' + i,
      prompt: 'x'.repeat(1400), evidence: { ...source.evidence, description: 'x'.repeat(700) } })
  })
})
