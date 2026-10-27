import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const page = await readFile(new URL('../../app/school/curriculum-map/page.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../../app/school/curriculum-map/curriculum-map.css', import.meta.url), 'utf8')

test('curriculum map keeps live grade and level data with existing destinations', () => {
  assert.match(page, /gradeLevelMapService\.grade\(grade\)/)
  assert.match(page, /gradeLevelMapService\.level\(grade, level\)/)
  assert.match(page, /data\.levels\.map\(\(item\)/)
  assert.match(page, /statusLabel\[item\.status\]/)
  assert.match(page, /item\.lessons\.reduce/)
  assert.match(page, /href=\{`\/school\/classes\/\$\{data\.classId\}`\}/)
  assert.match(page, /href=\{`\/school\/curriculum-studio\/\$\{grade\}\/\$\{selected\.level\}`\}/)
  assert.match(page, /disabled=\{isTeacher && id === 0\}/)
  assert.doesNotMatch(page, /mockCurriculum|sampleLevels|fakeLevels/)
})

test('curriculum map keeps accessible loading and error states with keyboard support', () => {
  assert.match(page, /aria-busy="true"/)
  assert.match(page, /role="alert"/)
  assert.match(page, /aria-pressed=\{selected\?\.address === item\.address\}/)
  assert.match(styles, /:focus-visible/)
})

test('curriculum map follows dashboard styling and responds to viewport and motion preferences', () => {
  assert.match(styles, /--curriculum-accent: #6654c7/)
  assert.match(styles, /border-radius: 18px/)
  assert.match(styles, /school-curriculum-card-enter/)
  assert.match(styles, /transition: border-color 180ms ease/)
  assert.match(styles, /@media \(max-width: 640px\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(styles, /animation: none/)
})
