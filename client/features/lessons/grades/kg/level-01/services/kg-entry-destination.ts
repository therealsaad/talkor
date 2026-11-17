import type { KGAlphabetState } from './kg-alphabet-service'

export function kgStudentEntryDestination(state: KGAlphabetState): '/student/kg' | '/student/kg/map' {
  const level = state.nextIncompleteLevel
  if (level === null || !state.studentPlayableLevels.includes(level) || !state.unlockedLevels.includes(level)) {
    return '/student/kg/map'
  }

  const progress = state.levels.find((item) => item.level === level)
  if (!progress || (progress.status !== 'available' && progress.status !== 'in_progress')) {
    return '/student/kg/map'
  }

  return level === 1 ? '/student/kg' : '/student/kg/map'
}
