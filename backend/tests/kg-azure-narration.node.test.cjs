/* Offline regression: node --test backend/tests/kg-azure-narration.node.test.cjs */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const ts = require('typescript')

function loadService(dependencies) {
  const file = path.resolve(__dirname, '../src/services/kg-azure-narration.service.ts')
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText
  const target = { exports: {} }
  Function('require', 'module', 'exports', 'Buffer', 'process', js)((name) => {
    if (!(name in dependencies)) throw new Error('Unexpected module: ' + name)
    return dependencies[name]
  }, target, target.exports, Buffer, process)
  return target.exports
}

test('KG narration: Azure on S3 miss, upload once, memory hit, S3 hit after reset, profile-safe key', async () => {
  const keys = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY',
    'AZURE_SPEECH_VOICE', 'AZURE_VOICE_PROFILE_VERSION']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  Object.assign(process.env, {
    AWS_REGION: 'ap-south-1', AWS_S3_BUCKET: 'unit-test-bucket',
    AWS_ACCESS_KEY_ID: 'unit-test-only', AWS_SECRET_ACCESS_KEY: 'unit-test-only',
    AZURE_SPEECH_VOICE: 'en-IN-NeerjaNeural', AZURE_VOICE_PROFILE_VERSION: 'kg-test-v1',
  })
  const objects = new Map()
  const counters = { azure: 0, get: 0, put: 0 }
  const svc = loadService({
    'node:crypto': crypto,
    '../providers/voice/AzureVoiceProvider': {
      AzureVoiceProvider: class {
        async synthesizeUncached(text) {
          counters.azure++
          assert.equal(text, 'Apple is for A.')
          return { audio: Buffer.alloc(400, 0x31), contentType: 'audio/mpeg' }
        }
      },
    },
    '../utils/logger': { logger: { warn() {} } },
    './S3Service': {
      S3Service: {
        async getAudio(key) { counters.get++; return objects.get(key) || null },
        async putAudio(key, audio, contentType, _metadata, ifNoneMatch) {
          counters.put++
          assert.equal(contentType, 'audio/mpeg')
          assert.equal(ifNoneMatch, '*')
          assert.match(key, /^kg\/azure\/level-01\/v1\/letter-a\/[a-f0-9]{64}\.mp3$/)
          objects.set(key, audio)
        },
      },
    },
  })
  try {
    const input = { level: 1, id: 'letter-a', text: 'Apple is for A.' }
    const [first, together] = await Promise.all([
      svc.getKGAzureNarrationAudio(input),
      svc.getKGAzureNarrationAudio(input),
    ])
    assert.equal(first.source, 'azure')
    assert.equal(first.storedInS3, true)
    assert.equal(together.audio.length, 400)
    assert.deepEqual(counters, { azure: 1, get: 1, put: 1 })
    const second = await svc.getKGAzureNarrationAudio(input)
    assert.equal(second.source, 'memory')
    assert.deepEqual(counters, { azure: 1, get: 1, put: 1 })

    svc.clearKGAzureNarrationCache()
    const third = await svc.getKGAzureNarrationAudio(input)
    assert.equal(third.source, 's3')
    assert.deepEqual(counters, { azure: 1, get: 2, put: 1 })

    process.env.AZURE_VOICE_PROFILE_VERSION = 'kg-test-v2'
    await svc.getKGAzureNarrationAudio(input)
    assert.deepEqual(counters, { azure: 2, get: 3, put: 2 })
    assert.equal(objects.size, 2)
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})

test('KG narration: S3 outage never blocks live Azure audio', async () => {
  const keys = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  Object.assign(process.env, {
    AWS_REGION: 'ap-south-1', AWS_S3_BUCKET: 'unit-test-bucket',
    AWS_ACCESS_KEY_ID: 'unit-test-only', AWS_SECRET_ACCESS_KEY: 'unit-test-only',
  })
  let syntheses = 0
  const svc = loadService({
    'node:crypto': crypto,
    '../providers/voice/AzureVoiceProvider': {
      AzureVoiceProvider: class {
        async synthesizeUncached() {
          syntheses++
          return { audio: Buffer.alloc(400, 0x32), contentType: 'audio/mpeg' }
        }
      },
    },
    '../utils/logger': { logger: { warn() {} } },
    './S3Service': {
      S3Service: {
        async getAudio() { throw new Error('S3 unavailable') },
        async putAudio() { throw new Error('S3 unavailable') },
      },
    },
  })
  try {
    const result = await svc.getKGAzureNarrationAudio({
      level: 4, id: 'letter-q', text: 'This is Q.',
    })
    assert.equal(result.source, 'azure')
    assert.equal(result.storedInS3, false)
    assert.equal(result.audio.length, 400)
    assert.equal(syntheses, 1)
    await assert.rejects(
      svc.getKGAzureNarrationAudio({ level: 1, id: '../unsafe', text: 'a' }),
      /Invalid server-owned KG narration identity/,
    )
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})
