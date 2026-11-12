import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

function read(relativePath) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

test('five-digit PIN login is both restricted and submitted without persistent student storage', () => {
  const login = read('../app/login/student/page.tsx')
  const service = read('../services/auth-service.ts')
  const api = read('../lib/api-client.ts')

  assert.match(login, /\/\^\\d\{5\}\$\//)
  assert.match(login, /pattern="\[0-9\]\{5\}"/)
  assert.match(login, /replace\(\/\\D\/g, ''\)/)
  assert.match(service, /\/auth\/student\/pin-login/)
  assert.match(service, /setStoredToken\(data\.token, true\)/)
  assert.match(api, /const storage = labSession \? window\.sessionStorage : window\.localStorage/)
})

test('frontend resume and progress services use server-authoritative endpoints', () => {
  const resume = read('../app/student/continue/page.tsx')
  const curriculum = read('../services/curriculum-service.ts')
  const progress = read('../services/progress-service.ts')

  assert.match(resume, /Never trust the URL/)
  assert.match(resume, /curriculumService\.getNextLesson\(\)/)
  assert.match(curriculum, /\/students\/me\/next-lesson/)
  assert.match(curriculum, /\/students\/me\/curriculum/)
  assert.match(progress, /\/students\/me\/progress/)
  assert.doesNotMatch(resume, /lessonId\s*===|status\s*===\s*['"]completed/)
})

test('student route guard and canonical lesson registry remain in place', () => {
  const layout = read('../app/student/layout.tsx')
  const registry = read('../features/lessons/registry.ts')

  assert.match(layout, /status !== 'authenticated' \|\| role !== 'STUDENT' \|\| !student/)
  assert.match(layout, /router\.replace/)
  assert.match(registry, /\/\*\* Student resolver/)
  assert.match(registry, /studentPlayable/)
  assert.match(registry, /staffOnlyPreview/)
  assert.match(registry, /not available to students/)
})
