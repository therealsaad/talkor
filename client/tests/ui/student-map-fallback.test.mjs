import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const source = await readFile(new URL('../../app/student/levels/page.tsx', import.meta.url), 'utf8')
const activePage = source.slice(source.lastIndexOf('export default function AdventureMapPage()'))

test('student adventure remains visible when the published curriculum API fails', () => {
  assert.match(activePage, /catch \(cause\) \{[\s\S]*?setError\([\s\S]*?setLoading\(false\)/)
  assert.doesNotMatch(activePage, /if \(error\)\s*\{\s*return \(\s*<main className="tk-map-error">/)
  assert.match(activePage, /\{error \? \(\s*<aside className="tk-class1-map-notice" role="alert">/)
  assert.match(activePage, /all unverified lessons stay locked/)
  assert.match(activePage, /<div className="tk-map">/)
})

test('missing published units cannot be interpreted as playable', () => {
  assert.match(activePage, /function statusFor\([\s\S]*?'LOCKED'\s*\)\s*\}/)
  assert.match(activePage, /status !== 'CURRENT' &&\s*status !== 'COMPLETED'/)
  assert.match(activePage, /targetLesson\?\.id/)
  assert.match(activePage, /router\.push\('\/student\/continue'\)/)
  assert.match(activePage, /encodeURIComponent\(targetLesson\.id\)/)
})

test('grade 0 still uses the existing protected KG map and Class 1 keeps the ten-stone artwork', () => {
  assert.match(activePage, /if \(student\?\.grade === 0\) return <KGAlphabetMap \/>/)
  assert.match(activePage, /student\?\.grade === 1\s*\?\s*CLASS1_WORLDS/)
  assert.match(activePage, /const mapBackground = student\?\.grade === 1 \? CLASS1_MAP_BACKGROUND : MAP_BACKGROUND/)
})
