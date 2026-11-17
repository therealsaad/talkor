/**
 * Read-only, TypeScript-AST-based audit of the REAL Class 1 Level 2 authoring
 * source. 5 canonical chapters, 5 age-appropriate bilingual voice models,
 * 19 individually supervised textbook exercise checkpoints.
 *
 * A passing coverage report NEVER publishes a student lesson or marks school
 * approval complete. Execute:
 *   cd client
 *   node scripts/report-class1-level2-readiness.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// Both CI jobs audit the same source. Each installs its own existing pinned
// TypeScript dependency; reading authoring data must not require a second install.
let ts
try { ts = createRequire(import.meta.url)('typescript') }
catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes("'typescript'")) throw error
  ts = createRequire(new URL('../../backend/package.json', import.meta.url))('typescript')
}

const base = new URL('../features/lessons/grades/class-01/level-02/', import.meta.url)
const expectedExerciseCounts = Object.freeze({
  '1.2': 3, '1.3': 3, '1.4': 4, '1.5': 3, '1.6': 6,
})
const expectedPages = Object.freeze({
  '1.2': 2, '1.3': 3, '1.4': 5, '1.5': 7, '1.6': 8,
})

function getVariableInitializer(path, name) {
  const filename = fileURLToPath(new URL(path, base))
  const content = readFileSync(filename, 'utf8')
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const declarations = []
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name) {
      declarations.push(node.initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (declarations.length !== 1 || !declarations[0]) {
    throw new Error('Missing or duplicate Class 1 Level 2 authoring declaration: ' + name)
  }
  return declarations[0]
}

function unwrap(node) {
  while (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) ||
         ts.isParenthesizedExpression(node)) node = node.expression
  return node
}

function getProperty(obj, name) {
  obj = unwrap(obj)
  if (!ts.isObjectLiteralExpression(obj)) throw new Error('Expected original authoring object')
  const matches = obj.properties.filter(prop =>
    ts.isPropertyAssignment(prop) && (
      (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) && prop.name.text === name
    ))
  if (matches.length !== 1 || !ts.isPropertyAssignment(matches[0])) {
    throw new Error('Required authoring property missing or duplicate: ' + name)
  }
  return unwrap(matches[0].initializer)
}

function literal(node) {
  node = unwrap(node)
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    if (ts.isStringLiteral(node)) return node.text
    const number = Number(node.text)
    if (!Number.isFinite(number)) throw new Error('Authoring numbers must be finite')
    return number
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isArrayLiteralExpression(node)) return [...node.elements].map(literal)
  if (ts.isObjectLiteralExpression(node)) {
    const entries = []
    const seen = new Set()
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)))
        throw new Error('Authoring objects require explicit literal properties')
      const key = property.name.text
      if (seen.has(key) || ['__proto__', 'prototype', 'constructor'].includes(key))
        throw new Error('Duplicate or unsafe authoring property')
      seen.add(key)
      entries.push([key, literal(property.initializer)])
    }
    return Object.fromEntries(entries)
  }
  throw new Error('Class 1 Level 2 release audit accepts only authored literal values')
}

/** Data extraction, never import/eval/execute authored TypeScript. This permits
 * a review pack to reuse the real draft without inventing a second curriculum. */
export function readAuthoringLiteral(path, name, properties = []) {
  let node = getVariableInitializer(path, name)
  for (const property of properties) node = getProperty(node, property)
  return literal(node)
}

export function readAuthoringComposition(path, name) {
  return array(getVariableInitializer(path, name)).map(node => node.getText().replace(/\s+/g, ''))
}

function array(node) {
  node = unwrap(node)
  if (!ts.isArrayLiteralExpression(node)) throw new Error('Expected authoring array')
  return [...node.elements]
}

function objects(path, variable, child) {
  const root = getVariableInitializer(path, variable)
  const source = child ? getProperty(root, child) : root
  return array(source)
}

function field(object, name) {
  return literal(getProperty(object, name))
}

