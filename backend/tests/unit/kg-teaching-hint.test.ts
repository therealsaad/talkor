import { kgTeachingHint } from '../../src/services/kg-teaching-hint'

test('does not fabricate a correction after a correct answer', () => {
  expect(kgTeachingHint('A', 'speak', 'correct')).toBeNull()
})
test('gives age-appropriate Hindi/English support for the child', () => {
  expect(kgTeachingHint('B', 'speak', 'incorrect')).toContain('B se ball')
  expect(kgTeachingHint('C', 'touch', 'incorrect')).toContain('cat')
  expect(kgTeachingHint('D', 'speak', 'unclear')).toContain('Koi baat nahi')
})
