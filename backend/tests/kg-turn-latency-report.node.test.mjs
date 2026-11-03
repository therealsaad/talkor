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
