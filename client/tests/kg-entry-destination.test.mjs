import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [helperSource, continuePage, authProvider, lesson] = await Promise.all([
  read('../features/lessons/grades/kg/level-01/services/kg-entry-destination.ts'),
  read('../app/student/continue/page.tsx'),
  read('../components/auth/auth-provider.tsx'),
  read('../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
])
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const helperExports = {}
new Function('exports', compiled)(helperExports)
const { kgStudentEntryDestination } = helperExports

function state({
  nextIncompleteLevel = 1,
  studentPlayableLevels = [1],
  unlockedLevels = [1],
  status = 'available',
  completedLevels = [],
} = {}) {
  return {
    nextIncompleteLevel,
    studentPlayableLevels,
    unlockedLevels,
    completedLevels,
    levels: [{ level: 1, status }],
  }
}

test('a first eligible KG login opens available Level 1 directly', () => {
  assert.equal(kgStudentEntryDestination(state()), '/student/kg')
  assert.match(continuePage, /nextKGStudentRoute\(\)/)
  assert.match(continuePage, /router\.replace\(destination\)/)
})

test('an incomplete Level 1 resumes directly on the next login using server progress', () => {
  const savedProgress = state({ status: 'in_progress' })
  assert.equal(kgStudentEntryDestination(savedProgress), '/student/kg')
  assert.equal(kgStudentEntryDestination(savedProgress), '/student/kg')
  assert.match(continuePage, /nextKGStudentRoute\(\)/)
})

test('a completed Level 1 returns to the KG level screen for revision', () => {
  assert.equal(
    kgStudentEntryDestination(state({
      nextIncompleteLevel: null,
      completedLevels: [1],
      status: 'completed',
    })),
    '/student/kg/map',
  )
})

test('an unlocked incomplete server-selected Level 1 remains the next eligible entry', () => {
  const stateAfterPriorActivities = state({ status: 'in_progress' })
  assert.equal(kgStudentEntryDestination(stateAfterPriorActivities), '/student/kg')
})

test('locked, unplayable or completed levels are not opened as the next level', () => {
  assert.equal(kgStudentEntryDestination(state({
    nextIncompleteLevel: 2,
    studentPlayableLevels: [1],
    unlockedLevels: [1],
  })), '/student/kg/map')
  assert.equal(kgStudentEntryDestination(state({
    nextIncompleteLevel: 1,
    status: 'locked',
  })), '/student/kg/map')
  assert.equal(kgStudentEntryDestination(state({
    nextIncompleteLevel: 1,
    status: 'completed',
    completedLevels: [1],
  })), '/student/kg/map')
})

test('ineligible Grade 0 sessions remain on the error path when server state rejects access', () => {
  assert.match(continuePage, /student\?\.grade === 0/)
  assert.match(continuePage, /\.catch\(\(cause\) =>/)
  assert.match(continuePage, /setError\(cause instanceof Error && cause\.message/)
  assert.doesNotMatch(continuePage, /catch\([\s\S]*?router\.replace\(kgStudentEntryDestination/)
})

test('non-KG students keep the existing curriculum next-lesson redirect', () => {
  assert.match(continuePage, /curriculumService\.getNextLesson\(\)/)
  assert.match(continuePage, /router\.replace\(current\.lessonId[\s\S]*?encodeURIComponent\(current\.lessonId\)/)
  assert.match(authProvider, /role === 'STUDENT' \? '\/student\/continue'/)
})

test('Level 1 returns to the garden only after the server confirms completion', () => {
  assert.match(lesson, /stateRef\.current\?\.completed !== true/)
  assert.match(lesson, /router\.replace\('\/student\/kg\/map'\)/)
  assert.match(lesson, /introSeen: true/)
})
