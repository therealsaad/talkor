import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'

async function load(path, extra = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const exports = {}
  vm.runInNewContext(compiled, { exports, URLSearchParams, ...extra }, { filename: path })
  return exports
}
const mod = await load('../../lib/lesson-turn-telemetry.ts')
const { createTurnTelemetry, isTelemetryRequested, fingerprint, summarize, METRICS, STAGES } = mod

function rig(overrides = {}) {
  let time = 1000
  let session = 'student-a'
  const t = createTurnTelemetry({
    enabled: () => overrides.enabled ?? true, now: () => time, network: () => '4g 1.5Mbps rtt120',
    session: () => fingerprint(session), date: () => '2026-11-06T10:00:00.000Z',
  })
  return { t, tick: (ms) => { time += ms }, login: (who) => { session = who } }
}
// Objects built inside the vm have another Object prototype; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value))

// One full speaking turn on a fake clock; returns its id.
function fullTurn({ t, tick }, id, gaps = {}) {
  const g = { silence: 300, record: 40, up: 600, dl: 80, play: 20, speak: 1500, ack: 90, ...gaps }
  t.mark('speechEnd', 'kg1')
  tick(g.silence); t.mark('recorderStop', 'kg1')
  tick(10); t.bind(id); t.markFor(id, 'requestStart')
  tick(g.up); t.markFor(id, 'apiResponse')
  t.markFor(id, 'audioRequestStart'); tick(g.dl); t.markFor(id, 'audioDownloaded')
  tick(g.play); t.markFor(id, 'audioPlaying')
  tick(g.speak); t.markFor(id, 'audioEnded')
  tick(g.ack); t.markFor(id, 'ackDone')
}

test('a full turn yields every metric, including the child-perceived wait', () => {
  const r = rig()
  fullTurn(r, 'turn1')
  const [turn] = r.t.report().turns
  assert.deepEqual(plain(turn.metrics), {
    silenceWait: 300, attemptRequest: 600, audioDownload: 80, toAudioStart: 100, childWait: 300 + 10 + 600 + 80 + 20,
    recorderToAudio: 710, ackWait: 90,
  })
  assert.equal(turn.complete, true)
  assert.equal(turn.level, 'kg1')
  assert.equal(turn.network, '4g 1.5Mbps rtt120')
})

test('everything is a no-op unless a supervisor asked for it', () => {
  const r = rig({ enabled: false })
  fullTurn(r, 'turn1')
  assert.equal(r.t.report().turns.length, 0)
  assert.equal(isTelemetryRequested(undefined), false)
  assert.equal(isTelemetryRequested(''), false)
  assert.equal(isTelemetryRequested('?latency=0'), false)
  assert.equal(isTelemetryRequested('?latency=1'), true)
  assert.equal(isTelemetryRequested('?x=2&latency=1'), true)
})

test('a replayed sound does not rewrite the first measurement', () => {
  const r = rig()
  fullTurn(r, 'turn1')
  r.tick(5000); r.t.markFor('turn1', 'audioPlaying'); r.t.markFor('turn1', 'ackDone')
  assert.equal(r.t.report().turns[0].metrics.toAudioStart, 100)
  assert.equal(r.t.report().turns[0].metrics.ackWait, 90)
})

test('a missing moment drops only its own metric, and an unfinished turn is reported as incomplete', () => {
  const r = rig()
  r.t.mark('recorderStop', 'kg1')
  r.tick(10); r.t.bind('turn1'); r.t.markFor('turn1', 'requestStart')
  r.tick(400); r.t.markFor('turn1', 'apiResponse')
  const [turn] = r.t.report().turns
  assert.deepEqual(plain(turn.metrics), { attemptRequest: 400 })
  assert.equal(turn.complete, false)
})

test('marks for an unknown turn are ignored', () => {
  const r = rig()
  r.t.markFor('nope', 'audioPlaying')
  assert.equal(r.t.report().turns.length, 0)
})

