import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function read(path) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
}
const intro = read('../../features/lessons/grades/class-01/level-01/Class1LessonIntro.tsx')
const page = read('../../app/student/lesson/[id]/page.tsx')
const engine = read('../../components/lessons/lesson-experience.tsx')
const installer = read('../../../backend/src/scripts/stage-class1-first-day-poem.ts')

test('authenticated poem lesson supports the exact bundled reviewed media source', () => {
  assert.match(intro, /candidate === CLASS1_FIRST_DAY_VIDEO_BUNDLED/)
  assert.match(intro, /src=\{videoSource \|\| undefined\}/)
  assert.match(intro, /const MIN_DURATION_SECONDS = 87/)
  assert.match(intro, /const MAX_DURATION_SECONDS = 93/)
  assert.match(intro, /const REQUIRED_WATCH_SECONDS = 85/)
  // Native autoPlay could start before the validated media/server ticket;
  // only the reviewed, ticket-scoped effect may attempt an unmuted play().
  assert.match(intro, /if \(!sourceReady \|\| !canPlay \|\| error \|\| \(firstDayOnly && !playbackId\)\) return/)
  assert.match(intro, /player\.muted = false/)
  assert.match(intro, /player\.volume = 1/)
  assert.match(intro, /void player\.play\(\)\.then/)
  assert.match(intro, /if \(!cancelled && player\.paused\) setNeedsTap\(true\)/)
  assert.doesNotMatch(intro, /\bautoPlay\s*=/)
  assert.match(intro, /\{needsTap && canPlay && \(!firstDayOnly \|\| playbackId\)/)
  assert.match(intro, /if \(video\.current\?\.muted \|\| watchedUntil\.current < REQUIRED_WATCH_SECONDS\)/)
  assert.match(page, /lesson\.activities\.length === 6/)
  assert.match(page, /class1IntroVideoUrl=\{firstDayReady/)
  assert.match(engine, /introVideoKey && introState !== 'done'/)
})

test('stage command refuses fake video, writes no old attempts or progress, checks local file', () => {
  assert.match(installer, /TALKORA_FIRST_DAY_INTRO_REVIEWED/)
  assert.match(installer, /TALKORA_FIRST_DAY_USE_BUNDLED_INTRO/)
  assert.match(installer, /inspectBundledIntro\(\)/)
  assert.match(installer, /BUNDLED_CLASS1_INTRO_MISSING/)
  assert.match(installer, /databaseName !== 'test'/)
  assert.match(installer, /existingStudentRecordsWillBeUpdated:false/)
  assert.doesNotMatch(installer, /Activity\.deleteMany|Progress\.deleteMany|ActivityAttempt\.deleteMany/)
})

const introServiceSource = read('../../services/class1-intro-service.ts')
function serviceHarness() {
  let token = 'fixture-A'
  const requests = [], exports = {}
  vm.runInNewContext(ts.transpileModule(introServiceSource, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, { exports, module: { exports }, AbortSignal, require: id => {
    assert.equal(id, '@/lib/api-client')
    return { getStoredToken: () => token, apiClient: (url, options) => new Promise((resolve, reject) => {
      requests.push({ url, options, token, resolve, reject })
    }) }
  } })
  return { ...exports, requests, setToken: next => { token = next } }
}
const lesson = '111111111111111111111111'
test('intro starts are single-flight per login/lesson and stale responses cannot authorize a new child', async () => {
  const h = serviceHarness()
  const a = h.beginFirstDayIntro(lesson)
  assert.strictEqual(a, h.beginFirstDayIntro(lesson))
  h.setToken('fixture-B')
  const b = h.beginFirstDayIntro(lesson)
  assert.equal(h.requests.length, 2)
  h.requests[0].resolve({ playbackId: 'a'.repeat(64) })
  await assert.rejects(a, /previous login/)
  assert.strictEqual(b, h.beginFirstDayIntro(lesson))
  await assert.rejects(h.completeFirstDayIntro(lesson, 'a'.repeat(64)), /own login/)
  h.requests[1].resolve({ playbackId: 'b'.repeat(64) })
  await b
  const complete = h.completeFirstDayIntro(lesson, 'b'.repeat(64))
  assert.deepEqual(JSON.parse(h.requests[2].options.body), { lessonId: lesson, playbackId: 'b'.repeat(64), videoEnded: true })
  h.requests[2].resolve({ introSeen: true })
  await complete
  const newVisit = h.beginFirstDayIntro(lesson)
  assert.equal(h.requests.length, 4, 'completed intro is never cached as next-visit permission')
  h.requests[3].resolve({ playbackId: 'c'.repeat(64) })
  await newVisit
})

test('intro failures retry and a login change during completion cannot finish the new lesson', async () => {
  const h = serviceHarness()
  const failed = h.beginFirstDayIntro(lesson)
  h.requests[0].reject(Error('Offline'))
  await assert.rejects(failed, /Offline/)
  const retried = h.beginFirstDayIntro(lesson)
  h.requests[1].resolve({ playbackId: 'a'.repeat(64) })
  await retried
  const complete = h.completeFirstDayIntro(lesson, 'a'.repeat(64))
  h.setToken('fixture-B')
  h.requests[2].resolve({ introSeen: true })
  await assert.rejects(complete, /previous login/)
})

function introFunction(name, context) {
  const tree = ts.createSourceFile('intro.tsx', intro, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let found
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node; ts.forEachChild(node, visit) }
  visit(tree)
  assert(found, 'Actual intro handler exists')
  const exports = {}
  vm.runInNewContext(ts.transpileModule('exports.handler = ' + found.getText(tree), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
  } }).outputText, { exports, ...context })
  return exports.handler
}

test('real ended handler waits for the backend and cannot continue on save failure or double-ended events', async () => {
  let resolve, reject, completed = 0, calls = 0
  let request = new Promise((ok, fail) => { resolve = ok; reject = fail })
  const completing = { current: false }
  const finish = introFunction('finish', {
    completing, video: { current: { muted: false, pause() {} } }, watchedUntil: { current: 90 },
    REQUIRED_WATCH_SECONDS: 85, firstDayOnly: true, lessonId: lesson, playbackId: 'a'.repeat(64),
    completeFirstDayIntro: () => { calls++; return request },
    setLoading() {}, setNeedsTap() {}, setError() {}, onDone: () => { completed++ },
    document: { fullscreenElement: null }, frame: { current: {} },
  })
  const failed = finish()
  await finish()
  assert.equal(calls, 1)
  assert.equal(completed, 0)
  reject(Error('Offline'))
  await failed
  assert.equal(completed, 0)
  request = Promise.resolve()
  await finish()
  assert.equal(completed, 1)
})

test('late video metadata cannot erase an earlier server-intro failure and hide recovery', () => {
  let error = 'Your story could not open. Please try again.'
  const validate = introFunction('validateVideo', {
    video: { current: { duration: 90 } }, watchedUntil: { current: 0 },
    MIN_DURATION_SECONDS: 87, MAX_DURATION_SECONDS: 93,
    setCanPlay() {}, setLoading() {}, setError: next => { error = next }, onAvailable() {},
  })
  validate()
  assert.match(error, /try again/)
})
