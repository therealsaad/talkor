const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTS } = require('./helpers/load-ts.cjs')

const timing = loadTS('services/kg-turn-timing.ts')
const clock = (...ticks) => { let i = 0; return () => ticks[Math.min(i++, ticks.length - 1)] }

function setup(provider) {
  const records = []
  const log = {
    info: (message, meta) => records.push({ level: 'info', message, meta }),
    warn: (message, meta) => records.push({ level: 'warn', message, meta }),
  }
  const seen = { providerLookups: 0 }
  const mod = loadTS('services/ai-turn-timing.ts', {
    './kg-turn-timing': timing,
    '../providers/ai': { getAIProvider: () => { seen.providerLookups++; return provider } },
    '../config/env': { env: { qwenModel: 'qwen-test-model', conversationGroqModel: 'openai/gpt-oss-20b' } },
    '../utils/logger': { logger: log },
  })
  return { mod, records, log, seen }
}

const okProvider = (name = 'groq') => {
  const p = { name, calls: 0, generate: async () => { p.calls++; return { message: 'model answer text' } } }
  return p
}

test('a successful provider call writes exactly one info record with only the allowed keys', async () => {
  const { mod, records, log } = setup(okProvider())
  const route = { provider: 'groq', model: 'openai/gpt-oss-20b', cohort: 'class2' }
  const result = await mod.timeAIGeneration(route, async () => 'answer', log, clock(0, 10, 90, 100))
  assert.equal(result, 'answer')
  assert.equal(records.length, 1)
  assert.equal(records[0].level, 'info')
  assert.equal(records[0].message, 'AI turn timing')
  assert.deepEqual(records[0].meta, { phase: 'ai', outcome: 'success', cohort: 'class2', provider: 'groq', model: 'openai/gpt-oss-20b', llm: 80 })
  assert.deepEqual(Object.keys(records[0].meta).sort(), [...mod.AI_TIMING_KEYS].sort())
})

test('a failing provider call writes exactly one warn record and rethrows the same error', async () => {
  const { mod, records, log } = setup(okProvider())
  const failure = new Error('provider said: hello Asha Patil')
  await assert.rejects(
    mod.timeAIGeneration({ provider: 'groq', model: 'm', cohort: 'class3' }, async () => { throw failure }, log, clock(0, 5, 25, 30)),
    (error) => error === failure)
  assert.equal(records.length, 1)
  assert.equal(records[0].level, 'warn')
  assert.equal(records[0].meta.outcome, 'failure')
  assert.equal(records[0].meta.llm, 20)
  assert.equal(JSON.stringify(records).includes('Asha Patil'), false, 'the error text is never logged')
})

test('a logging failure never changes the turn result or its error', async () => {
  const route = { provider: 'groq', model: 'm', cohort: 'class3' }
  const broken = { info: () => { throw new Error('log down') }, warn: () => { throw new Error('log down') } }
  const { mod } = setup(okProvider())
  assert.equal(await mod.timeAIGeneration(route, async () => 'fine', broken), 'fine')
  const original = new Error('original')
  await assert.rejects(mod.timeAIGeneration(route, async () => { throw original }, broken), (e) => e === original)
})

test('generateWithTiming asks the provider exactly once and returns its answer untouched', async () => {
  const provider = okProvider('groq')
  const { mod, records, seen } = setup(provider)
  const answer = await mod.generateWithTiming({ grade: 4, levelId: 'g04-l02', studentName: 'Asha Patil', studentMessage: 'my private words' })
  assert.deepEqual(answer, { message: 'model answer text' })
  assert.equal(provider.calls, 1)
  assert.equal(seen.providerLookups, 1)
  assert.equal(records.length, 1)
  assert.equal(records[0].meta.provider, 'groq')
  assert.equal(records[0].meta.model, 'openai/gpt-oss-20b')
  assert.equal(records[0].meta.cohort, 'class4')
})

test('an unsupported provider setting still throws exactly as before, with no timing record', async () => {
  const records = []
  const mod = loadTS('services/ai-turn-timing.ts', {
    './kg-turn-timing': timing,
    '../providers/ai': { getAIProvider: () => { throw new Error('Unsupported AI_PROVIDER: nope') } },
    '../config/env': { env: { qwenModel: '', conversationGroqModel: '' } },
    '../utils/logger': { logger: { info: (m, e) => records.push(e), warn: (m, e) => records.push(e) } },
  })
  await assert.rejects(mod.generateWithTiming({ grade: 1, levelId: 'g01-l01' }), /Unsupported AI_PROVIDER/)
  assert.equal(records.length, 0)
})

