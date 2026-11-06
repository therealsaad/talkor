import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const shared = await read('../../features/lessons/grades/kg/future-level-drafts.ts')
const class1Plan = await read('../../features/lessons/grades/class-01/level-02/teaching-plan.ts')
const class1Activities = await read('../../features/lessons/grades/class-01/level-02/activities.ts')
const class1Config = await read('../../features/lessons/grades/class-01/level-02/config.ts')
const kgCatalog = await read('../../../backend/src/kg/student-continuation-catalog.ts')
const studentResume = await read('../../app/student/continue/page.tsx')

test('five distinct KG6–10 drafts have 8 original safe activities each and stage before publication', async () => {
  assert.match(shared, /export const KG_FUTURE_DRAFTS/)
  assert.match(shared, /approved: false/)
  assert.match(shared, /introStoryboard:/)
  assert.match(shared, /visualBriefs:/)
  assert.match(shared, /teacherReview:/)
  assert.match(shared, /evidence: 'Spoken homework/)
  assert.match(shared, /no family evidence submission|non-recorded speaking homework|no family recording/)
  for (let level = 6; level <= 10; level++) {
    const next = level === 10 ? ']\n\nexport function kgFutureDraft' : '  {\n    level: ' + (level + 1) + ','
    const start = shared.indexOf('  {\n    level: ' + level + ',')
    assert.ok(start >= 0, 'missing level ' + level)
    const end = shared.indexOf(next, start + 10)
    assert.ok(end > start, 'missing next stage ' + level)
    const section = shared.slice(start, end)
    assert.equal((section.match(/\{ mode: '/g) || []).length, 8, 'need 8 real authored beats at KG' + level)
    assert.match(section, /mode: 'tap-picture'/)
    assert.match(section, /mode: 'repeat-after-julie'/)
    assert.match(section, /mode: 'listen-and-find'/)
    assert.match(section, /mode: 'guided-dialogue'/)
    const code = String(level).padStart(2, '0')
    const [activities, config, interactions, assets] = await Promise.all([
      read('../../features/lessons/grades/kg/level-' + code + '/activities.ts'),
      read('../../features/lessons/grades/kg/level-' + code + '/config.ts'),
      read('../../features/lessons/grades/kg/level-' + code + '/interactions.ts'),
      read('../../features/lessons/grades/kg/level-' + code + '/assets.json'),
    ])
    assert.ok(activities.includes('kgFutureDraftActivities(' + level + ')'))
    assert.match(config, /"studentPlayable": false/)
    assert.match(config, /"syllabusVerified": false/)
    assert.match(config, /"introMustComplete": true/)
    assert.match(interactions, /"guided-dialogue"/)
    assert.match(assets, /"introVideo": null/)
    assert.match(assets, /"images": \[\]/)
  }
})

test('KG6–10 authorship never bypasses the authenticated 3–5 student pilot catalog', () => {
  assert.match(kgCatalog, /KG_CONTINUATION_LEVELS = \[3, 4, 5\]/)
  assert.match(studentResume, /kgContinuationStudentService\.overview\(\)/)
  assert.doesNotMatch(kgCatalog, /KG_CONTINUATION_LEVELS = \[3, 4, 5, 6/)
})

test('Class 1 Balbharati 1.2–1.6 draft has references, optional bilingual scaffolds, new revision and no student publication', () => {
  for (const chapter of ['1.2', '1.3', '1.4', '1.5', '1.6']) {
    assert.ok(class1Plan.includes("chapter: '" + chapter + "'"), 'missing ' + chapter)
  }
  assert.match(class1Plan, /hintHi/)
  assert.match(class1Plan, /hintMr/)
  assert.match(class1Plan, /CLASS1_LEVEL2_STORYBOARD/)
  assert.match(class1Plan, /CLASS1_LEVEL2_ART_BRIEFS/)
  assert.equal((class1Plan.match(/approved: false \}/g) || []).length, 6)
  assert.match(class1Activities, /\.\.\.class1DraftActivities\(2\)/)
  assert.match(class1Activities, /\.\.\.CLASS1_LEVEL2_REVIEW_ACTIVITIES/)
  assert.match(class1Config, /"studentPlayable": false/)
  assert.match(class1Config, /"syllabusVerified": false/)
  assert.match(class1Config, /"introMustComplete": true/)
})
