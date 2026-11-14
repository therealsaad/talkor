import { kgLevelStatus, nextIncompletePlayableKGLevel } from '../../src/kg/level-progression'

describe('KG student level progression state', () => {
  it('selects the first incomplete level in the playable allowlist', () => {
    expect(nextIncompletePlayableKGLevel([1, 2, 3], [])).toBe(1)
    expect(nextIncompletePlayableKGLevel([1, 2, 3], [1])).toBe(2)
    expect(nextIncompletePlayableKGLevel([1, 2, 3], [1, 2])).toBe(3)
    expect(nextIncompletePlayableKGLevel([1, 2, 3], [1, 2, 3])).toBeNull()
    expect(nextIncompletePlayableKGLevel([1], [1])).toBeNull()
  })

  it('reports only playable and unlocked levels as available or in progress', () => {
    expect(kgLevelStatus({
      level: 1, playable: true, unlocked: true, completed: false, current: true, currentIndex: 0,
    })).toBe('available')
    expect(kgLevelStatus({
      level: 1, playable: true, unlocked: true, completed: false, current: true, currentIndex: 2,
    })).toBe('in_progress')
    expect(kgLevelStatus({
      level: 1, playable: true, unlocked: true, completed: true, current: false, currentIndex: 8,
    })).toBe('completed')
    expect(kgLevelStatus({
      level: 2, playable: false, unlocked: true, completed: true, current: false, currentIndex: 6,
    })).toBe('locked')
    expect(kgLevelStatus({
      level: 2, playable: true, unlocked: false, completed: false, current: false, currentIndex: 0,
    })).toBe('locked')
    expect(kgLevelStatus({
      level: 2, playable: true, unlocked: true, completed: false, current: false, currentIndex: 0,
    })).toBe('locked')
  })
})
