import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')

test('school Level 1 preview keeps preview props on its existing lesson branch', async () => {
  const [page, map, lesson] = await Promise.all([
    read('../../app/school/kg-preview/level-1/page.tsx'),
    read('../../features/lessons/grades/kg/level-01/components/LevelMap.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
  ])
  assert.match(page, /import \{ KGAlphabetMap \} from ['"]@\/features\/lessons\/grades\/kg\/level-01\/components\/LevelMap['"]/)
  assert.match(page, /import KGLevel1Experience from ['"]@\/features\/lessons\/grades\/kg\/level-01\/LevelExperience['"]/)
  assert.doesNotMatch(page, /lazy\(|Suspense/)
  assert.match(page, /KGAlphabetMap preview onPreviewPlay/)
  assert.match(page, /<KGLevel1Experience key=\{step\} preview previewStartIndex=\{step\}/)
  assert.match(page, /step === null[\s\S]*?KGAlphabetMap preview onPreviewPlay=\{setStep\}[\s\S]*?KGLevel1Experience key=\{step\}/)
  assert.match(map, /if \(preview\) \{\s*setState\(makeKGPreviewState\(\)\)/)
  assert.match(lesson, /export default function LevelExperience/)
  assert.match(lesson, /<Suspense fallback=\{<main className="kg-alpha kg-alpha-loading"/)
  assert.match(lesson, /<KGAlphabetLesson \{\.\.\.props\} \/>/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?makeKGPreviewState\(previewStartIndex\)/)
})
