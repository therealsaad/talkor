const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTS } = require('./helpers/load-ts.cjs')

const t = loadTS('services/kg-turn-timing.ts')
const clock = (...ticks) => { let i = 0; return () => ticks[Math.min(i++, ticks.length - 1)] }

test('the timer records each step, adds repeats and still records when work throws', async () => {
  const timer = t.createTurnTimer(clock(0, 10, 50, 60, 65, 200))
  await timer.time('stt', async () => 'ok')
  await assert.rejects(timer.time('feedback', async () => { throw new Error('boom') }), /boom/)
  const done = timer.finish()
  assert.equal(done.steps.stt, 40)
  assert.equal(done.steps.feedback, 5)
  assert.equal(done.steps.total, 200)
})

test('slowest step ignores the total and header is readable in a network panel', () => {
  const steps = { stt: 412, feedback: 3, total: 455 }
  assert.equal(t.slowestStep(steps), 'stt')
  assert.equal(t.slowestStep({ total: 9 }), undefined)
  assert.equal(t.serverTimingHeader(steps), 'stt;dur=412, feedback;dur=3, total;dur=455')
})

test('a slow turn is always a warning; routine lines can be switched off', () => {
  const seen = []
  const log = { info: (m, e) => seen.push(['info', e]), warn: (m, e) => seen.push(['warn', e]) }
  const fast = { steps: { stt: 100, total: 150 }, notes: {} }
  const slow = { steps: { stt: 3000, total: 3100 }, notes: { feedbackSource: 'qwen-8002' } }
  t.logTurnTiming(log, 'attempt', fast, { submissionId: 's1' }, { slowMs: 2500 })
  t.logTurnTiming(log, 'attempt', fast, { submissionId: 's1' }, { enabled: false, slowMs: 2500 })
  t.logTurnTiming(log, 'attempt', slow, { submissionId: 's2' }, { enabled: false, slowMs: 2500 })
  assert.deepEqual(seen.map((x) => x[0]), ['info', 'warn'])
  assert.equal(seen[1][1].slowestStep, 'stt')
  assert.equal(seen[1][1].slow, true)
})

test('logged entries carry no child data, only the allowed keys', () => {
  let entry
  t.logTurnTiming({ info: (m, e) => { entry = e }, warn() {} }, 'attempt', { steps: { stt: 5, total: 9 }, notes: { sttProvider: 'sarvam' } }, { submissionId: 'abc', outcome: 'correct', mode: 'speak' })
  const allowed = new Set(['phase', 'submissionId', 'outcome', 'mode', 'stt', 'total', 'slowestStep', 'slow', 'sttProvider'])
  for (const key of Object.keys(entry)) assert.ok(allowed.has(key), key)
})

test('slow threshold parsing is clamped and falls back', () => {
  assert.equal(t.parseSlowTurnMs(undefined), 2500)
  assert.equal(t.parseSlowTurnMs('abc'), 2500)
  assert.equal(t.parseSlowTurnMs('10'), 500)
  assert.equal(t.parseSlowTurnMs('999999'), 30000)
  assert.equal(t.parseSlowTurnMs('1800'), 1800)
})

test('summary gives p50/p95 per step and the Qwen and cache shares, ignoring other lines', () => {
  const line = (e) => '2026-11-03 INFO ' + JSON.stringify({ message: 'KG turn timing', ...e })
  const lines = [
    'unrelated', '{not json',
    line({ phase: 'attempt', stt: 100, feedback: 2, total: 120, feedbackSource: 'guided' }),
    line({ phase: 'attempt', stt: 300, feedback: 1500, total: 1900, feedbackSource: 'qwen-8002', slow: false }),
    line({ phase: 'audio', tts: 5, total: 6, ttsSource: 'cache' }),
    line({ phase: 'audio', tts: 600, total: 610, ttsSource: 'azure', slow: true }),
  ]
  const report = t.summarizeTurnTimings(lines)
  assert.equal(report.turns, 4)
  assert.equal(report.slow, 1)
  assert.equal(report.qwenShare, 0.5)
  assert.equal(report.cacheShare, 0.5)
  const feedback = report.steps.find((s) => s.step === 'feedback')
  assert.deepEqual([feedback.count, feedback.p50, feedback.max], [2, 2, 1500])
})