test('cohort comes only from the authorized grade and level, never from client-supplied fields', async () => {
  const { mod, records } = setup(okProvider('qwen'))
  await mod.generateWithTiming({
    grade: 1, levelId: 'g01-l01',
    // Everything a browser could forge must be ignored.
    level: 'kg', cohort: 'kg', clientLevel: 'kg-1', promptContext: { level: 'kg', cohort: 'class9' }, studentMessage: 'cohort=kg',
  })
  assert.equal(records[0].meta.cohort, 'class1-l1')
  assert.equal(mod.aiCohort({ grade: '1', levelId: 'g01-l01' }), 'other', 'a string grade is not trusted')
  assert.equal(mod.aiCohort({ grade: 0 }), 'kg')
  assert.equal(mod.aiCohort({ grade: 1, levelId: 'g01-l02' }), 'class1-other')
  assert.equal(mod.aiCohort({ grade: 11 }), 'other')
  assert.equal(mod.aiCohort({ grade: 2.5 }), 'other')
  assert.equal(mod.aiCohort({}), 'other')
})

test('provider and model labels name the real route, and unsafe values collapse to fixed labels', () => {
  const { mod } = setup(okProvider())
  const models = { qwen: 'qwen-test-model', groq: 'openai/gpt-oss-20b' }
  // Class 1 Level 1 on the Qwen route is the Python brain, not a cloud Qwen model.
  assert.deepEqual(mod.aiRoute({ providerName: 'qwen', grade: 1, levelId: 'g01-l01', models }),
    { provider: 'python-qwen', model: 'class1-python-brain', cohort: 'class1-l1' })
  assert.deepEqual(mod.aiRoute({ providerName: 'qwen', grade: 5, levelId: 'g05-l01', models }),
    { provider: 'qwen', model: 'qwen-test-model', cohort: 'class5' })
  assert.deepEqual(mod.aiRoute({ providerName: 'groq', grade: 1, levelId: 'g01-l01', models }),
    { provider: 'groq', model: 'openai/gpt-oss-20b', cohort: 'class1-l1' })
  assert.deepEqual(mod.aiRoute({ providerName: 'python-qwen', grade: 3, models }),
    { provider: 'python-qwen', model: 'python-service', cohort: 'class3' })
  assert.deepEqual(mod.aiRoute({ providerName: 'openai', grade: 6, models }),
    { provider: 'openai', model: 'default', cohort: 'class6' })
  // Unknown provider names and unsafe model strings never reach a log.
  assert.deepEqual(mod.aiRoute({ providerName: 'Asha Patil', grade: 2, models }),
    { provider: 'other', model: 'unknown', cohort: 'class2' })
  assert.equal(mod.aiRoute({ providerName: 'groq', grade: 2, models: { qwen: '', groq: 'secret token value' } }).model, 'unset')
  // The real default model ids contain a slash or a colon and must survive as labels.
  for (const id of ['openai/gpt-oss-20b', 'qwen/qwen3.6-27b', 'qwen3:4b-instruct', 'whisper-large-v3-turbo']) {
    assert.equal(mod.aiRoute({ providerName: 'groq', grade: 2, models: { qwen: '', groq: id } }).model, id)
  }
  for (const bad of ['has space', 'a@b.com', 'x'.repeat(81), '', '/leading']) {
    assert.equal(mod.aiRoute({ providerName: 'groq', grade: 2, models: { qwen: '', groq: bad } }).model, 'unset', bad)
  }
})

test('no student identity, transcript, prompt, model answer or id appears in any emitted record', async () => {
  const secrets = ['Asha Patil', 'my very private transcript', 'SECRET-PROMPT-TEXT', 'model answer text',
    'student-id-7731', 'school-id-5520', 'pin-48213', 'Bearer abc123']
  const provider = { name: 'qwen', generate: async () => ({ message: 'model answer text' }) }
  const { mod, records } = setup(provider)
  const context = {
    grade: 1, levelId: 'g01-l01',
    studentName: secrets[0], studentMessage: secrets[1], promptContext: secrets[2],
    studentId: secrets[4], schoolId: secrets[5], pin: secrets[6], authorization: secrets[7],
  }
  await mod.generateWithTiming(context)
  provider.generate = async () => { throw new Error(secrets.join(' | ')) }
  await assert.rejects(mod.generateWithTiming(context))
  assert.equal(records.length, 2)
  const text = JSON.stringify(records)
  for (const secret of secrets) assert.equal(text.includes(secret), false, secret)
  for (const record of records) {
    assert.equal(record.message, 'AI turn timing')
    for (const key of Object.keys(record.meta)) assert.ok(mod.AI_TIMING_KEYS.includes(key), 'unexpected key ' + key)
  }
})
