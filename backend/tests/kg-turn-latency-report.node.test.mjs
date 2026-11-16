import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeKGLatency } from '../scripts/report-kg-turn-latency.mjs'
const log = (data) => '2026-11-03T08:00:00Z INFO ' + JSON.stringify({
  level: 'info', time: '2026-11-03T08:00:00Z', message: 'KG turn timing', ...data,
})
const id = (n) => 'test-submission-' + n

test('real pair aggregation uses request phases, correlates IDs without disclosing them', () => {
  const events = [
    log({ submissionId: id(1), phase: 'attempt', stt: 900, feedback: 30, save: 20, total: 1000, feedbackSource: 'guided', transcript: 'PRIVATE CHILD UTTERANCE', studentName: 'PRIVATE NAME' }),
    log({ submissionId: id(1), phase: 'audio', tts: 300, total: 350, ttsSource: 'azure' }),
    log({ submissionId: id(2), phase: 'attempt', stt: 1200, feedback: 500, total: 2000, feedbackSource: 'qwen-8002' }),
    log({ submissionId: id(2), phase: 'audio', tts: 450, total: 500, ttsSource: 'cache' }),
    log({ submissionId: id(2), phase: 'audio', tts: 7000, total: 9000, ttsSource: 'azure' }), // duplicate retry ignored
    log({ submissionId: id(3), phase: 'attempt', stt: 500, total: 700 }), // incomplete audio
    log({ submissionId: id(4), phase: 'audio', tts: 300, total: 340 }), // orphan audio
    '{"message":"KG turn timing","phase":"attempt","submissionId":"x","total":0}',
    '{"message":"KG turn timing","phase":"attempt","submissionId":"bad-99","total":-2}',
    '{"message":"OTHER TYPE","transcript":"SENSITIVE"}',
  ]
  const report = analyzeKGLatency(events, { minPairs: 2, budgetP95Ms: 2600 })
  assert.equal(report.counts.correlatedTurns, 2)
  assert.equal(report.counts.unmatchedAttempts, 1)
  assert.equal(report.counts.unmatchedAudio, 1)
  assert.equal(report.counts.duplicateLogLines, 1)
  assert.equal(report.serverRequestSum.p50Ms, 1350)
  assert.equal(report.serverRequestSum.p95Ms, 2500)
  assert.equal(report.feedback.qwenAttempts, 1)
  assert.equal(report.voice.cachedAudioRequests, 1)
  assert.equal(report.gate, 'PASS_SERVER_BUDGET')
  assert.equal(report.deviceMicrophone, 'NOT_VERIFIED_BY_SERVER_LOGS')
  const serialized = JSON.stringify(report)
  for (const secret of ['PRIVATE CHILD UTTERANCE', 'PRIVATE NAME', id(1), id(2), 'bad-99']) {
    assert.equal(serialized.includes(secret), false, 'must redact ' + secret)
  }
})

test('fails closed for zero samples, incomplete pairs and slow correlated turns', () => {
  assert.equal(analyzeKGLatency([], { minPairs: 1 }).gate, 'INSUFFICIENT_REAL_SAMPLES')
  assert.equal(analyzeKGLatency([log({ submissionId: id(1), phase: 'attempt', total: 90 })], { minPairs: 1 }).gate, 'INSUFFICIENT_REAL_SAMPLES')
  const inputs = [
    log({ submissionId: id(1), phase: 'attempt', total: 3000 }),
    log({ submissionId: id(1), phase: 'audio', total: 3000 }),
  ]
  assert.equal(analyzeKGLatency(inputs, { minPairs: 1, budgetP95Ms: 3000 }).gate, 'SLOW_SERVER_REQUEST_SUM')
  assert.throws(() => analyzeKGLatency(inputs, { minPairs: 0 }), /Invalid minimum/)
  assert.throws(() => analyzeKGLatency(inputs, { budgetP95Ms: 1 }), /Invalid latency/)
})

test('step stats do not include invalid/unrelated numbers or throw on missing provider annotations', () => {
  const samples = [
    log({ submissionId: id(2), phase: 'attempt', stt: -1, total: 600 }),
    log({ submissionId: id(2), phase: 'audio', tts: 121000, total: 300 }),
  ]
  const r = analyzeKGLatency(samples, { minPairs: 1, budgetP95Ms: 1000 })
  assert.equal(r.stepMeasurements.stt, null)
  assert.equal(r.stepMeasurements.tts, null)
  assert.equal(r.serverRequestSum.p50Ms, 900)
  assert.equal(r.gate, 'PASS_SERVER_BUDGET')
})

test('Python provider-attempt logs are reported separately and do not double-count AI turns', () => {
  const pythonAttempt = (requestId, durationMs, outcome = 'success') =>
    'INFO ' + JSON.stringify({ message: 'AI Python request timing', requestId, provider: 'python-qwen',
      model: 'configured-python-service', durationMs, outcome, studentName: 'PRIVATE' })
  const aiTurn = (requestId, llm) =>
    'INFO ' + JSON.stringify({ message: 'AI turn timing', phase: 'ai', requestId, llm,
      cohort: 'class1-l1', provider: 'python-qwen', model: 'configured-python-service' })
  const report = analyzeKGLatency([
    pythonAttempt('bridge-1', 80, 'failure'),
    aiTurn('turn-1', 120),
    pythonAttempt('bridge-2', 90),
    aiTurn('turn-2', 150),
  ], { minPairs: 4 })
  assert.equal(report.counts.aiRequests, 2)
  assert.equal(report.counts.pythonProviderAttempts, 2)
  assert.deepEqual(report.aiLatencyByCohortProviderModel, [
    { cohort: 'class1-l1', provider: 'python-qwen', model: 'configured-python-service',
      count: 2, p50Ms: 120, p95Ms: 150, maxMs: 150 },
  ])
  assert.deepEqual(report.pythonProviderAttemptLatencyByProviderModel, [
    { provider: 'python-qwen', model: 'configured-python-service',
      count: 2, p50Ms: 80, p95Ms: 90, maxMs: 90 },
  ])
  assert.equal(report.gate, 'INSUFFICIENT_REAL_SAMPLES')
  assert.equal(JSON.stringify(report).includes('bridge-1'), false)
})

test('AI reports group p50/p95 and counts by cohort, provider and model without exposing request IDs', () => {
  const ai = (requestId, llm, cohort = 'class1-l1', provider = 'python-qwen', model = 'configured-python-service') =>
    'INFO ' + JSON.stringify({ message: 'AI turn timing', phase: 'ai', requestId, llm, cohort, provider, model,
      studentName: 'PRIVATE', transcript: 'PRIVATE UTTERANCE' })
  const report = analyzeKGLatency([
    ai('random-a', 100), ai('random-b', 200), ai('random-c', 300), ai('random-d', 400),
    ai('random-e', 500, 'kg', 'qwen', 'qwen3'),
  ], { minPairs: 4 })
  assert.deepEqual(report.aiLatencyByCohortProviderModel, [
    { cohort: 'class1-l1', provider: 'python-qwen', model: 'configured-python-service', count: 4, p50Ms: 200, p95Ms: 400, maxMs: 400 },
    { cohort: 'kg', provider: 'qwen', model: 'qwen3', count: 1, p50Ms: 500, p95Ms: 500, maxMs: 500 },
  ])
  const serialized = JSON.stringify(report)
  for (const secret of ['random-a', 'PRIVATE', 'PRIVATE UTTERANCE']) assert.equal(serialized.includes(secret), false)
  assert.equal(report.gate, 'INSUFFICIENT_REAL_SAMPLES')
})
