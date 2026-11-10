import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const resume = await read('../../app/student/continue/page.tsx')
const service = await read('../../features/lessons/grades/kg/continuation/continuation-service.ts')
const continuation = await read('../../features/lessons/grades/kg/continuation/ContinuationExperience.tsx')
const page = await read('../../features/lessons/grades/kg/continuation/ContinuationPage.tsx')
const map = await read('../../components/student/kg-adventure-map.tsx')
const mapPage = await read('../../app/student/kg/map/page.tsx')
const level2 = await read('../../features/lessons/grades/kg/level-02/StudentExperience.tsx')
const intro = await read('../../features/lessons/grades/kg/level-02/PreviewIntro.tsx')
const routes = await read('../../../backend/src/routes/kg-continuation.routes.ts')
const controller = await read('../../../backend/src/controllers/kg-continuation.controller.ts')
const catalog = await read('../../../backend/src/kg/student-continuation-catalog.ts')
const fastService = await read('../../../backend/src/services/student-lesson-fast.service.ts')
const progress = await read('../../../backend/src/services/progress.service.ts')
const lessonExperience = await read('../../components/lessons/lesson-experience.tsx')
const curriculum = await read('../../../backend/src/controllers/curriculum.controller.ts')
const studentRoute3 = await read('../../app/student/kg/level-3/page.tsx')
const studentRoute4 = await read('../../app/student/kg/level-4/page.tsx')
const studentRoute5 = await read('../../app/student/kg/level-5/page.tsx')

test('KG always resumes the next unfinished authored level after a PIN login, never a completed stone', () => {
  assert.match(resume, /nextKGStudentRoute\(\)/)
  assert.doesNotMatch(resume, /kgAlphabetService\.state|kgLevel2StudentService\.state/)
  assert.match(controller, /nextStudentRoute/)
  assert.match(level2, /updated\.completed\) \{ router\.replace\('\/student\/continue'\)/)
  assert.match(continuation, /updated\.completed\) \{ router\.replace\('\/student\/continue'\)/)
  assert.match(mapPage, /kgContinuationStudentService\.overview\(\)/)
  assert.match(map, /number >= 3 && number <= 5/)
  assert.match(map, /\/student\/kg\/level-/)
  assert.match(map, /: 'LOCKED'/)
  assert.match(studentRoute3, /level=\{3\}/)
  assert.match(studentRoute4, /level=\{4\}/)
  assert.match(studentRoute5, /level=\{5\}/)
})

