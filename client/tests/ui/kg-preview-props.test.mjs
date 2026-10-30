import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')

test('school Level 1 preview opens the existing lesson experience directly', async () => {
  const [page, map, lesson] = await Promise.all([
    read('../../app/school/kg-preview/level-1/page.tsx'),
    read('../../features/lessons/grades/kg/level-01/components/LevelMap.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
  ])
  assert.match(page, /import KGLevel1Experience from ['"]@\/features\/lessons\/grades\/kg\/level-01\/LevelExperience['"]/)
  assert.doesNotMatch(page, /lazy\(|Suspense/)
  assert.match(page, /<KGLevel1Experience preview \/>/)
  assert.doesNotMatch(page, /KGAlphabetMap|previewStartIndex|onPreviewBack|step === null/)
  assert.match(map, /if \(preview\) \{\s*setState\(makeKGPreviewState\(\)\)/)
  assert.match(map, /86\.4, 46\.4\], \[62\.5, 57\.2\],\s+\[38\.2, 53\.7\], \[15\.7, 66\.8\]/)
  assert.match(lesson, /export default function LevelExperience/)
  assert.match(lesson, /<Suspense fallback=\{<main className="kg-alpha kg-alpha-loading"/)
  assert.match(lesson, /<KGAlphabetLesson \{\.\.\.props\} \/>/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?makeKGPreviewState\(previewStartIndex\)/)
  assert.match(lesson, /if \(preview\) router\.replace\('\/school\/kg-preview'\)/)
})
