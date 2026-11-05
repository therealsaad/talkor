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
  assert.deepEqual(prod.exposedHeaders, ['X-KG-Feedback-Receipt'])
  const dev = buildCorsOptions({ clientUrl: 'http://localhost:3000', isProd: false })
  assert.deepEqual(dev.origin, ['http://localhost:3000'], 'duplicates collapse and localhost is only added outside production')
  assert.ok(!buildCorsOptions({ clientUrl: 'https://x.in', isProd: true }).origin.includes('http://localhost:3000'))
})
