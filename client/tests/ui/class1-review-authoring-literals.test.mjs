import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { readAuthoringLiteral, readAuthoringComposition } from '../../scripts/report-class1-level2-readiness.mjs'

function fixture(t, content) {
  const directory = mkdtempSync(path.join(tmpdir(), 'talkora-authored-literal-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const filename = path.join(directory, 'draft.ts')
  writeFileSync(filename, content)
  return pathToFileURL(filename)
}

test('extracts only data through type assertions, nested arrays and selected properties', t => {
  const file = fixture(t, `export const REVIEW = ({ model: ['cat', 2, false, null], flags: { approved: false } } as const) satisfies Draft`)
  assert.deepEqual(readAuthoringLiteral(file, 'REVIEW'), { model: ['cat', 2, false, null], flags: { approved: false } })
  assert.equal(readAuthoringLiteral(file, 'REVIEW', ['flags', 'approved']), false)
})

for (const expression of [
  '(() => { globalThis.talkoraLiteralExecuted = true; return {} })()',
  '{ get model() { globalThis.talkoraLiteralExecuted = true; return "cat" } }',
  '{ ...externalData }', '[...externalData]', '{ [externalKey]: "cat" }',
  '{ approved: false, approved: true }', '{ "__proto__": {} }', '{ constructor: {} }',
  '`model ${process.env.PRIVATE_VALUE}`', 'externalData', '[1, , 2]', '1e9999',
]) test('rejects executable, ambiguous or unsafe authoring: ' + expression.slice(0, 45), t => {
  const file = fixture(t, 'export const REVIEW = ' + expression)
  assert.throws(() => readAuthoringLiteral(file, 'REVIEW'))
  assert.equal(globalThis.talkoraLiteralExecuted, undefined)
})

test('selected properties cannot hide a later duplicate publication flag', t => {
  const file = fixture(t, 'export const REVIEW = { approved: false, approved: true }')
  assert.throws(() => readAuthoringLiteral(file, 'REVIEW', ['approved']), /duplicate/)
})

test('duplicate or missing declarations cannot silently choose a source', t => {
  assert.throws(() => readAuthoringLiteral(fixture(t, 'const REVIEW = 1; const REVIEW = 2'), 'REVIEW'))
  assert.throws(() => readAuthoringLiteral(fixture(t, 'const OTHER = 1'), 'REVIEW'))
})

test('reads preview composition without calling its functions', t => {
  const file = fixture(t, 'export const activities = [...class1DraftActivities(2), ...ORIGINAL_REVIEW]')
  assert.deepEqual(readAuthoringComposition(file, 'activities'), ['...class1DraftActivities(2)', '...ORIGINAL_REVIEW'])
})

test('the same audit works with only the backend CI TypeScript dependency installed', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'talkora-review-resolver-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  mkdirSync(path.join(directory, 'client/scripts'), { recursive: true })
  mkdirSync(path.join(directory, 'backend/node_modules'), { recursive: true })
  writeFileSync(path.join(directory, 'backend/package.json'), '{"name":"synthetic-audit-backend"}')
  const typescript = path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'))
  symlinkSync(typescript, path.join(directory, 'backend/node_modules/typescript'), 'dir')
  const reader = path.join(directory, 'client/scripts/reader.mjs')
  writeFileSync(reader, readFileSync(new URL('../../scripts/report-class1-level2-readiness.mjs', import.meta.url)))
  const source = fixture(t, 'export const REVIEW = { approved: false }')
  const program = `import { readAuthoringLiteral } from ${JSON.stringify(pathToFileURL(reader).href)};
    console.log(JSON.stringify(readAuthoringLiteral(${JSON.stringify(source.href)}, 'REVIEW')))`
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', program], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { approved: false })
})
