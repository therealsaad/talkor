/** Reproducible teacher-review data, never an installer or publisher.
 * Reads literal authoring data through the existing AST audit; no TypeScript
 * evaluation, database, provider, credentials or external URL is accepted.
 */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { auditClass1Level2, readClass1Level2Authoring, readAuthoringLiteral,
  readAuthoringComposition } from '../../client/scripts/report-class1-level2-readiness.mjs'

const require = createRequire(import.meta.url)
const { lessonReviewPackSchema } = require('../dist/curriculum/lesson-review-pack.js')
export const reviewPackPath = new URL('../src/curriculum/review-packs/g01-l02.json', import.meta.url)
const root = new URL('../../', import.meta.url)
const paths = {
  outline: 'client/features/lessons/grades/class-01/balbharati-curriculum.ts',
  plan: 'client/features/lessons/grades/class-01/level-02/teaching-plan.ts',
  exercises: 'client/features/lessons/grades/class-01/level-02/exercise-checkpoints.ts',
  config: 'client/features/lessons/grades/class-01/level-02/config.ts',
  activities: 'client/features/lessons/grades/class-01/level-02/activities.ts',
}
const read = (key, name) => readAuthoringLiteral(new URL(paths[key], root), name)

export function authoringFingerprint(content) {
  return createHash('sha256').update(content.toString().replace(/\r\n/g, '\n')).digest('hex')
}

export function buildClass1Level2ReviewPack() {
  const authored = readClass1Level2Authoring()
  assert.deepEqual(auditClass1Level2(authored).errors, [], 'Existing Level 2 authoring audit must pass')
  assert.deepEqual(readAuthoringComposition(new URL(paths.activities, root), 'activities'), [
    '...class1DraftActivities(2)', '...CLASS1_LEVEL2_REVIEW_ACTIVITIES', '...CLASS1_L2_NUMBERED_EXERCISE_ACTIVITIES',
  ], 'Preview composition changed; update the review exporter before claiming complete coverage')
  const outline = read('outline', 'CLASS1_BALBHARATI_DRAFTS').find(item => item.level === 2)
  const source = read('plan', 'CLASS1_LEVEL2_SOURCE')
  const scenes = read('plan', 'CLASS1_LEVEL2_VOICE_SCENES')
  const reviews = read('plan', 'CLASS1_LEVEL2_REVIEW_ACTIVITIES')
  const config = read('config', 'config')
  assert(config.id === 'g01-l02' && config.grade === 1 && config.level === 2 &&
    config.learningPolicy.introRequired === true && config.learningPolicy.introMustComplete === true,
  'Canonical address and complete intro authoring requirements must remain intact')
  assert(source.syllabusVerified === false && reviews.every(item => item.approved === false),
    'Review data cannot claim educator approval or publication')
  assert.equal(outline.exercises.length, authored.chapters.length)
  assert.equal(reviews.length, 6, 'All six supplementary activities must be retained')
  const core = authored.chapters.map(chapter => {
    const original = outline.exercises.find(item => item.chapter === chapter.chapter)
    const step = authored.steps.find(item => item.chapter === chapter.chapter)
    const scene = scenes.find(item => item.chapter === chapter.chapter)
    assert(original && step && scene && original.page === chapter.page && original.name === chapter.topic,
      'Chapter, model and original preview source must agree')
    const id = 'class1-l02-' + chapter.chapter.replace('.', '-')
    return { id, kind: 'MODEL_PRACTICE', chapter: chapter.chapter, exerciseNumber: null,
      prompt: original.prompt, mode: original.mode, approved: false,
      evidence: { kind: 'PRACTICE_REVIEW_REQUIRED', description: original.evidence },
      teaching: { teacherQuestion: step.teacherLine, targets: [scene.englishTarget],
        lineIds: [id + ':model-1'], modelLines: [scene.modelEnglish],
        hints: { en: scene.translationEnglish, hi: step.hintHi, mr: step.hintMr },
        retryEnglish: scene.retryEnglish, expectedEvidence: step.expectedEvidence },
    }
  })
  const supplemental = reviews.map(item => ({ id: item.id, kind: 'SUPPLEMENTARY_PRACTICE', chapter: null,
    exerciseNumber: null, prompt: item.prompt, mode: item.type, approved: false,
    evidence: { kind: 'PRACTICE_REVIEW_REQUIRED', description: item.successCriteria }, teaching: null }))
  const rawExercises = read('exercises', 'CLASS1_L2_NUMBERED_EXERCISE_CHECKPOINTS')
  const exercises = rawExercises.map(item => ({
    id: `class1-l02-ex-${item.chapter.replace('.', '-')}-${String(item.number).padStart(2, '0')}`,
    kind: 'EDUCATOR_CHECKPOINT', chapter: item.chapter, exerciseNumber: item.number,
    prompt: item.prompt, mode: item.type, approved: false,
    evidence: { kind: 'HUMAN_REVIEW_REQUIRED', description: item.evidence }, teaching: null,
  }))
  return lessonReviewPackSchema.parse({
    schemaVersion: 1, status: 'DRAFT_REVIEW_ONLY', grade: 1, level: 2, lessonKey: 'g01-l02',
    title: outline.title, objective: outline.goal, studentPlayable: false, syllabusVerified: false,
    source: { book: source.book, edition: null, reference: 'https://ebooks.ebalbharati.in/pdfs/103050001.pdf',
      reviewStatus: 'UNVERIFIED_FOR_RELEASE' },
    authoringSources: Object.values(paths).map(path => ({ path,
      sha256: authoringFingerprint(readFileSync(new URL(path, root))) })),
    chapters: authored.chapters.map(chapter => ({ code: chapter.chapter, title: chapter.topic,
      objective: chapter.goal, pageStart: chapter.page,
      numberedExercisesExpected: rawExercises.filter(item => item.chapter === chapter.chapter).length })),
    gates: { educator: 'PENDING', language: 'PENDING', media: 'UNVERIFIED', runtime: 'NOT_ENABLED',
      physicalVoice: 'UNVERIFIED', publication: 'LOCKED' }, activities: [...core, ...supplemental, ...exercises],
  })
}

