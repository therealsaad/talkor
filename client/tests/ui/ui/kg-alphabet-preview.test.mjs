import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const preview = await read('../../../app/school/kg-preview/page.tsx')
const lesson = await read('../../../features/lessons/grades/kg/level-01/LevelExperience.tsx')
const map = await read('../../../features/lessons/grades/kg/level-01/components/LevelMap.tsx')
const service = await read('../../../features/lessons/grades/kg/level-01/services/kg-alphabet-preview.ts')
const controller = await read('../../../../backend/src/controllers/kg-alphabet.controller.ts')
const students = await read('../../../../backend/src/controllers/student.controller.ts')
const routes = await read('../../../../backend/src/routes/student.routes.ts')

test('school preview uses the same playable map and lesson, without live student data', () => {
  assert.match(preview, /KGAlphabetMap preview onPreviewPlay/)
  assert.match(preview, /RegisteredLevelExperience key=\{step\} grade=\{0\} level=\{1\} staffPreview/)
  assert.match(preview, /no student records/i)
  assert.match(lesson, /if \(preview\) \{[\s\S]*setPhase\('intro'\)/)
  assert.match(lesson, /kgAlphabetService\.previewSubmitPrepared/)
  assert.match(lesson, /onEnded=\{\(\) => \{[\s\S]*introEndedRef\.current = true/)
  assert.match(service, /Static staff preview state/)
  assert.match(service, /makeKGPreviewState/)
  assert.match(map, /Future levels are not yet published/)
  assert.match(preview, /complete introduction video plays first/i)
})

test('real KG lesson still uses STT and private S3, with explicit school-admin approval', () => {
  assert.match(lesson, /kgAlphabetService\.submit/)
  assert.match(controller, /getKGStaticAudio/)
  assert.match(controller, /isAuthorizedKGAlphabetStudent/)
  assert.match(students, /req\.auth\.role !== 'SCHOOL_ADMIN'/)
  assert.match(routes, /kg-alphabet-pilot', requireRole\('SCHOOL_ADMIN'\)/)
})
