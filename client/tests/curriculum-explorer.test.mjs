import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const cache = new Map()
function load(relative) {
  const file = path.resolve(root, relative)
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText
  new Function('exports', 'require', js)(exports, (request) => {
    assert.ok(
      request.startsWith('.'),
      `Metadata must not import runtime services: ${request}`
    )
    return load(
      path.relative(root, path.resolve(path.dirname(file), request + '.ts'))
    )
  })
  return exports
}
const model = load('features/curriculum-explorer/model.ts')
const flow = load('features/curriculum-explorer/teaching-flow.ts')
const routes = load('features/curriculum-explorer/route-options.ts')
const { PLAN_LOADERS, loadGradePlans } = load(
  'features/curriculum-explorer/plan-loaders.ts'
)
const workspaces = (
  await Promise.all(Array.from({ length: 11 }, (_, g) => loadGradePlans(g)))
).flat()
const before = JSON.stringify(workspaces)
const plans = workspaces.map(model.buildExplorerPlan)
const read = (relative) => readFileSync(path.join(root, relative), 'utf8')

test('metadata loaders exactly match the 110 canonical addresses without importing lesson engines', () => {
  const registry = read('features/lessons/registry.ts')
  const ids = [...registry.matchAll(/'(g\d{2}-l\d{2})':/g)]
    .map((m) => m[1])
    .sort()
  assert.deepEqual(Object.keys(PLAN_LOADERS).sort(), ids)
  assert.equal(plans.length, 110)
  for (let grade = 0; grade <= 10; grade++)
    assert.equal(plans.filter((p) => p.config.grade === grade).length, 10)
  assert.doesNotMatch(
    read('features/curriculum-explorer/plan-loaders.ts'),
    /import\([^)]*LevelExperience|import\([^)]*services/
  )
})

test('existing full-year Class 1 assignments remain 44 unique chapters across ten levels', () => {
  const class1 = plans.filter((p) => p.config.grade === 1)
  const chapters = class1.flatMap((p) => p.chapters)
  assert.equal(chapters.length, 44)
  assert.equal(new Set(chapters.map((c) => c.code)).size, 44)
  assert.deepEqual(
    class1[0].chapters.map((c) => c.code),
    ['1.1']
  )
  assert.deepEqual(
    class1[1].chapters.map((c) => c.code),
    ['1.2', '1.3', '1.4', '1.5', '1.6']
  )
  assert.deepEqual(
    class1[2].chapters.map((c) => c.code),
    ['1.7', '1.8', '1.9', '1.10']
  )
  assert.equal(
    chapters
      .filter((c) => c.unit === 1)
      .reduce((sum, c) => sum + c.tasks.length, 0),
    35
  )
  assert.equal(
    chapters.filter((c) => c.unit !== 1).every((c) => c.tasks.length === 0),
    true
  )
  const vowels = class1[1].chapters.find((c) => c.code === '1.5')
  assert.deepEqual(vowels.issues, [])
  assert.match(vowels.prompt, /a, e, i, o, u are vowels/i)
  assert.doesNotMatch(vowels.prompt, /sh in ship/i)
  assert.deepEqual(vowels.pages, [7, 7])
  assert.equal(vowels.tasks.length, 3)
  const level2 = class1[1]
  assert.equal(level2.config.studentPlayable, false)
  assert.equal(level2.config.syllabus.syllabusVerified, false)
  assert.deepEqual(level2.config.syllabus.sourcePages, [2, 3, 4, 5, 6, 7, 8, 9])
})

test('empty source workspaces stay empty and authored activity inventories are preserved as the catalog grows', () => {
  for (const plan of plans.filter((p) => p.config.grade !== 1 && p.activities.length === 0)) {
    assert.equal(plan.chapters.length, 0)
    assert.ok(plan.suggestedActivities.length > 0)
    assert.equal(plan.config.syllabus.syllabusVerified, false)
  }
  assert.deepEqual(
    plans.map((p) => ({ id: p.config.id, activities: p.activities })),
    workspaces.map((p) => ({ id: p.config.id, activities: p.activities }))
  )
  assert.equal(JSON.stringify(workspaces), before)
})

test('class, unit, chapter and activity filters select existing records precisely', () => {
  const filter = (changes) =>
    plans.filter((p) =>
      model.matchesPlan(p, {
        grade: 'all',
        unit: 'all',
        search: '',
        ...changes,
      })
    )
  assert.equal(filter({ grade: 0 }).length, 10)
  assert.equal(filter({ grade: 10 }).length, 10)
  assert.deepEqual(
    filter({ grade: 1, unit: '1' }).map((p) => p.config.level),
    [1, 2, 3]
  )
  assert.deepEqual(
    filter({ grade: 1, search: 'articles' }).map((p) => p.config.level),
    [2]
  )
  assert.deepEqual(
    filter({ grade: 1, search: 'newspaper' }).map((p) => p.config.level),
    [3]
  )
  assert.equal(
    filter({ search: 'a phrase that is not in the curriculum' }).length,
    0
  )
})

test('route inputs are bounded, and authenticated educator roles are explicit', () => {
  for (const role of [null, 'STUDENT', 'ADMIN', 'guest'])
    assert.equal(model.isEducator(role), false)
  for (const role of ['TEACHER', 'SCHOOL_ADMIN'])
    assert.equal(model.isEducator(role), true)
  const invalid = routes.explorerRouteOptions({
    grade: '11',
    level: '0',
    view: 'runtime',
    unit: '9',
    sample: '<script>',
    q: 'x'.repeat(200),
  })
  assert.equal(invalid.initialGrade, 1)
  assert.equal(invalid.initialLevel, 1)
  assert.equal(invalid.initialView, 'map')
  assert.equal(invalid.initialUnit, 'all')
  assert.equal(invalid.initialSample, undefined)
  assert.equal(invalid.initialSearch.length, 120)
  const all = routes.explorerRouteOptions({
    grade: 'all',
    address: 'g10-l04',
    view: 'teaching',
  })
  assert.equal(all.initialGrade, 'all')
  assert.equal(all.initialAddress, 'g10-l04')
})