test('shared computer: a different login never sees the previous student\'s measurements', () => {
  const r = rig()
  fullTurn(r, 'a1'); fullTurn(r, 'a2')
  assert.equal(r.t.report().turns.length, 2)
  r.login('student-b')
  r.t.mark('speechEnd', 'kg1')      // B starts speaking
  assert.equal(r.t.report().turns.length, 0, 'A\'s turns are gone as soon as B records anything')
  r.t.markFor('a1', 'ackDone')     // a late event from A's session must not resurrect anything
  fullTurn(r, 'b1')
  assert.deepEqual(plain(r.t.report().turns.map((x) => x.submissionId)), ['b1'])
})

test('even reading the report as a different login shows nothing from the previous student', () => {
  const r = rig()
  fullTurn(r, 'a1')
  r.login('student-b')
  assert.equal(r.t.report().turns.length, 0)
})

test('an unbound turn left open by one student is not attached to the next student', () => {
  const r = rig()
  r.t.mark('speechEnd', 'kg1')
  r.login('student-b')
  r.t.mark('recorderStop', 'kg1')
  r.t.bind('b1')
  const [turn] = r.t.report().turns
  assert.equal(turn.metrics.silenceWait, undefined, 'A\'s speechEnd did not carry over')
})

test('an abandoned turn is replaced instead of mixing two turns together', () => {
  const r = rig()
  r.t.mark('speechEnd', 'kg1')
  r.tick(20000)
  r.t.mark('recorderStop', 'kg1')
  r.t.bind('late')
  assert.equal(r.t.report().turns[0].metrics.silenceWait, undefined)
})

test('the report carries only times and labels, never anything about the child', () => {
  const r = rig()
  fullTurn(r, 'abc123')
  const report = r.t.report()
  assert.deepEqual(plain(Object.keys(report).sort()), ['generatedAt', 'summary', 'turns'])
  assert.deepEqual(plain(Object.keys(report.turns[0]).sort()), ['complete', 'level', 'metrics', 'network', 'submissionId'])
  const metricNames = new Set(METRICS.map((m) => m.name))
  for (const key of Object.keys(report.turns[0].metrics)) assert.ok(metricNames.has(key), key)
  assert.ok(!/token|pin|transcript|audio\b|name/i.test(Object.keys(report.turns[0]).join(' ')))
  assert.equal(STAGES.length, 12)
})

test('the login fingerprint is only used for comparison and never contains the token', () => {
  assert.equal(fingerprint(null), '')
  assert.equal(fingerprint('abc'), fingerprint('abc'))
  assert.notEqual(fingerprint('abc'), fingerprint('abd'))
  assert.ok(!fingerprint('eyJhbGciOi.secret.token').includes('secret'))
})

test('summary gives p50, p95 and max per metric across turns', () => {
  const turns = [100, 200, 300, 400, 5000].map((ms) => ({ metrics: { childWait: ms } }))
  const [row] = summarize(turns)
  assert.deepEqual([row.metric, row.count, row.p50, row.p95, row.max], ['childWait', 5, 300, 5000, 5000])
  assert.deepEqual(plain(summarize([])), [])
})

test('the 200-turn cap drops the oldest turn first', () => {
  const r = rig()
  for (let i = 0; i < 205; i++) { r.t.mark('recorderStop', 'kg1'); r.t.bind('t' + i) }
  const ids = r.t.report().turns.map((x) => x.submissionId)
  assert.equal(ids.length, 200)
  assert.equal(ids[0], 't5')
})


