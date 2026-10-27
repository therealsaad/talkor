import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const preview = await read('../../../app/school/kg-preview/page.tsx')
const level1Preview = await read('../../../app/school/kg-preview/level-1/page.tsx')
const lesson = await read('../../../features/lessons/grades/kg/level-01/LevelExperience.tsx')
const map = await read('../../../features/lessons/grades/kg/level-01/components/LevelMap.tsx')
const service = await read('../../../features/lessons/grades/kg/level-01/services/kg-alphabet-preview.ts')
const controller = await read('../../../../backend/src/controllers/kg-alphabet.controller.ts')
const students = await read('../../../../backend/src/controllers/student.controller.ts')
const routes = await read('../../../../backend/src/routes/student.routes.ts')

test('school preview opens the garden while Level 1 keeps its existing map and lesson', () => {
  assert.match(preview, /kg-simple-garden\.webp/)
  assert.match(preview, /\/school\/kg-preview\/level-1/)
  assert.match(preview, /\/school\/kg-preview\/level-3/)
  assert.match(level1Preview, /KGAlphabetMap preview/)
  assert.match(level1Preview, /KGLevel1Experience/)
  assert.match(level1Preview, /previewStartIndex=\{step\}/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*setPhase\('intro'\)/)
  assert.match(lesson, /kgAlphabetService\.previewSubmitPrepared/)
  assert.match(lesson, /function pictureChoices/)
  assert.match(service, /Static staff preview state/)
  assert.match(service, /makeKGPreviewState/)
  assert.match(map, /Level \$\{level\} is not yet published/)
})

test('real KG lesson still uses STT and private S3, with explicit school-admin approval', () => {
  assert.match(lesson, /kgAlphabetService\.submit/)
  assert.match(controller, /getKGStaticAudio/)
  assert.match(controller, /isAuthorizedKGAlphabetStudent/)
  assert.match(students, /req\.auth\.role !== 'SCHOOL_ADMIN'/)
  assert.match(routes, /kg-alphabet-pilot', requireRole\('SCHOOL_ADMIN'\)/)
})
