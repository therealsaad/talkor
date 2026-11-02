import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveKGResume, verifyExpectation } from '../scripts/accept-kg-live-session.mjs'

const level1Done = { completed: true, level2Available: true, currentIndex: 8 }
const level2Done = { completed: true, currentIndex: 6 }
const continuation = (nextLevel, statuses) => ({
  nextLevel,
  levels: [3, 4, 5].map((level) => ({
    level, status: statuses[level] || 'LOCKED',
    currentIndex: statuses[level] === 'COMPLETED' ? (level === 5 ? 4 : 6) : 2,
  })),
})

test('new KG student starts Level 1, not an arbitrary level', () => {
  const resolved = deriveKGResume({ completed: false, currentIndex: 3 })
  assert.deepEqual(resolved, {
    nextLevel: 1, currentIndex: 3, route: '/student/kg', completedLevels: [],
  })
})

test('completing KG1 routes to unfinished Level 2; never skips E–J', () => {
  const resolved = deriveKGResume(level1Done, { completed: false, currentIndex: 4 })
  assert.deepEqual(resolved, {
    nextLevel: 2, currentIndex: 4, route: '/student/kg/level-2', completedLevels: [1],
  })
  assert.throws(() => deriveKGResume({ ...level1Done, level2Available: false }), /not unlocked/)
})

test('fresh PIN resume resolves KG3, then KG4, then KG5 from backend cursor', () => {
  for (const [next, statuses, completed] of [
    [3, { 3: 'CURRENT' }, [1, 2]],
    [4, { 3: 'COMPLETED', 4: 'CURRENT' }, [1, 2, 3]],
    [5, { 3: 'COMPLETED', 4: 'COMPLETED', 5: 'CURRENT' }, [1, 2, 3, 4]],
  ]) {
    const state = deriveKGResume(level1Done, level2Done, continuation(next, statuses))
    assert.equal(state.nextLevel, next)
    assert.equal(state.currentIndex, 2)
    assert.equal(state.route, '/student/kg/level-' + next)
    assert.deepEqual(state.completedLevels, completed)
    assert.equal(verifyExpectation(state, {
      'expect-level': String(next), 'expect-index': '2',
      'expect-completed': String(next - 1),
    }), true)
  }
})

test('all KG levels complete ends on the map without falsely publishing Level 6', () => {
  const state = deriveKGResume(level1Done, level2Done, continuation(null, {
    3: 'COMPLETED', 4: 'COMPLETED', 5: 'COMPLETED',
  }))
  assert.equal(state.nextLevel, 'map')
  assert.equal(state.currentIndex, null)
  assert.equal(state.route, '/student/kg/map')
  assert.deepEqual(state.completedLevels, [1, 2, 3, 4, 5])
  assert.equal(verifyExpectation(state, { 'expect-level': 'map', 'expect-completed': '5' }), true)
})

test('no false PASS for stale or contradictory server state', () => {
  assert.throws(() => deriveKGResume(level1Done, null, null), /Missing KG Level 2/)
  assert.throws(() => deriveKGResume(level1Done, level2Done, continuation(6, {})), /unapproved/)
  assert.throws(() => deriveKGResume(level1Done, level2Done, continuation(null, { 3: 'CURRENT' })),
    /contradicts/)
  const state = deriveKGResume(level1Done, level2Done, continuation(3, { 3: 'CURRENT' }))
  assert.throws(() => verifyExpectation(state, { 'expect-level': '4' }), /mismatch/)
  assert.throws(() => verifyExpectation(state, { 'expect-index': '0' }), /mismatch/)
  assert.throws(() => verifyExpectation(state, { 'expect-completed': '3' }), /not saved/)
})
