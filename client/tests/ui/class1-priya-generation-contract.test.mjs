import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = file => readFile(new URL(file, import.meta.url), 'utf8')
test('local 8001 generator selects the actual running Priya voice version', async () => {
  const generator = await read('../../../backend/src/scripts/generate-class1-first-day-voices.ts')
  assert.match(generator, /parsePriyaHealth\(await probe\.json\(\)\)/)
  assert.match(generator, /voice: health\.voiceId/)
  assert.doesNotMatch(generator, /miss-julie-priya-v6/)
})
test('diagnostics cannot pass based solely on an OpenAPI endpoint', async () => {
  const doctor = await read('../../../backend/src/scripts/doctor-class1-first-day.ts')
  assert.match(doctor, /parsePriyaHealth\(await response\.json\(\)\)/)
  assert.match(doctor, /checkPriyaHealth\(health\)/)
})
test('HTTP 500 has a traceback hint without leaking Python response bodies', async () => {
  const generator = await read('../../../backend/src/scripts/generate-class1-first-day-voices.ts')
  assert.match(generator, /Unhandled Python generation error/)
  assert.match(generator, /\^\[A-Z0-9_\]/)
})
