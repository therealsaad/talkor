'use strict'
/** Self-contained source/runtime tests. Uses globally installed TypeScript if local deps are absent. */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
let ts
try { ts = require('typescript') }
catch { ts = require(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript')) }

const root = path.resolve(__dirname, '..')
function load(relative, mocks = {}, context = {}) {
  const source = fs.readFileSync(path.join(root, 'backend/src', relative), 'utf8')
  const js = ts.transpileModule(source, { fileName: relative, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', 'process', 'console', js)((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    throw Error(`Unmocked dependency: ${name} in ${relative}`)
  }, module, module.exports, context.process || process, context.console || console)
  return module.exports
}

const roadmap = load('curriculum/roadmap.ts')
const contract = load('curriculum/level-map-contract.ts', { './roadmap': roadmap })

test('all 110 grade/level addresses are stable and complete', () => {
  assert.doesNotThrow(contract.assertRoadmapCoverage)
  assert.equal(roadmap.GRADE_ROADMAP.length, 110)
  for (let grade = 0; grade <= 10; grade++) {
    const levels = roadmap.roadmapForGrade(grade)
    assert.equal(levels.length, 10)
    assert.equal(levels[0].level, 1)
    assert.equal(levels[9].level, 10)
    assert.equal(new Set(levels.map((x) => x.id)).size, 10)
  }
})

test('grade and level parsing reject invalid/out-of-range/injection values', () => {
  for (const bad of ['', '00', '-1', '11', 'NaN', '1.5', '1x', '1?x', undefined, null, 1, {}, ' 1']) {
    assert.throws(() => contract.parseGrade(bad), /grade/)
  }
  for (const bad of ['', '00', '0', '11', '1.5', 'x', undefined, 1]) {
    assert.throws(() => contract.parseLevel(bad), /level/)
  }
  assert.equal(contract.parseGrade('0'), 0)
  assert.equal(contract.parseGrade('10'), 10)
  assert.equal(contract.parseLevel('10'), 10)
})

test('empty shells never count as published even with a published flag', () => {
  const status = contract.mappedStatus
  assert.equal(status({ present: false }), 'NOT_MAPPED')
  assert.equal(status({ present: true, availability: 'UPCOMING', status: 'draft' }), 'DRAFT')
  assert.equal(status({ present: true, availability: 'PUBLISHED', status: 'active' }), 'INCOMPLETE')
  assert.equal(status({ present: true, availability: 'PUBLISHED', status: 'active', activeLessons: 1, activeActivities: 0 }), 'INCOMPLETE')
  assert.equal(status({ present: true, availability: 'PUBLISHED', status: 'active', activeLessons: 1, activeActivities: 3 }), 'PUBLISHED')
  assert.equal(status({ present: true, availability: 'ARCHIVED', status: 'active', activeLessons: 2, activeActivities: 2 }), 'ARCHIVED')
})

test('staff Mongo projection maps legacy published and draft levels without inventing activities', async () => {
  const cl = { _id: 'class-4', status: 'active', name: 'Class 4' }
  const mockLevels = [
    { _id: 'level-one', classId: cl._id, number: 1, status: 'active', availability: 'PUBLISHED', title: 'Legacy Class 4 Lesson', curriculumVersion: 'legacy' },
    { _id: 'level-two', classId: cl._id, number: 2, status: 'draft', availability: 'UPCOMING', title: 'Draft Lesson' },
  ]
  const mockLessons = [
    { _id: 'lesson-one', levelId: 'level-one', title: 'Legacy playable', status: 'active', order: 1 },
    { _id: 'lesson-two', levelId: 'level-two', title: 'Blank', status: 'draft', order: 1, settings: { mappedPlaceholder: true } },
  ]
  const mock = {
    '../models/CurriculumClass': { CurriculumClass: { findOne: () => ({ select: () => ({ lean: async () => cl }) }) } },
    '../models/Level': { Level: { find: () => ({ select: () => ({ lean: async () => mockLevels }) }) } },
    '../models/Lesson': { Lesson: { find: () => ({ select: () => ({ sort: () => ({ lean: async () => mockLessons }) }) }) } },
    '../models/Activity': { Activity: { aggregate: async () => [{ _id: 'lesson-one', count: 4 }] } },
    '../curriculum/level-map-contract': contract,
    '../curriculum/roadmap': roadmap,
  }
  const service = load('services/level-map.service.ts', mock).LevelMapService
  const result = await service.grade(4)
  assert.equal(result.levels.length, 10)
  assert.equal(result.levels[0].status, 'PUBLISHED')
  assert.equal(result.levels[0].actualTitle, 'Legacy Class 4 Lesson')
  assert.equal(result.levels[1].status, 'DRAFT')
  assert.equal(result.levels[1].lessons[0].placeholder, true)
  assert.equal(result.levels[2].status, 'NOT_MAPPED')
  assert.equal(result.mappedCount, 2)
  assert.equal(result.publishedCount, 1)
  assert.equal((await service.level(4, 10)).address, 'g04-l10')
})

test('authorization, API mounting, admin UI and opt-in seed are explicitly integrated', () => {
  const file = (p) => fs.readFileSync(path.join(root, p), 'utf8')
  assert.match(file('backend/src/routes/level-map.routes.ts'), /authenticate, requireRole\('SCHOOL_ADMIN', 'TEACHER'\)/)
  assert.match(file('backend/src/routes/index.ts'), /router.use\('\/curriculum-map', levelMapRoutes\)/)
  assert.match(file('backend/src/controllers/level-map.controller.ts'), /KG planning is restricted/)
  assert.match(file('client/components/school/school-shell.tsx'), /\/school\/curriculum-map/)
  assert.match(file('client/app/school/curriculum-map/page.tsx'), /gradeLevelMapService.level/)
  const seed = file('backend/src/scripts/map-110-curriculum.ts')
  assert.match(seed, /process.argv.includes\('--apply'\)/)
  assert.match(seed, /if \(occupied.has\(outline.level\)\)/)
  assert.match(seed, /availability: 'UPCOMING', status: 'draft'/)
  assert.match(seed, /mappedPlaceholder: true/)
})


test('dry-run writes nothing, apply creates only missing drafts, rerun is idempotent', async () => {
  const classes = new Map([[0, { _id: 'kg-class', grade: 0, status: 'draft' }], [4, { _id: 'class-4', grade: 4, status: 'active' }]])
  const levels = [
    { _id: 'original-kg', classId: 'kg-class', number: 1, title: 'Original KG pilot', status: 'draft' },
    { _id: 'original-class4', classId: 'class-4', number: 1, title: 'Existing Class 4 content', status: 'active' },
  ]
  const lessons = [{ levelId: 'original-class4', order: 1, status: 'active' }]
  let writes = 0
  const classModel = {
    findOne: async ({ grade }) => classes.get(grade) || null,
    findOneAndUpdate: async ({ grade }, { $setOnInsert }) => {
      writes++
      if (!classes.has(grade)) classes.set(grade, { ...$setOnInsert, _id: `class-${grade}` })
      return classes.get(grade)
    },
  }
  const levelModel = {
    find: ({ classId }) => ({ select: async () => levels.filter((l) => String(l.classId) === String(classId)) }),
    findOneAndUpdate: async (filter, update) => {
      writes++
      let result = levels.find((l) => l.classId === filter.classId && l.number === filter.number)
      if (!result) {
        result = { ...update.$setOnInsert, _id: `${filter.classId}-${filter.number}` }
        levels.push(result)
      }
      return result
    },
  }
  const lessonModel = {
    updateOne: async (filter, update) => {
      writes++
      if (!lessons.some((l) => l.levelId === filter.levelId && l.order === filter.order)) {
        lessons.push({ ...update.$setOnInsert })
      }
    },
  }
  async function run(apply) {
    let finish
    const finished = new Promise((resolve) => { finish = resolve })
    let out = ''
    let failure = ''
    const localProcess = { argv: apply ? ['node', 'script', '--apply'] : ['node', 'script'], exitCode: 0 }
    load('scripts/map-110-curriculum.ts', {
      '../config/db': { connectDatabase: async () => {}, disconnectDatabase: async () => { finish() } },
      '../models/CurriculumClass': { CurriculumClass: classModel },
      '../models/Level': { Level: levelModel },
      '../models/Lesson': { Lesson: lessonModel },
      '../curriculum/roadmap': roadmap,
      '../curriculum/level-map-contract': contract,
    }, { process: localProcess, console: { log: (x) => { out += `${x}\n` }, error: (x) => { failure += String(x) } } })
    await finished
    assert.equal(localProcess.exitCode, 0, failure)
    return out
  }
  const before = await run(false)
  assert.match(before, /DRY_RUN/)
  assert.equal(writes, 0)
  assert.equal(levels.length, 2)
  const after = await run(true)
  assert.match(after, /APPLIED/)
  assert.equal(classes.size, 11)
  assert.equal(levels.length, 110)
  assert.equal(lessons.length, 109) // 108 new empty lessons + untouched Class 4 lesson
  assert.equal(levels.find((l) => l._id === 'original-kg').title, 'Original KG pilot')
  assert.equal(levels.find((l) => l._id === 'original-class4').title, 'Existing Class 4 content')
  assert.ok(levels.filter((l) => !l._id.startsWith('original')).every((l) => l.status === 'draft' && l.availability === 'UPCOMING' && l.unitNumber === l.number))
  const writesAfterFirstApply = writes
  await run(true)
  assert.equal(writes, writesAfterFirstApply)
  assert.equal(levels.length, 110)
  assert.equal(lessons.length, 109)
})
