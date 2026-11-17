const assert = require('node:assert/strict')
const { test } = require('node:test')
const { loadTS } = require('./helpers/load-ts.cjs')

const { buildCorsOptions, PREFLIGHT_MAX_AGE_SECONDS } = loadTS('config/cors-options.ts')

test('browsers are told to remember the preflight answer so repeat requests skip a round trip', () => {
  const options = buildCorsOptions({ clientUrl: 'https://app.example.in', isProd: true })
  assert.equal(options.maxAge, PREFLIGHT_MAX_AGE_SECONDS)
  assert.ok(options.maxAge >= 3600 && options.maxAge <= 86400)
})

test('allowed origins and credentials behave exactly as before', () => {
  const prod = buildCorsOptions({ clientUrl: 'https://app.example.in', extraClientUrls: ' https://a.example.in , ,https://b.example.in', isProd: true })
  assert.deepEqual(prod.origin, ['https://app.example.in', 'https://a.example.in', 'https://b.example.in'])
  assert.equal(prod.credentials, true)
  assert.deepEqual(prod.exposedHeaders, ['X-KG-Feedback-Receipt', 'X-Class1-Feedback-Receipt', 'X-Request-Id'])
  const dev = buildCorsOptions({ clientUrl: 'http://localhost:3000', isProd: false })
  assert.deepEqual(dev.origin, ['http://localhost:3000'], 'duplicates collapse and localhost is only added outside production')
  assert.ok(!buildCorsOptions({ clientUrl: 'https://x.in', isProd: true }).origin.includes('http://localhost:3000'))
})

test('cross-origin teacher audio exposes the Class 1 receipt required to advance', async () => {
  const express = require('express')
  const cors = require('cors')
  const request = require('supertest')
  const origin = 'https://app.example.in'
  const app = express()
  app.use(cors(buildCorsOptions({ clientUrl: origin, isProd: true })))
  app.post('/voice/synthesize', (_req, res) => {
    res.setHeader('X-Class1-Feedback-Receipt', 'signed-feedback-fixture')
    res.type('audio/mpeg').send(Buffer.from('audio-fixture'))
  })

  const response = await request(app).post('/voice/synthesize').set('Origin', origin).expect(200)
  assert.equal(response.headers['access-control-allow-origin'], origin)
  assert.equal(response.headers['x-class1-feedback-receipt'], 'signed-feedback-fixture')
  const readableHeaders = response.headers['access-control-expose-headers'].toLowerCase().split(',').map(header => header.trim())
  assert.ok(readableHeaders.includes('x-class1-feedback-receipt'), 'browser must be able to read the receipt before audio playback and completion ACK')
})
