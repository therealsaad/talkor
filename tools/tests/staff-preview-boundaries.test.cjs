const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const { verifyStaffPreviewBoundaries, STAFF_PREVIEW_FILES } = require('../staff-preview-boundaries.cjs')

const root = path.resolve(__dirname, '../..')
const originals = new Map(STAFF_PREVIEW_FILES.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]))
const explorer = 'client/features/curriculum-explorer/CurriculumExplorer.tsx'
const studio = 'client/app/school/curriculum-studio/[grade]/[level]/page.tsx'
const model = 'client/features/curriculum-explorer/model.ts'

function check(changes = new Map()) {
  verifyStaffPreviewBoundaries(file => {
    const source = changes.get(file) ?? originals.get(file)
    assert.equal(typeof source, 'string', `Unexpected verification input: ${file}`)
    return source
  })
}

function change(file, before, after) {
  const original = originals.get(file)
  const modified = original.replace(before, after)
  assert.notEqual(modified, original, 'Regression fixture must change the intended source')
  return new Map([[file, modified]])
}

test('current shared routes and explorer pass without the obsolete page-local studio call', () => {
  assert.doesNotMatch(originals.get(studio), /gradeLevelMapService/)
  assert.doesNotMatch(originals.get(explorer), /gradeLevelMapService\s*\.studio/)
  assert.doesNotThrow(() => check())
})

test('formatted shared GET calls still satisfy the boundary check', () => {
  const modified = originals.get(explorer)
    .replace(/gradeLevelMapService\s*\.grade\(selectedGrade\)/, 'gradeLevelMapService .grade( selectedGrade )')
    .replace(/gradeLevelMapService\s*\.level\(grade, level\)/, 'gradeLevelMapService\n.level( grade,\n level )')
  assert.doesNotThrow(() => check(new Map([[explorer, modified]])))
})

test('dropping the authenticated educator guard is rejected', () => {
  const changed = change(explorer, "status === 'authenticated' && isEducator(role)", 'true')
  assert.throws(() => check(changed), /authenticated educator/)
})

test('dropping the rejected-role render boundary is rejected', () => {
  const changed = change(explorer, 'if (!allowed) return', 'if (false) return')
  assert.throws(() => check(changed), /must not render for a rejected role/)
})

test('allowing students or arbitrary roles through the staff policy is rejected', () => {
  const changed = change(model, "return role === 'TEACHER' || role === 'SCHOOL_ADMIN'", 'return true')
  assert.throws(() => check(changed), /Only teacher and school-admin/)
})

test('losing authenticated level reads or live response identity checks is rejected', () => {
  assert.throws(() => check(change(explorer, '.level(grade, level)', '.studio(grade, level)')), /read authenticated level records/)
  assert.throws(() => check(change(explorer, 'data.address !== id || data.grade !== grade || data.level !== level', 'false')), /match the requested address/)
})

test('studio wrappers must retain selected grade, level, and invalid-address rejection', () => {
  assert.throws(() => check(change(studio, 'initialGrade={Number(grade)}', 'initialGrade={0}')), /preserve the selected grade/)
  assert.throws(() => check(change(studio, 'initialLevel={Number(level)}', 'initialLevel={1}')), /preserve the selected level/)
  assert.throws(() => check(change(studio, 'notFound()', 'void 0')), /reject invalid grade\/level routes/)
})

test('a legacy KG URL cannot bypass the shared explorer by mounting a student engine', () => {
  const file = 'client/app/school/kg-preview/level-1/page.tsx'
  assert.throws(() => check(change(file, /CurriculumExplorerPage/g, 'RegisteredLevelExperience')), /shared staff explorer/)
})

test('recording or learning-data writes in any inspected staff component are rejected', () => {
  const file = 'client/features/curriculum-explorer/SchoolLessonRecords.tsx'
  for (const unsafe of ["apiClient('/students/me/attempts', { method: 'POST' })", 'navigator.mediaDevices.getUserMedia({audio:true})', 'service.submitAttempt(recording)', '<module.LevelExperience preview />']) {
    const changed = new Map([[file, originals.get(file) + '\n' + unsafe]])
    assert.throws(() => check(changed), /must not mount student runtimes, capture audio, or write learning data/)
  }
})
