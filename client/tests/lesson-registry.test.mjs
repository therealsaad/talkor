import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const registrySource = await read('features/lessons/registry.ts')
const compiled = ts.transpileModule(registrySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const canonicalExperience = function CanonicalKGLevel1() {}
const moduleFor = (request) => {
  const match = /^\.\/grades\/(kg|class-(\d{2}))\/level-(\d{2})$/.exec(request)
  if (!match) throw new Error(`Unexpected registry import: ${request}`)
  const grade = match[1] === 'kg' ? 0 : Number(match[2])
  const level = Number(match[3])
  const playable = grade === 0 && level === 1
  return {
    config: {
      id: `g${String(grade).padStart(2, '0')}-l${String(level).padStart(2, '0')}`,
      grade,
      level,
      editorialStatus: playable ? 'existing-runtime' : 'draft',
      studentPlayable: playable,
      staffOnlyPreview: !playable,
    },
    LevelExperience: playable ? canonicalExperience : function DraftOnlyExperience() {},
  }
}
const registry = {}
new Function('exports', 'require', compiled)(registry, moduleFor)

test('registry contains exactly the 110 canonical grade and level addresses', () => {
  const expected = []
  for (let grade = 0; grade <= 10; grade++) {
    for (let level = 1; level <= 10; level++) expected.push(registry.workspaceId(grade, level))
  }
  assert.equal(registry.WORKSPACE_ADDRESSES.length, 110)
  assert.equal(new Set(registry.WORKSPACE_ADDRESSES).size, 110)
  assert.deepEqual([...registry.WORKSPACE_ADDRESSES].sort(), expected.sort())
  assert.equal(registry.workspaceId(-1, 1), null)
  assert.equal(registry.workspaceId(0, 11), null)
})

test('KG Level 1 resolves to the canonical playable implementation and drafts stay locked', async () => {
  const workspace = await registry.loadStudentWorkspace(0, 1)
  assert.equal(workspace.config.id, 'g00-l01')
  assert.equal(workspace.LevelExperience, canonicalExperience)
  await assert.rejects(registry.loadStudentWorkspace(0, 2), /not available to students/)
  await assert.rejects(registry.loadStudentWorkspace(4, 1), /not available to students/)
})

test('student route and school preview render KG Level 1 through the shared registry bridge', async () => {
  const [route, bridge, canonical, preview, config] = await Promise.all([
    read('app/student/kg/page.tsx'),
    read('features/lessons/RegisteredLevelExperience.tsx'),
    read('features/lessons/grades/kg/level-01/LevelExperience.tsx'),
    read('app/school/kg-preview/page.tsx'),
    read('features/lessons/grades/kg/level-01/config.ts'),
  ])
  assert.match(route, /RegisteredLevelExperience/)
  assert.match(route, /grade=\{0\}/)
  assert.match(route, /level=\{1\}/)
  assert.doesNotMatch(route, /function KGAlphabetLesson\(/)
  assert.match(bridge, /loadStudentWorkspace\(grade, level\)/)
  assert.match(canonical, /export function KGAlphabetLesson/)
  assert.doesNotMatch(canonical, /LevelDraftPreview/)
  assert.match(preview, /RegisteredLevelExperience/)
  assert.match(preview, /staffPreview/)
  assert.match(config, /"studentPlayable": true/)
  assert.match(config, /"staffOnlyPreview": false/)
})

test('old KG lesson implementation paths were removed after imports moved', async () => {
  for (const path of [
    'components/student/kg/animated-miss-julie.tsx',
    'components/student/kg/kg-alphabet-map.tsx',
    'services/kg-alphabet-service.ts',
    'services/kg-alphabet-preview.ts',
    'hooks/use-kg-ambience.ts',
    'lib/kg-ambience.ts',
    'lib/kg-request.ts',
  ]) {
    await assert.rejects(access(new URL(path, root)))
  }
})
