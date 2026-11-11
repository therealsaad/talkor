/** Cross-check two local checkouts using the real provider and FastAPI route.
 * Builds must exist. Creates only its own loopback server, blocks model network
 * calls in that child, and accepts no school database or external target URL.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const checkout = process.env.TALKORA_AI_CHECKOUT
if (!checkout) throw Error('Set TALKORA_AI_CHECKOUT to the local talkora-ai-private checkout')
const ai = path.resolve(checkout, 'talkora-ai-starter')
assert(existsSync(path.join(ai, 'server/main.py')), 'Expected talkora-ai-starter/server.main')
const reserve = createServer()
await new Promise((resolve, reject) => { reserve.once('error', reject); reserve.listen(0, '127.0.0.1', resolve) })
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))
const key = randomBytes(32).toString('hex')
const address = 'http://127.0.0.1:' + port
Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex'),
  TALKORA_SERVICE_KEY: key, TALKORA_CLASS1_AI_URL: address })
const require = createRequire(path.join(backend, 'package.json'))
const { PythonAIProvider } = require(path.join(backend, 'dist/providers/ai/PythonAIProvider.js'))
const { buildLessonTeachingContext, selectLessonSupport } = require(path.join(backend, 'dist/services/lesson-teaching-context.js'))
const { FIRST_DAY_SCENES } = require(path.join(backend, 'dist/scripts/class1-first-day-scenes.js'))
const { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS, FIRST_DAY_POEM_WORD_BANK } = require(path.join(backend, 'dist/curriculum/class1-first-day-poem.js'))
const { FIRST_DAY_TEACHING_SOURCE } = require(path.join(backend, 'dist/curriculum/first-day-teaching-source.js'))
const program = [
  'import httpx, uvicorn',
  'class NoModelNetwork:',
  '    def __init__(self, *args, **kwargs): raise RuntimeError("Model network prohibited in wire verification")',
  'httpx.AsyncClient = NoModelNetwork',
  'uvicorn.run("server.main:app", host="127.0.0.1", port=' + port + ', log_level="info", use_colors=False)',
].join('\n')
const server = spawn(process.env.TALKORA_TEST_PYTHON || 'python', ['-c', program], {
  cwd: ai, env: { ...process.env, PYTHONPATH: ai, TALKORA_ENV: 'test',
    TALKORA_CLASS1_QWEN_PILOT: 'true', TALKORA_CLASS1_HINTS_APPROVED: 'false' }, stdio: 'pipe',
})
let log = '', spawnError
server.on('error', error => { spawnError = error })
server.stdout.on('data', chunk => { log = (log + chunk).slice(-6000) })
server.stderr.on('data', chunk => { log = (log + chunk).slice(-6000) })
try {
  for (let i = 0; ; i++) {
    if (spawnError || server.exitCode !== null) throw Error('Owned Python fixture failed to start')
    if (log.includes('Uvicorn running on ' + address)) break
    if (i >= 200) throw Error('Owned Python fixture did not become ready')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const records = [
    ...FIRST_DAY_SCENES.map(scene => ({ sceneKey: scene.key, title: scene.title,
      activity: { activityKey: 'class1-l01-v3-' + scene.key, prompt: scene.prompt,
        modelSentence: scene.sentence, metadata: { sceneKey: scene.key,
          allowedVocabulary: [...scene.vocabulary], teaching: { ...FIRST_DAY_TEACHING_SOURCE } } } })),
    ...FIRST_DAY_POEM_STEPS.map(step => ({ sceneKey: step.key, title: step.title,
      activity: { activityKey: 'class1-l01-v4-' + step.key, prompt: 'Listen to the current approved poem lines.',
        content: { poemLines: FIRST_DAY_POEM_LINES.slice(step.start, step.end) },
        metadata: { sceneKey: step.key, allowedVocabulary: [...FIRST_DAY_POEM_WORD_BANK],
          teaching: { ...FIRST_DAY_TEACHING_SOURCE, hints: { en: null, hi: step.hintHi, mr: step.hintMr } } } } })),
  ]
  const cases = []
  for (const row of records) {
    const context = buildLessonTeachingContext({ grade: 1, lessonKey: 'g01-l01', activity: row.activity,
      settings: { lessonPlanRevision: 'synthetic-cross-repo-wire-v1' },
      support: selectLessonSupport({ attempts: [] }) })
    assert(context, 'The authored scene must produce a teaching context')
    const response = await new PythonAIProvider().generate({ studentName: 'Learner', grade: 1,
      levelId: 'g01-l01', levelTitle: 'My First Day', lessonTitle: 'My First Day',
      activityTitle: row.title, activityTarget: context.teacherQuestion, sceneKey: row.sceneKey,
      allowedVocabulary: context.vocabulary, teachingContext: context,
      recentMistakes: [], memoryFacts: [], conversationHistory: [],
      promptContext: 'speaking', studentMessage: 'repeat' })
    assert.equal(response.modelSentence, context.modelLines.join('\n'), 'Current approved model must survive the wire')
    assert.equal(response.activityComplete, false)
    assert.equal(response.xpAwarded, 0)
    assert.deepEqual(response.memoryUpdates, [])
    cases.push({ sceneKey: row.sceneKey, contextCharacters: JSON.stringify(context).length, passed: true })
  }
  const report = { scenario: 'Real Node provider -> owned loopback FastAPI; synthetic curriculum turns',
    passed: cases.length, modelCallsAllowed: false, paidSpeechCalls: 0,
    physicalAudioTested: false, productionTested: false, cases }
  if (process.env.TALKORA_TEACHING_WIRE_REPORT)
    await writeFile(process.env.TALKORA_TEACHING_WIRE_REPORT, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  server.kill('SIGTERM')
  if (server.exitCode === null) await new Promise(resolve => {
    const timer = setTimeout(() => { server.kill('SIGKILL'); resolve() }, 5000)
    server.once('exit', () => { clearTimeout(timer); resolve() })
  })
}
