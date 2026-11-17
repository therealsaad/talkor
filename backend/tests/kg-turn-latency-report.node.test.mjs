import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { analyzeKGLatency, run } from '../scripts/report-kg-turn-latency.mjs'
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

// ---- AI provider records (added) -------------------------------------------------------------------------------
// The golden file is the output of the ORIGINAL report script on a real-shaped legacy KG log.
const golden = JSON.parse(readFileSync(new URL('./fixtures/kg-latency-legacy-golden.json', import.meta.url), 'utf8'))
const ai = (llm, o = {}) => '2026-11-16T08:00:00Z INFO ' + JSON.stringify({
  level: 'info', time: '2026-11-16T08:00:00Z', message: 'AI turn timing', phase: 'ai', outcome: 'success',
  cohort: 'class1-l1', provider: 'python-qwen', model: 'class1-python-brain', llm, ...o,
})
const withoutAi = (report) => { const { aiProviderLatency, ...rest } = report; delete rest.recordedAt; return rest }

test('old KG logs give exactly the same report as before: only the new AI block is added, and it is empty', () => {
  const report = analyzeKGLatency(golden.lines, golden.options)
  assert.deepEqual(withoutAi(report), golden.report)
  assert.deepEqual(report.aiProviderLatency.groups, [])
  assert.equal(report.aiProviderLatency.totalRecords, 0)
})

test('AI records mixed into a KG log never change any KG statistic, count or gate', () => {
  const mixed = []
  golden.lines.forEach((line, index) => { mixed.push(line); mixed.push(ai(100 + index * 10, { provider: index % 2 ? 'groq' : 'python-qwen' })) })
  const report = analyzeKGLatency(mixed, golden.options)
  assert.deepEqual(withoutAi(report), golden.report)
  assert.equal(report.aiProviderLatency.totalRecords, golden.lines.length)
})

test('AI latency is grouped by cohort, provider and model; percentiles use successes and wait for enough samples', () => {
  const lines = [
    ...[100, 200, 300, 400, 500].map((n) => ai(n)),
    ai(9000, { outcome: 'failure' }), ai(9500, { outcome: 'failure' }),
    ...[50, 60, 70].map((n) => ai(n, { cohort: 'class2', provider: 'groq', model: 'openai/gpt-oss-20b' })),
  ]
  const report = analyzeKGLatency(lines, { minPairs: 4, minAiSamples: 4 })
  assert.deepEqual(report.aiProviderLatency.groups, [
    { cohort: 'class1-l1', provider: 'python-qwen', model: 'class1-python-brain', successCount: 5, failureCount: 2,
      sufficientSamples: true, p50Ms: 300, p95Ms: 500, maxMs: 500 },
    { cohort: 'class2', provider: 'groq', model: 'openai/gpt-oss-20b', successCount: 3, failureCount: 0,
      sufficientSamples: false, p50Ms: null, p95Ms: null, maxMs: null },
  ])
  assert.equal(report.aiProviderLatency.minimumSuccessfulSamples, 4)
  assert.equal(report.gate, 'INSUFFICIENT_REAL_SAMPLES', 'AI records alone never pass the KG gate')
})

test('AI lines keep only allowlisted labels and a duration; private fields and malformed lines are dropped', () => {
  const lines = [
    ai(120, { studentName: 'PRIVATE NAME', transcript: 'PRIVATE UTTERANCE', requestId: 'req-secret-1', prompt: 'PRIVATE PROMPT' }),
    ai(130, { cohort: 'has space' }), ai(130, { provider: undefined }), ai(130, { model: 'a@b.com' }),
    ai(-5), ai(130, { outcome: 'maybe' }), ai('fast'), ai(999999),
  ]
  const report = analyzeKGLatency(lines, { minPairs: 4, minAiSamples: 1 })
  assert.equal(report.aiProviderLatency.totalRecords, 1)
  assert.equal(report.counts.unrelatedOrInvalidLines, 7)
  assert.equal(report.aiProviderLatency.groups[0].p50Ms, 120)
  const text = JSON.stringify(report)
  for (const secret of ['PRIVATE NAME', 'PRIVATE UTTERANCE', 'req-secret-1', 'PRIVATE PROMPT', 'a@b.com', 'has space']) assert.equal(text.includes(secret), false, secret)
})

test('real default model ids with a slash or a colon are accepted as labels', () => {
  const models = ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'qwen3:4b-instruct']
  const report = analyzeKGLatency(models.map((model) => ai(90, { model, provider: 'groq' })), { minPairs: 4, minAiSamples: 1 })
  assert.deepEqual(report.aiProviderLatency.groups.map((g) => g.model).sort(), [...models].sort())
})

test('the minimum AI sample count is validated, including from the command line', async () => {
  assert.throws(() => analyzeKGLatency([], { minAiSamples: 0 }), /Invalid minimum AI sample count/)
  assert.throws(() => analyzeKGLatency([], { minAiSamples: 1.5 }), /Invalid minimum AI sample count/)
  await assert.rejects(run(['--file=does-not-matter.log', '--min-ai-samples=abc']), /Invalid --min-ai-samples/)
})
