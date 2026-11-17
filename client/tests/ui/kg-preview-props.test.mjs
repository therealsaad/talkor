import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')

test('school Level 1 uses the explorer while canonical lesson preview props remain intact', async () => {
  const [page, map, lesson] = await Promise.all([
    read('../../app/school/kg-preview/level-1/page.tsx'),
    read('../../features/lessons/grades/kg/level-01/components/LevelMap.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
  ])
  assert.match(page, /CurriculumExplorerPage/)
  assert.doesNotMatch(page, /requestKGMicrophone|MediaRecorder|<Level\d?Experience/)
  assert.match(page, /initialLevel=\{1\}/)
  assert.match(map, /if \(preview\) \{\s*setState\(makeKGPreviewState\(\)\)/)
  assert.match(map, /86\.4, 46\.4\], \[62\.5, 57\.2\],\s+\[38\.2, 53\.7\], \[15\.7, 66\.8\]/)
  assert.match(lesson, /export default function LevelExperience/)
  assert.match(lesson, /<Suspense fallback=\{<main className="kg-alpha kg-alpha-loading"/)
  assert.match(lesson, /<KGAlphabetLesson \{\.\.\.props\} \/>/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?makeKGPreviewState\(previewStartIndex\)/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?router\.replace\('\/school\/kg-preview'\)/)
})

test('Level 1 preview route is staff-only and keeps assessment state out of student progress', async () => {
  const [schoolLayout, previewState, service, routes, controller] = await Promise.all([
    read('../../app/school/layout.tsx'),
    read('../../features/lessons/grades/kg/level-01/services/kg-alphabet-preview.ts'),
    read('../../features/lessons/grades/kg/level-01/services/kg-alphabet-service.ts'),
    read('../../../backend/src/routes/kg-alphabet.routes.ts'),
    read('../../../backend/src/controllers/kg-alphabet.controller.ts'),
  ])
  assert.match(schoolLayout, /role === 'SCHOOL_ADMIN' \|\| role === 'TEACHER'/)
  assert.match(schoolLayout, /status === 'unauthenticated'\) router\.replace\('\/login\/school'\)/)
  assert.match(schoolLayout, /status === 'authenticated' && role === 'STUDENT'\) router\.replace\('\/student\/home'\)/)
  assert.match(previewState, /export function makeKGPreviewState/)
  assert.match(service, /previewSubmitPrepared:[\s\S]*?\/kg-alphabet\/preview\/attempt/)
  assert.match(routes, /router\.post\('\/preview\/attempt', requireRole\('TEACHER', 'SCHOOL_ADMIN'\)/)
  assert.match(controller, /previewAttempt: catchAsync\(async \(req: Request, res: Response\) => \{\s*\/\/ Staff preview uses the KG-selected STT and reviewed feedback without progress writes\./)
  const previewHandler = controller.match(/previewAttempt: catchAsync\(async \(req: Request, res: Response\) => \{([\s\S]*?)\n  \}\),\s*attempt:/)?.[1]
  assert.ok(previewHandler)
  assert.doesNotMatch(previewHandler, /KGAlphabetProgress|KGAlphabetAttempt|KGAlphabetSubmission|\.save\(|\.create\(/)
})
