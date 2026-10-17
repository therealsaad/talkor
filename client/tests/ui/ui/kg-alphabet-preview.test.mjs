import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const preview = await read('../../../app/school/kg-preview/page.tsx')
const lesson = await read('../../../app/student/kg/page.tsx')
const map = await read('../../../components/student/kg/kg-alphabet-map.tsx')
const service = await read('../../../services/kg-alphabet-preview.ts')
const controller = await read('../../../../backend/src/controllers/kg-alphabet.controller.ts')
const students = await read('../../../../backend/src/controllers/student.controller.ts')
const routes = await read('../../../../backend/src/routes/student.routes.ts')

test('school preview uses the same playable map and lesson, without live student data', () => {
  assert.match(preview, /KGAlphabetMap preview onPreviewPlay/)
  assert.match(preview, /KGAlphabetLesson key=\{step\} preview/)
  assert.match(preview, /no student records/i)
  assert.match(lesson, /if \(preview\) \{ setPhase\('listening'\); return \}/)
  assert.match(lesson, /I said it!/)
  assert.match(lesson, /onEnded=\{\(\) => \{ introEndedRef\.current = true/)
  assert.match(service, /UI-only school preview/)
  assert.match(service, /SpeechSynthesisUtterance/)
  assert.match(map, /index > unlockedThrough/)
  assert.match(preview, /complete introduction video plays first/i)
})

test('real KG lesson still uses STT and private S3, with explicit school-admin approval', () => {
  assert.match(lesson, /kgAlphabetService\.submit/)
  assert.match(controller, /S3Service\.getAudio/)
  assert.match(controller, /isAuthorizedKGAlphabetStudent/)
  assert.match(students, /req\.auth\.role !== 'SCHOOL_ADMIN'/)
  assert.match(routes, /kg-alphabet-pilot', requireRole\('SCHOOL_ADMIN'\)/)
})
