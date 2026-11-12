import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const page = await readFile(new URL('../../app/school/classes/page.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../../app/school/classes/classes.css', import.meta.url), 'utf8')

test('school classes page renders live class data and keeps both existing destinations', () => {
  assert.match(page, /curriculumService\.getClasses\(\)/)
  assert.match(page, /classes\.map\(\(cls\)/)
  assert.match(page, /gradeLongLabel\(cls\.grade\)/)
  assert.match(page, /href=\{`\/school\/students\?grade=\$\{cls\.grade\}`\}/)
  assert.match(page, /href=\{`\/school\/classes\/\$\{cls\.id\}`\}/)
  assert.doesNotMatch(page, /mockClasses|sampleClasses|fakeClasses/)
})

test('school classes page retains visible loading, empty, retryable error, and accessible link states', () => {
  assert.match(page, /aria-busy="true"/)
  assert.match(page, /classes\.length === 0/)
  assert.match(page, /role="alert"/)
  assert.match(page, /setReload\(\(value\) => value \+ 1\)/)
  assert.match(styles, /school-class-card__actions a:focus-visible/)
})

test('classes layout is responsive, animated, and honors reduced motion', () => {
  assert.match(styles, /grid-template-columns: repeat\(auto-fit/)
  assert.match(styles, /@media \(max-width: 640px\)/)
  assert.match(styles, /school-class-enter/)
  assert.match(styles, /transition: color 160ms ease/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(styles, /animation: none/)
})
