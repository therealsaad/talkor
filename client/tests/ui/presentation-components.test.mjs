import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8')

const stageCode = await read('../../components/student/lesson/miss-julie-teaching-stage.tsx')
const beaconCode = await read('../../components/student/lesson/voice-interaction-beacon.tsx')
const boardCode = await read('../../components/student/lesson/smart-learning-board.tsx')
const previewCode = await read('../../app/classroom-preview/page.tsx')
const studentNavCode = await read('../../components/student/navigation/student-nav.tsx')
const studentContinueCode = await read('../../app/student/continue/page.tsx')
const studentHomeCode = await read('../../app/student/home/page.tsx')

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
  new Function('exports', 'require', compiled.outputText)(exports, (key) => {
    return {}
  })
  return exports
}

const previewExports = await compileModule('../../lib/classroom-preview-guard.ts')

test('MissJulieTeachingStage reuses MissJulieCharacter without duplicating avatar logic', () => {
  assert.match(stageCode, /import\s*\{\s*MissJulieCharacter/)
  assert.match(stageCode, /<MissJulieCharacter\s*state=\{state\}\s*isSpeaking=\{isSpeaking\}\s*\/>/)
  assert.doesNotMatch(stageCode, /MediaRecorder/)
  assert.doesNotMatch(stageCode, /navigator\.mediaDevices/)
  assert.doesNotMatch(stageCode, /TeachingResponseV1/)
})

test('VoiceInteractionBeacon strictly enforces deliberate click and avoids auto-activating mic', () => {
  assert.doesNotMatch(beaconCode, /useEffect\(.*onStartMic/)
  assert.match(beaconCode, /isTeacherSpeaking\s*\?\s*'teacher_speaking'/)
  assert.match(beaconCode, /Listen to Miss Julie/)
  assert.match(beaconCode, /I am listening!/)
  assert.match(beaconCode, /Miss Julie is thinking/)
  assert.match(beaconCode, /isButtonDisabled\s*=\s*disabled\s*\|\|\s*isProcessing\s*\|\|\s*isTeacherSpeaking/)
})

test('SmartLearningBoard guards XP distinction between earned and potential target rewards', () => {
  // Checks earned/confirmed XP logic
  assert.match(boardCode, /effectiveEarnedXp\s*&&\s*effectiveEarnedXp\s*>\s*0/)
  assert.match(boardCode, /\+\{effectiveEarnedXp\}\s*XP\s*\(Earned\)/)
  // When only potentialXp is passed, it renders as "Goal: X XP", never "+XP"
  assert.match(boardCode, /Goal:\s*\{displayGoalXp\}\s*XP/)
  assert.doesNotMatch(boardCode, /\+\{potentialXp\}/)
  assert.doesNotMatch(boardCode, /\+\{xpReward\}/)
  // Documents caller responsibility: component does not assume prop validates backend evidence
  assert.match(boardCode, /SmartLearningBoard strictly formats the presentation of this value/)
  assert.match(boardCode, /It does NOT perform cryptographic or server-side evidence verification itself/)
  assert.match(boardCode, /caller \/ lesson orchestrator is strictly responsible/)
})

test('checkClassroomPreviewAccess enforces strict server-verified staff authorization in production', () => {
  const { checkClassroomPreviewAccess } = previewExports
  assert.equal(typeof checkClassroomPreviewAccess, 'function')

  // Production tests
  const prodAnon = checkClassroomPreviewAccess({ status: 'unauthenticated', role: null, isProduction: true })
  assert.equal(prodAnon.allowed, false)
  assert.equal(prodAnon.reason, 'production_unauthenticated')
  assert.equal(prodAnon.redirectUrl, '/login/school')

  const prodStudent = checkClassroomPreviewAccess({ status: 'authenticated', role: 'STUDENT', isProduction: true })
  assert.equal(prodStudent.allowed, false)
  assert.equal(prodStudent.reason, 'student_blocked')
  assert.equal(prodStudent.redirectUrl, '/student/continue')

  const prodTeacher = checkClassroomPreviewAccess({ status: 'authenticated', role: 'TEACHER', isProduction: true })
  assert.equal(prodTeacher.allowed, true)
  assert.equal(prodTeacher.reason, 'authorized_staff')
  assert.equal(prodTeacher.redirectUrl, null)

  const prodAdmin = checkClassroomPreviewAccess({ status: 'authenticated', role: 'SCHOOL_ADMIN', isProduction: true })
  assert.equal(prodAdmin.allowed, true)
  assert.equal(prodAdmin.reason, 'authorized_staff')
  assert.equal(prodAdmin.redirectUrl, null)

  const prodLoading = checkClassroomPreviewAccess({ status: 'loading', role: null, isProduction: true })
  assert.equal(prodLoading.allowed, false)
  assert.equal(prodLoading.reason, 'loading')
  assert.equal(prodLoading.redirectUrl, null)

  // Development tests
  const devStudent = checkClassroomPreviewAccess({ status: 'authenticated', role: 'STUDENT', isProduction: false })
  assert.equal(devStudent.allowed, false)
  assert.equal(devStudent.reason, 'student_blocked')
  assert.equal(devStudent.redirectUrl, '/student/continue')

  const devAnon = checkClassroomPreviewAccess({ status: 'unauthenticated', role: null, isProduction: false })
  assert.equal(devAnon.allowed, true)
  assert.equal(devAnon.reason, 'authorized_dev')
})

test('ClassroomPreviewPage prevents disallowed users from mounting or interacting with sandbox', () => {
  // Verifies that loading state shields the sandbox completely
  assert.match(previewCode, /if\s*\(access\.reason\s*===\s*'loading'\)/)
  assert.match(previewCode, /Verifying educator and developer authorization\.\.\./)
  // Verifies that disallowed users receive Access Restricted gate and sandbox is NOT mounted
  assert.match(previewCode, /if\s*\(!access\.allowed\)/)
  assert.match(previewCode, /Access Restricted/)
  // Explicit staff sandbox banner in authorized view
  assert.match(previewCode, /STAFF &(?:amp;)? DEVELOPER SANDBOX/)
  assert.match(previewCode, /NOT AN ACCREDITED LESSON/)
  // Distinguishes simulated actions
  assert.match(previewCode, /UI Demo Only/)
  assert.match(previewCode, /Simulated Demo \(0 XP Awarded\)/)
  // Real XP explanation
  assert.match(previewCode, /Real XP is (?:recorded|awarded) only after (?:verified backend|backend attempt)/)
})

test('Standalone preview HTML is completely removed from public production serving', () => {
  const publicHtmlPath = fileURLToPath(new URL('../../public/classroom-preview.html', import.meta.url))
  assert.equal(existsSync(publicHtmlPath), false, 'client/public/classroom-preview.html must not exist')
})

test('Production student navigation routes NEVER link to classroom-preview', () => {
  assert.doesNotMatch(studentNavCode, /classroom-preview/)
  assert.doesNotMatch(studentContinueCode, /classroom-preview/)
  assert.doesNotMatch(studentHomeCode, /classroom-preview/)
})
