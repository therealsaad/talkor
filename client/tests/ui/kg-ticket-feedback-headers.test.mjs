import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function read(path) {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
}
const service=read('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts')
const backend=read('../../../backend/src/controllers/kg-alphabet.controller.ts')

test('KG1 passes the same completed intro ticket on all protected requests', () => {
  assert.match(service, /function introTicketHeaders\(\): Record<string, string>/)
  assert.match(service, /'X-KG-Intro-Playback': playbackId/)
  assert.match(service, /feedback-audio`,\s*signal, 'dynamic_tts', introTicketHeaders\(\)/)
  assert.match(service, /feedback-played`,\s*\{ method: 'POST', signal, headers: introTicketHeaders\(\) \}/)
  assert.match(service, /headers: introTicketHeaders\(\)/)
  assert.match(backend, /await assertIntroTicket\(req, student\._id, student\.schoolId\)/)
})

test('one in-flight intro watch is shared across React Strict Mode mounts', () => {
  assert.match(service, /let pendingIntroStart: Promise<\{ playbackId: string \}> \| null = null/)
  assert.match(service, /if \(pendingIntroStart && pendingIntroStudentToken === token\) return pendingIntroStart/)
  assert.match(service, /pendingIntroStart = pending/)
  assert.match(service, /if \(pendingIntroStart === pending\) pendingIntroStart = null/)
})

test('ticket checks stay mandatory; no intro bypass, no fake completed playback', () => {
  assert.match(backend, /completedAt: \{ \$exists: true \}, expiresAt: \{ \$gt: new Date\(\) \}/)
  assert.match(service, /audio\.onended = \(\) => \{ clean\(\); resolve\(\) \}/)
  assert.match(backend, /await applyRecordedProgress\(attempt\)/)
})

test('concurrent KG intro ticket cannot be adopted by a different student login', () => {
  assert.match(service, /const token = getStoredToken\(\)/)
  assert.match(service, /pendingIntroStudentToken = token/)
  assert.match(service, /pendingIntroStudentToken === token && getStoredToken\(\) === token/)
  assert.match(service, /pendingIntroStudentToken = null/)
})