export function auditReviewPack(pack) {
  const expected = buildClass1Level2ReviewPack()
  const parsed = lessonReviewPackSchema.parse(pack)
  assert.equal(JSON.stringify(parsed), JSON.stringify(expected), 'Review pack differs from the current authoring sources')
  return { lessonKey: parsed.lessonKey, status: parsed.status, activities: parsed.activities.length,
    modelPractices: parsed.activities.filter(item => item.kind === 'MODEL_PRACTICE').length,
    educatorCheckpoints: parsed.activities.filter(item => item.kind === 'EDUCATOR_CHECKPOINT').length,
    supplementaryPractices: parsed.activities.filter(item => item.kind === 'SUPPLEMENTARY_PRACTICE').length,
    chapterExercises: Object.fromEntries(parsed.chapters.map(item => [item.code, item.numberedExercisesExpected])),
    educatorApprovalClaimed: false, sourceEditionVerifiedByThisTool: false,
    runtimeIntegrated: false, studentPlayable: false, gates: parsed.gates }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const args = process.argv.slice(2)
    assert(args.length <= 1 && (!args.length || ['--check', '--print', '--help'].includes(args[0])),
      'Only read-only --check, --print or --help is supported')
    if (args[0] === '--help') console.log('Build backend first. --check validates the checked-in review pack; --print emits a current draft to stdout. No data is installed or published.')
    else if (args[0] === '--print') console.log(JSON.stringify(buildClass1Level2ReviewPack(), null, 2))
    else console.log(JSON.stringify(auditReviewPack(JSON.parse(readFileSync(reviewPackPath, 'utf8'))), null, 2))
  } catch {
    console.error('Class 1 Level 2 review check failed. Check the schema, canonical authoring data and snapshot; no curriculum was installed or published.')
    process.exitCode = 1
  }
}
