import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

async function compileModule(path) {
  const source = await read(path)
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  })
  const exports = {}
  new Function('exports', 'require', compiled.outputText)(exports, () => ({}))
  return exports
}

const previewExports = await compileModule('../../lib/classroom-preview-guard.ts')
const { checkClassroomPreviewAccess } = previewExports
const previewCode = await read('../../app/classroom-preview/page.tsx')

test('Access Control: Production anonymous users are strictly blocked and redirected to school login', () => {
  const result = checkClassroomPreviewAccess({
    status: 'unauthenticated',
    role: null,
    isProduction: true,
  })
  assert.equal(result.allowed, false)
  assert.equal(result.reason, 'production_unauthenticated')
  assert.equal(result.redirectUrl, '/login/school')
})

test('Access Control: Authenticated students in production are blocked and redirected to active lesson', () => {
  const result = checkClassroomPreviewAccess({
    status: 'authenticated',
    role: 'STUDENT',
    isProduction: true,
  })
  assert.equal(result.allowed, false)
  assert.equal(result.reason, 'student_blocked')
  assert.equal(result.redirectUrl, '/student/continue')
})

test('Access Control: Authenticated students in development are ALSO blocked from sandbox', () => {
  const result = checkClassroomPreviewAccess({
    status: 'authenticated',
    role: 'STUDENT',
    isProduction: false,
  })
  assert.equal(result.allowed, false)
  assert.equal(result.reason, 'student_blocked')
  assert.equal(result.redirectUrl, '/student/continue')
})

test('Access Control: Verified educators (TEACHER and SCHOOL_ADMIN) are authorized in production', () => {
  const teacherResult = checkClassroomPreviewAccess({
    status: 'authenticated',
    role: 'TEACHER',
    isProduction: true,
  })
  assert.equal(teacherResult.allowed, true)
  assert.equal(teacherResult.reason, 'authorized_staff')
  assert.equal(teacherResult.redirectUrl, null)

  const adminResult = checkClassroomPreviewAccess({
    status: 'authenticated',
    role: 'SCHOOL_ADMIN',
    isProduction: true,
  })
  assert.equal(adminResult.allowed, true)
  assert.equal(adminResult.reason, 'authorized_staff')
  assert.equal(adminResult.redirectUrl, null)
})

test('Access Control: Non-student developers are authorized in local development mode', () => {
  const devAnonResult = checkClassroomPreviewAccess({
    status: 'unauthenticated',
    role: null,
    isProduction: false,
  })
  assert.equal(devAnonResult.allowed, true)
  assert.equal(devAnonResult.reason, 'authorized_dev')
  assert.equal(devAnonResult.redirectUrl, null)
})

test('Access Control: Loading state suspends sandbox rendering without flashing content or early redirects', () => {
  const loadingProd = checkClassroomPreviewAccess({
    status: 'loading',
    role: null,
    isProduction: true,
  })
  assert.equal(loadingProd.allowed, false)
  assert.equal(loadingProd.reason, 'loading')
  assert.equal(loadingProd.redirectUrl, null)

  const loadingDev = checkClassroomPreviewAccess({
    status: 'loading',
    role: null,
    isProduction: false,
  })
  assert.equal(loadingDev.allowed, false)
  assert.equal(loadingDev.reason, 'loading')
  assert.equal(loadingDev.redirectUrl, null)
})

test('Access Control: Unauthorized non-staff role in production is rejected', () => {
  const invalidRoleResult = checkClassroomPreviewAccess({
    status: 'authenticated',
    role: 'UNKNOWN_ROLE',
    isProduction: true,
  })
  assert.equal(invalidRoleResult.allowed, false)
  assert.equal(invalidRoleResult.reason, 'production_unauthorized')
  assert.equal(invalidRoleResult.redirectUrl, '/login/school')
})

test('Route Protection: Disallowed users never receive sandbox markup or simulation controls', () => {
  // Confirm the component structure strictly returns before any sandbox rendering:
  assert.match(previewCode, /if\s*\(access\.reason\s*===\s*'loading'\)/)
  assert.match(previewCode, /if\s*\(!access\.allowed\)/)
  assert.match(previewCode, /<Link[^>]+href=\{access\.redirectUrl/)
  // Confirm that sandbox main only follows after all access gates pass:
  const splitByAllowed = previewCode.split('if (!access.allowed)')
  assert.equal(splitByAllowed.length, 2, 'Must have exactly one authorization check boundary')
  const authorizedBranch = splitByAllowed[1]
  assert.match(authorizedBranch, /<MissJulieTeachingStage/)
  assert.match(authorizedBranch, /<VoiceInteractionBeacon/)
  assert.match(authorizedBranch, /<SmartLearningBoard/)
  assert.match(authorizedBranch, /Beacon Simulator \(Demo Only\)/)
})

test('Asset Protection: Standalone public HTML is completely inaccessible in production', () => {
  const publicPath = fileURLToPath(new URL('../../public/classroom-preview.html', import.meta.url))
  assert.equal(existsSync(publicPath), false, 'client/public/classroom-preview.html must be removed')
})
