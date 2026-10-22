import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8')

test('school KG preview forwards staff props to the correct lesson branch', async () => {
  const [page, bridge, lesson] = await Promise.all([
    read('../../app/school/kg-preview/page.tsx'),
    read('../../features/lessons/RegisteredLevelExperience.tsx'),
    read('../../features/lessons/grades/kg/level-01/LevelExperience.tsx'),
  ])
  assert.match(page, /staffPreview\s+experienceProps=\{\{\s*preview:\s*true/)
  assert.match(bridge, /<Experience\s+\{\.\.\.experienceProps\}\s*\/>/)
  assert.match(lesson, /export default function LevelExperience\(props: Parameters<typeof KGAlphabetLesson>\[0\] = \{\}\)/)
  assert.match(lesson, /<KGAlphabetLesson\s+\{\.\.\.props\}\s*\/>/)
  assert.match(lesson, /if \(preview\) \{[\s\S]*?makeKGPreviewState\(previewStartIndex\)/)
})