test('wrong answers and silence retry the same turn; practice and teacher sign-off gate continuation', () => {
  let state = { ...flow.initialTeachingState }
  assert.equal(flow.teachingTransition(state, 'SIGN_OFF').phase, 'ready')
  state = flow.teachingTransition(state, 'START')
  state = flow.teachingTransition(state, 'OPEN_TURN')
  assert.equal(state.phase, 'listen')
  assert.equal(flow.teachingTransition(state, 'CONTINUE').phase, 'listen')
  for (const event of ['HELP', 'SILENCE']) {
    state = flow.teachingTransition(state, event)
    assert.equal(state.phase, 'support')
    assert.equal(flow.teachingTransition(state, 'SIGN_OFF').phase, 'support')
    state = flow.teachingTransition(state, 'RETRY')
    assert.equal(state.phase, 'listen')
  }
  state = flow.teachingTransition(state, 'EXPECTED')
  assert.equal(state.phase, 'success')
  state = flow.teachingTransition(state, 'CONTINUE')
  assert.equal(state.phase, 'practice')
  state = flow.teachingTransition(state, 'OPEN_TURN')
  assert.equal(state.phase, 'practice-listen')
  state = flow.teachingTransition(state, 'SILENCE')
  state = flow.teachingTransition(state, 'RETRY')
  assert.equal(state.phase, 'practice-listen')
  state = flow.teachingTransition(state, 'EXPECTED')
  assert.equal(state.phase, 'gate')
  assert.equal(flow.teachingTransition(state, 'CONTINUE').phase, 'gate')
  state = flow.teachingTransition(state, 'SIGN_OFF')
  assert.equal(state.phase, 'complete')
  assert.deepEqual(
    flow.teachingTransition(state, 'RESET'),
    flow.initialTeachingState
  )
})

test('local review data is isolated by school/account and corrupt values cannot become approval', () => {
  assert.notEqual(
    model.reviewKey('school-a', 'teacher'),
    model.reviewKey('school-b', 'teacher')
  )
  assert.notEqual(
    model.reviewKey('school-a', 'teacher'),
    model.reviewKey('school-a', 'admin')
  )
  assert.equal(model.reviewKey(undefined, 'teacher'), null)
  assert.deepEqual(model.parseReviews('broken JSON'), {})
  assert.deepEqual(
    model.parseReviews('{"g01-l01":{"decision":"published","note":"bad"}}'),
    {}
  )
  assert.deepEqual(
    model.parseReviews('{"g11-l01":{"decision":"reviewed","note":"bad"}}'),
    {}
  )
  assert.equal(
    model.parseReviews(
      JSON.stringify({ 'g01-l01': { decision: 'reviewed', note: 'ok' } })
    )['g01-l01'].note,
    'ok'
  )
})

test('mismatched live grade responses cannot be presented as the selected school curriculum', () => {
  const payload = {
    grade: 1,
    levels: [{ grade: 1, level: 1, address: 'g01-l01' }],
  }
  assert.equal(model.isValidLiveMap(payload, 1), true)
  assert.equal(model.isValidLiveMap(payload, 2), false)
  assert.equal(
    model.isValidLiveMap(
      { ...payload, levels: [...payload.levels, ...payload.levels] },
      1
    ),
    false
  )
  assert.equal(
    model.isValidLiveMap(
      { ...payload, levels: [{ grade: 1, level: 1, address: 'g02-l01' }] },
      1
    ),
    false
  )
})

test('all old school preview URLs share educator-gated components without student or microphone side effects', () => {
  const routePaths = [
    'app/school/curriculum-map/page.tsx',
    'app/school/curriculum-studio/[grade]/[level]/page.tsx',
    'app/school/classes/[id]/page.tsx',
    'app/school/kg-preview/page.tsx',
    ...Array.from(
      { length: 5 },
      (_, i) => `app/school/kg-preview/level-${i + 1}/page.tsx`
    ),
    ...[2, 3, 5].map(
      (n) => `app/school/kg-preview/level-${n}/[letter]/page.tsx`
    ),
  ]
  for (const route of routePaths) {
    const source = read(route)
    assert.match(source, /CurriculumExplorerPage/)
    assert.doesNotMatch(
      source,
      /LevelExperience|requestKGMicrophone|MediaRecorder|submitAttempt/
    )
  }
  const explorer = read('features/curriculum-explorer/CurriculumExplorer.tsx')
  assert.match(explorer, /status === 'authenticated' && isEducator\(role\)/)
  assert.match(explorer, /gradeLevelMapService\s*\.grade\(selectedGrade\)/)
  assert.match(explorer, /gradeLevelMapService\s*\.level\(grade, level\)/)
  assert.match(explorer, /let active = true/)
  assert.match(
    read('app/school/layout.tsx'),
    /role === 'STUDENT'.*\/student\/home/
  )
  for (const file of readdirSync(
    path.join(root, 'features/curriculum-explorer')
  ).filter((f) => /\.tsx?$/.test(f))) {
    assert.doesNotMatch(
      read('features/curriculum-explorer/' + file),
      /getUserMedia|MediaRecorder|voiceService|submitAttempt|progressService|method:\s*['"](?:POST|PUT|PATCH|DELETE)/
    )
  }
})