test('Class 1 voice measures STT, teaching, and real browser playback on one monotonic clock', () => {
  const r = rig()
  r.t.mark('speechEnd', 'g01-l01')
  r.tick(1350)
  r.t.mark('recorderStop', 'g01-l01')
  r.t.bind('anonymous-class1-turn')
  r.t.markFor('anonymous-class1-turn', 'requestStart')
  r.tick(500)
  r.t.markFor('anonymous-class1-turn', 'sttDone')
  r.t.markFor('anonymous-class1-turn', 'teachingStart')
  r.tick(680)
  r.t.markFor('anonymous-class1-turn', 'teachingDone')
  r.t.markFor('anonymous-class1-turn', 'apiResponse')
  r.t.markFor('anonymous-class1-turn', 'audioRequestStart')
  r.tick(1000)
  r.t.markFor('anonymous-class1-turn', 'audioPlaying')
  r.tick(1600)
  r.t.markFor('anonymous-class1-turn', 'audioEnded')
  r.tick(80)
  r.t.markFor('anonymous-class1-turn', 'ackDone')
  const [entry] = r.t.report().turns
  assert.equal(entry.level, 'g01-l01')
  assert.equal(entry.complete, true)
  assert.deepEqual(plain(entry.metrics), {
    silenceWait: 1350, attemptRequest: 1180, speechToText: 500, aiTeaching: 680,
    toAudioStart: 1000, childWait: 3530, recorderToAudio: 2180, ackWait: 80,
  })
  assert.ok(!('audioDownload' in entry.metrics), 'no invented download stage for Class 1')
})

test('Class 1 frontend instrumentation stays opt-in and preserves the voice/progress protocol', async () => {
  const lesson = await readFile(new URL('../../components/lessons/lesson-experience.tsx', import.meta.url), 'utf8')
  const hook = await readFile(new URL('../../hooks/use-miss-julie-voice.ts', import.meta.url), 'utf8')
  for (const stage of ['recorderStop', 'requestStart', 'sttDone', 'teachingStart', 'teachingDone',
    'apiResponse', 'audioRequestStart', 'audioPlaying', 'audioEnded', 'ackDone']) {
    assert.match(lesson, new RegExp("mark(?:For)?\([^\n]*'" + stage + "'"), stage)
  }
  assert.match(lesson, /isTelemetryRequested\(window\.location\.search\)/)
  assert.match(lesson, /setTelemetrySession\(\(\) => getStoredToken\(\)\)/)
  assert.match(lesson, /globalThis\.crypto\?\.randomUUID\?\.\(\)/)
  assert.match(lesson, /<LatencyReportButton \/>/)
  assert.match(hook, /onPlaybackState\?\.\(nextState\)/)
  assert.match(lesson, /if \(acknowledged && telemetryTurnId\) lessonTurnTelemetry\.markFor/)
  assert.doesNotMatch(lesson, /sendBeacon\(|localStorage\.setItem\('latency'/)
})

test('wiring: it only observes, clears on page close, and does not touch the silence decision', async () => {
  const lib = await readFile(new URL('../../lib/lesson-turn-telemetry.ts', import.meta.url), 'utf8')
  assert.match(lib, /addEventListener\('pagehide', \(\) => lessonTurnTelemetry\.clear\(\)\)/)
  assert.doesNotMatch(lib, /localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon/)
  const vad = await readFile(new URL('../../lib/voice-activity.ts', import.meta.url), 'utf8')
  assert.match(vad, /shouldStopRecording\(\{ now, startedAt, lastVoiceAt, heardVoice, voicedMs/)
  assert.match(vad, /onSilence\(\{ lastVoiceAt, stoppedAt: now, heardVoice \}\)/)
  const service = await readFile(new URL('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts', import.meta.url), 'utf8')
  for (const stage of ['requestStart', 'apiResponse', 'audioRequestStart', 'audioDownloaded', 'audioPlaying', 'audioEnded', 'ackDone']) {
    assert.match(service, new RegExp(`markFor\\([^)]*'${stage}'`), stage)
  }
  assert.match(service, /setTelemetrySession\(\(\) => getStoredToken\(\)\)/)
  const lesson = await readFile(new URL('../../features/lessons/grades/kg/level-01/LevelExperience.tsx', import.meta.url), 'utf8')
  assert.match(lesson, /lessonTurnTelemetry\.mark\('recorderStop', 'kg1'\)/)
  assert.match(lesson, /lessonTurnTelemetry\.mark\('speechEnd', 'kg1', info\.lastVoiceAt\)/)
})