const resumeSource = await read('../../services/kg-resume-service.ts')
function resumeHarness() {
  let token = 'fixture-A'
  const requests = []
  const exports = {}
  vm.runInNewContext(ts.transpileModule(resumeSource, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, { exports, module: { exports }, AbortSignal,
    require: id => {
      assert.equal(id, '@/lib/api-client')
      return { getStoredToken: () => token, apiClient: (url, options) => new Promise((resolve, reject) => {
        requests.push({ url, options, token, resolve, reject })
      }) }
    } })
  return { next: exports.nextKGStudentRoute, requests, setToken: value => { token = value } }
}

test('KG resume shares concurrent requests for one login and never caches settled progress', async () => {
  const h = resumeHarness()
  const a = h.next()
  assert.strictEqual(a, h.next())
  assert.equal(h.requests.length, 1)
  assert.equal(h.requests[0].url, '/kg-continuation/overview')
  assert.equal(h.requests[0].options.cache, 'no-store')
  h.requests[0].resolve({ nextStudentRoute: '/student/kg/level-2' })
  assert.equal(await a, '/student/kg/level-2')
  const b = h.next()
  assert.equal(h.requests.length, 2)
  h.requests[1].resolve({ nextStudentRoute: '/student/kg/level-3' })
  assert.equal(await b, '/student/kg/level-3')
})

test('old KG resume response cannot select a level or erase a newer login request', async () => {
  const h = resumeHarness()
  const a = h.next()
  h.setToken('fixture-B')
  const b = h.next()
  h.requests[0].resolve({ nextStudentRoute: '/student/kg/level-5' })
  await assert.rejects(a, /previous login/)
  assert.strictEqual(b, h.next())
  h.requests[1].resolve({ nextStudentRoute: '/student/kg' })
  assert.equal(await b, '/student/kg')
})

test('failed KG resume can retry; unknown, external and KG6–10 routes fail closed', async () => {
  const h = resumeHarness()
  const failed = h.next()
  h.requests[0].reject(Error('Offline'))
  await assert.rejects(failed, /Offline/)
  for (const route of [undefined, '/student/kg/level-6', '/school/dashboard', 'https://example.test']) {
    const retry = h.next()
    h.requests.at(-1).resolve({ nextStudentRoute: route })
    await assert.rejects(retry, /next lesson could not open/)
  }
  h.setToken(null)
  const count = h.requests.length
  await assert.rejects(h.next(), /sign in/)
  assert.equal(h.requests.length, count)
})

const shellSource = await read('../../components/student/shell/student-portal-shell.tsx')
async function shellReads(pathname, grade) {
  const effects = [], reads = []
  const exports = {}
  const noop = () => null
  vm.runInNewContext(ts.transpileModule(shellSource, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, module: { exports }, require: id => {
    if (id === 'react') return { useEffect: f => effects.push(f), useState: x => [x, noop] }
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
    if (id === 'next/navigation') return { usePathname: () => pathname, useRouter: () => ({ replace: noop }) }
    if (id === '@/components/auth/auth-provider') return { useAuth: () => ({ session: { student: { id: 'fixture', grade } } }) }
    if (id === '@/services/progress-service') return { progressService: { getMyProgress: async () => { reads.push('generic'); return {} } } }
    if (id.includes('kg-alphabet-service')) return { kgAlphabetService: { state: async () => { reads.push('kg'); return {} } } }
    if (id === '@/config/talkora-assets') return { accountAvatar: noop, learnerAvatar: noop }
    return { default: noop, Flame: noop, Star: noop, StudentNav: noop, TalkoraLogo: noop }
  } })
  exports.StudentPortalShell({ children: null })
  for (const effect of effects) effect()
  await Promise.resolve()
  return reads
}

test('hidden lesson and resume HUDs never trigger unused student progress reads', async () => {
  for (const pathname of ['/student/continue', '/student/kg', '/student/kg/level-4', '/student/lesson/fixture']) {
    for (const grade of [0, 1]) assert.deepEqual(await shellReads(pathname, grade), [])
  }
  assert.deepEqual(await shellReads('/student/kg/map', 0), ['kg'])
  assert.deepEqual(await shellReads('/student/profile', 1), ['generic'])
})

test('one reusable student engine, protected voice intro and receipts, no preview shortcut', () => {
  assert.match(catalog, /KG_CONTINUATION_LEVELS = \[3, 4, 5\]/)
  assert.match(routes, /requireRole\('STUDENT'\)/)
  assert.match(controller, /completedPrerequisite/)
  assert.match(controller, /verifyKGFeedbackReceipt/)
  assert.match(controller, /isKGContinuationLevel/)
  assert.match(controller, /grade\(transcript/)
  assert.match(page, /beginIntro\(level\)/)
  assert.match(page, /completeIntro\(level\)/)
  assert.match(intro, /videoSrc = INTRO_VIDEO/)
  assert.match(continuation, /requestKGMicrophone\(controller\.signal\)/)
  assert.match(continuation, /watchVoiceActivity\(stream,/)
  assert.match(continuation, /kgContinuationStudentService\.acknowledge/)
  assert.match(service, /audio\.onended = \(\) => \{ clean\(\); resolve\(\) \}/)
  assert.match(service, /receipts\.set\(key\(level, id\), receipt\)/)
  assert.doesNotMatch(continuation, /kg-level3-preview|\/school\/kg-preview/)
  assert.doesNotMatch(routes, /requireRole\('TEACHER'/)
})

test('all Class 1–10 levels strictly need verified published preceding level', () => {
  assert.match(progress, /expectedLevelNumber = 1/)
  assert.match(progress, /Finish the previous published level before starting this lesson/)
  assert.match(progress, /requiredIds\.length > 0/)
  assert.match(fastService, /ProgressService\.assertLevelAccessible\(/)
  assert.match(fastService, /blockedMessage:/)
  assert.match(resume, /if \(current\.blocked\) throw new Error/)
  assert.doesNotMatch(fastService, /levelProgress\.status = 'unlocked'/)
  assert.match(lessonExperience, /if \(voicePlayed && experienceId !== 'g01-l01'\) router\.replace\('\/student\/continue'\)/)
  assert.match(lessonExperience, /For your speaking homework, \$\{homeworkMessage\.replace/)
  assert.match(lessonExperience, /if \(experienceId !== 'g01-l01' \|\| !homeworkSaved \|\| experience !== 'lesson_complete'\) return/)
  assert.match(curriculum, /status: recorded \|\| 'locked'/)
  assert.match(curriculum, /ProgressService\.assertLevelAccessible\(/)
})

test('KG3–5 student classroom labels use current level rather than Level 2', () => {
  assert.match(continuation, /state\.completed \? 'Wonderful! You finished Level ' \+ state\.level/)
  assert.match(continuation, /aria-label=\{"Miss Julie's Level " \+ state\.level/)
  assert.doesNotMatch(continuation, /finished Level 2|Level 2 teaching board/)
})

test('KG3–5 opt-in fixed narration is behind the student intro guard, feedback receipts unchanged', () => {
  assert.match(controller, /TALKORA_KG_FIXED_NARRATION_CACHE === 'true'/)
  assert.match(controller, /getKGAzureNarrationAudio\(\{ level, id: req\.params\.id, text: narration \}\)/)
  assert.match(controller, /ticket\(req, await row\(studentId, schoolId, level\)\)/)
  assert.match(controller, /verifyKGFeedbackReceipt\(req\.body\?\.feedbackReceipt/)
})