export function readClass1Level2Authoring() {
  const chapters = objects('teaching-plan.ts', 'CLASS1_LEVEL2_SOURCE', 'chapterReferences')
    .map(entry => ({ chapter: field(entry, 'chapter'), page: field(entry, 'page'),
      topic: field(entry, 'topic'), goal: field(entry, 'goal') }))
  const steps = objects('teaching-plan.ts', 'CLASS1_LEVEL2_TEACHING_STEPS')
    .map(entry => ({ key: field(entry, 'key'), chapter: field(entry, 'chapter'),
      teacherLine: field(entry, 'teacherLine'), hintHi: field(entry, 'hintHi'),
      hintMr: field(entry, 'hintMr'), expectedEvidence: field(entry, 'expectedEvidence') }))
  const scenes = objects('teaching-plan.ts', 'CLASS1_LEVEL2_VOICE_SCENES')
    .map(entry => ({ chapter: field(entry, 'chapter'), stepKey: field(entry, 'stepKey'),
      englishTarget: field(entry, 'englishTarget'), modelEnglish: field(entry, 'modelEnglish'),
      retryEnglish: field(entry, 'retryEnglish'), reviewed: field(entry, 'reviewed'),
      studentPlayable: field(entry, 'studentPlayable'),
      teacherReviewRequired: field(entry, 'teacherReviewRequired'),
      audioReviewRequired: field(entry, 'audioReviewRequired'),
      deviceTestRequired: field(entry, 'deviceTestRequired') }))
  const exercises = objects('exercise-checkpoints.ts', 'CLASS1_L2_NUMBERED_EXERCISE_CHECKPOINTS')
    .map(entry => ({ chapter: field(entry, 'chapter'), number: field(entry, 'number'),
      prompt: field(entry, 'prompt'), evidence: field(entry, 'evidence') }))
  const config = getVariableInitializer('config.ts', 'config')
  return { chapters, steps, scenes, exercises, config: {
    studentPlayable: field(config, 'studentPlayable'),
    staffOnlyPreview: field(config, 'staffOnlyPreview'),
    syllabusVerified: field(getProperty(config, 'syllabus'), 'syllabusVerified'),
  }}
}

export function auditClass1Level2(input) {
  const errors = []
  const codes = Object.keys(expectedExerciseCounts)
  const chapterIds = input.chapters.map(x => x.chapter)
  if (chapterIds.join(',') !== codes.join(','))
    errors.push('CHAPTER_ORDER_OR_COUNT_MISMATCH')
  for (const chapter of input.chapters) {
    if (chapter.page !== expectedPages[chapter.chapter])
      errors.push('PRINTED_PAGE_MISMATCH:' + chapter.chapter)
    if (!chapter.topic || !chapter.goal) errors.push('CHAPTER_TEACHING_GOAL_MISSING:' + chapter.chapter)
  }
  if (input.steps.length !== 5 || input.scenes.length !== 5)
    errors.push('MISSING_FIVE_CHAPTER_VOICE_MODELS')
  for (const code of codes) {
    const steps = input.steps.filter(x => x.chapter === code)
    const scenes = input.scenes.filter(x => x.chapter === code)
    if (steps.length !== 1 || scenes.length !== 1 ||
        steps[0]?.key !== scenes[0]?.stepKey)
      errors.push('CHAPTER_VOICE_MAPPING_MISMATCH:' + code)
    if (!steps[0]?.teacherLine?.trim() || !steps[0]?.hintHi?.trim() ||
        !steps[0]?.hintMr?.trim() || !steps[0]?.expectedEvidence?.trim())
      errors.push('MISSING_NATIVE_LANGUAGE_OR_EVIDENCE:' + code)
    const scene = scenes[0]
    if (!scene?.modelEnglish || !scene?.retryEnglish ||
        !scene.modelEnglish.toLowerCase().includes(scene.englishTarget?.toLowerCase()))
      errors.push('MISSING_ENGLISH_MODEL:' + code)
    if (scene && (scene.studentPlayable !== false || scene.reviewed !== false ||
        scene.teacherReviewRequired !== true || scene.audioReviewRequired !== true ||
        scene.deviceTestRequired !== true))
      errors.push('EDITORIAL_SCENE_NOT_APPROVED_FOR_STUDENTS:' + code)
    const exercises = input.exercises.filter(x => x.chapter === code)
    const actualNumbers = exercises.map(x => x.number).sort((a, b) => a - b)
    const expectedNumbers = Array.from({ length: expectedExerciseCounts[code] }, (_, n) => n + 1)
    if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers))
      errors.push('MISSING_OR_DUPLICATE_NUMBERED_EXERCISES:' + code)
    if (exercises.some(x => !x.prompt?.trim() || !x.evidence?.trim()))
      errors.push('MISSING_MANUAL_EVIDENCE_RUBRIC:' + code)
  }
  if (input.exercises.length !== 19) errors.push('EXERCISE_TOTAL_NOT_19')
  if (input.config.studentPlayable !== false ||
      input.config.staffOnlyPreview !== true ||
      input.config.syllabusVerified !== false) errors.push('DRAFT_PUBLICATION_BOUNDARY_BROKEN')
  return {
    address: 'g01-l02',
    status: 'DRAFT_NOT_PUBLISHED',
    chaptersMapped: input.chapters.length,
    originalVoiceModels: input.scenes.length,
    numberedExercisesMapped: input.exercises.length,
    teacherApprovalsReceived: 0,
    hostedNarrationVerified: false,
    supervisedStudentAcceptance: false,
    chapterExerciseCounts: Object.fromEntries(codes.map(chapter => [
      chapter, input.exercises.filter(x => x.chapter === chapter).length,
    ])),
    errors,
    studentPlayable: false,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = auditClass1Level2(readClass1Level2Authoring())
  console.log(JSON.stringify(report, null, 2))
  if (report.errors.length) process.exitCode = 1
}
