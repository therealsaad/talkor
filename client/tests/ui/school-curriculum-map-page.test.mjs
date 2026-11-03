import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const read = path => readFile(new URL(path,import.meta.url),'utf8')
const page = await read('../../app/school/curriculum-map/page.tsx')
const explorer = await read('../../features/curriculum-explorer/CurriculumExplorer.tsx')
const map = await read('../../features/curriculum-explorer/LevelMap.tsx')
const styles = await read('../../features/curriculum-explorer/explorer.module.css')

test('curriculum map uses the shared staff explorer and validated route filters', () => {
  assert.match(page,/CurriculumExplorerPage/)
  assert.match(page,/explorerRouteOptions\(await searchParams\)/)
  assert.match(explorer,/status === 'authenticated' && isEducator\(role\)/)
  assert.match(explorer,/gradeLevelMapService\s*\.grade\(selectedGrade\)/)
  assert.match(explorer,/gradeLevelMapService\s*\.level\(grade, level\)/)
  assert.match(explorer,/curriculumService\s*\.getClass\(props\.classId\)/)
  assert.match(explorer,/Records stay within your authorized school/)
  assert.doesNotMatch(explorer,/disabled=\{isTeacher && id === 0\}|mockCurriculum|fakeLevels/)
})
test('explorer has explicit loading, recovery, selection and accessible tabs', () => {
  assert.match(explorer,/aria-busy="true"/)
  assert.match(explorer,/role="alert"/)
  assert.match(explorer,/role="tablist"/)
  assert.match(explorer,/ArrowRight.*ArrowLeft.*Home.*End/)
  assert.match(map,/aria-pressed=\{selected === p\.config\.id\}/)
  assert.match(styles,/:focus-visible/)
})
test('shared explorer styles adapt for compact screens and reduced motion', () => {
  assert.match(styles,/@media\s*\(max-width:\s*550px\)/)
  assert.match(styles,/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(styles,/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  assert.match(styles,/animation:\s*none\s*!important/)
})
