import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

const compile = async (path) => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const plain = (value) => JSON.parse(JSON.stringify(value))

const telemetryExports = {}
vm.runInNewContext(await compile('../../lib/lesson-turn-telemetry.ts'), { exports: telemetryExports, URLSearchParams })
const { createTurnTelemetry, fingerprint } = telemetryExports

const RECEIPT = 'v1.1.' + 'a'.repeat(32) + '.' + 'b'.repeat(64)

// Loads one of the two student services with a fake network and a fake audio element on one fake clock.
async function loadService(path, exportName) {
  let time = 0
  let token = 'student-a'
  let session = () => fingerprint(token)
  const telemetry = createTurnTelemetry({ enabled: () => true, now: () => time, session: () => session(), network: () => '4g' })
  const apiClient = async (url) => { if (url.includes('/intro/start')) return { playbackId: 'ticket-1' }; time += url.includes('/attempt') && !url.includes('feedback-played') ? 700 : 60; return { ok: true, url } }
  const apiClientBlob = async (url, _options, onHeaders) => { time += 200; onHeaders?.(new Headers({ 'X-KG-Feedback-Receipt': RECEIPT })); return new Blob(['x']) }
  const exports = {}
  const context = {
    exports, module: { exports }, console, Error, DOMException, Headers, Blob, Promise, Map, Set, FileReader: class {},
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL: () => undefined },
    window: { setTimeout, clearTimeout },
    require: (id) => {
      if (id === '@/lib/api-client') return { apiClient, apiClientBlob, getStoredToken: () => token }
      if (id === '@/lib/lesson-turn-telemetry') return { lessonTurnTelemetry: telemetry, setTelemetrySession: (reader) => { session = () => fingerprint(reader()) } }
      return {}
    },
  }
  vm.runInNewContext(await compile(path), context, { filename: path })
  const audio = { onended: null, onerror: null, onplaying: null, src: '', currentTime: 0, pause() {},
    play() { time += 30; Promise.resolve().then(() => { audio.onplaying?.(); time += 1500; audio.onended?.() }); return Promise.resolve() } }
  // The real services only accept a lesson call once the introduction ticket exists for this login.
  await (exportName === 'kgLevel2StudentService' ? exports[exportName].beginIntro() : exports[exportName].beginIntro(4))
  return { service: exports[exportName], audio, telemetry, tick: (ms) => { time += ms }, setToken: (value) => { token = value } }
}

const cases = [
  { name: 'KG2', path: '../../features/lessons/grades/kg/level-02/services/kg-level2-student-service.ts', exportName: 'kgLevel2StudentService',
    submit: (s, id) => s.submit({ letter: 'A', submissionId: id, durationMs: 900, noSpeech: true }),
    play: (s, id, audio) => s.playFeedback(id, audio), ack: (s, id) => s.acknowledge(id) },
  { name: 'KG3-5', path: '../../features/lessons/grades/kg/continuation/continuation-service.ts', exportName: 'kgContinuationStudentService',
    submit: (s, id) => s.submit(4, { letter: 'A', submissionId: id, durationMs: 900, noSpeech: true }),
    play: (s, id, audio) => s.playFeedback(4, id, audio), ack: (s, id) => s.acknowledge(4, id) },
]

for (const c of cases) {
  test(`${c.name}: a whole turn is measured stage by stage and the lesson result is unchanged`, async () => {
    const { service, audio, telemetry, tick } = await loadService(c.path, c.exportName)
    telemetry.mark('speechEnd', 'kg', 0)
    tick(300); telemetry.mark('recorderStop', 'kg')
    const result = await c.submit(service, 'turn' + c.name.length)
    assert.equal(result.ok, true, 'the attempt response is passed through untouched')
    await c.play(service, 'turn' + c.name.length, audio)
    await c.ack(service, 'turn' + c.name.length)
    const [turn] = plain(telemetry.report().turns)
    assert.equal(turn.complete, true)
    assert.equal(turn.metrics.silenceWait, 300)
    assert.equal(turn.metrics.attemptRequest, 700)
    assert.equal(turn.metrics.audioDownload, 200)
    assert.equal(turn.metrics.ackWait, 60)
    assert.ok(turn.metrics.toAudioStart >= 230, 'download plus start of playback')
    assert.ok(turn.metrics.childWait > turn.metrics.attemptRequest)
  })

  test(`${c.name}: playback still ends before the acknowledgement is allowed`, async () => {
    const { service, audio } = await loadService(c.path, c.exportName)
    await assert.rejects(Promise.resolve().then(() => c.ack(service, 'never-played')), /Listen to Miss Julie/)
    await c.play(service, 'p1', audio)
    await c.ack(service, 'p1')
  })

  test(`${c.name}: a new login does not inherit the last student's turns`, async () => {
    const { service, audio, telemetry, setToken } = await loadService(c.path, c.exportName)
    telemetry.mark('recorderStop', 'kg')
    await c.submit(service, 'a1'); await c.play(service, 'a1', audio); await c.ack(service, 'a1')
    assert.equal(telemetry.report().turns.length, 1)
    setToken('student-b')
    assert.equal(telemetry.report().turns.length, 0)
  })
}

test('wiring: both experiences mark speech end and recorder stop and offer the supervisor report', async () => {
  for (const [path, label] of [['../../features/lessons/grades/kg/level-02/StudentExperience.tsx', "'kg2'"], ['../../features/lessons/grades/kg/continuation/ContinuationExperience.tsx', "'kg' + state.level"]]) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.ok(source.includes(`lessonTurnTelemetry.mark('recorderStop', ${label})`), path)
    assert.ok(source.includes(`lessonTurnTelemetry.mark('speechEnd', ${label}, info.lastVoiceAt)`), path)
    assert.match(source, /<LatencyReportButton \/>/)
    assert.match(source, /shouldStop|watchVoiceActivity\(stream, \(info\) =>/)
  }
  for (const path of ['../../features/lessons/grades/kg/level-02/services/kg-level2-student-service.ts', '../../features/lessons/grades/kg/continuation/continuation-service.ts']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /setTelemetrySession\(\(\) => getStoredToken\(\)\)/, path)
    assert.doesNotMatch(source, /localStorage|sendBeacon/, path)
  }
})
