/**
 * Canonical metric definitions for school/teacher Learning Progress reporting.
 * Every dashboard number must map to one of these definitions and to persisted data.
 *
 * Source of truth for verified level completion:
 *   Progress.levels[] where status === 'completed' (set only by ProgressService after
 *   required+core activities in every lesson of the level are correctly completed).
 *
 * KG Level 1 (grade 0 alphabet pilot) uses KGAlphabetProgress.completedAt /
 * currentIndex === 8 as the verified completion signal for that parallel track.
 */

export const LEARNING_PROGRESS_METRIC_DEFINITIONS = {
  enrolledStudents:
    'Count of students with status=active in the reporting scope (school, or teacher-assigned roster). Teachers and inactive/deleted students are excluded.',
  studentsWithLearningActivity:
    'Unique enrolled students who have at least one ActivityAttempt (or KGAlphabetAttempt for grade 0) recorded.',
  uniqueVerifiedLevelCompletions:
    'Count of unique (studentId, levelId) pairs with Progress.levels.status === "completed". A student completing the same level twice still counts once. KG L1 complete counts as one completion for grade-0 pilots when curriculum Progress does not already record it.',
  studentsWhoCompletedAtLeastOneLevel:
    'Unique enrolled students with ≥1 verified level completion as defined above.',
  studentsInProgressAny:
    'Unique enrolled students with Progress.levels.status === "in-progress" for any level, or ActivityAttempt/KG activity for a level that is not yet completed — and who have zero verified completions for that level.',
  levelCompletedStudents:
    'Unique enrolled students in the eligible roster for a selected level whose Progress records that level as status === "completed" (or KG L1 verified complete when reporting the KG alphabet level).',
  levelInProgressStudents:
    'Eligible students for a selected level who have recorded learning activity for that level (Progress status in-progress/unlocked with lesson activity, or ActivityAttempt for that levelId) but do not have verified completion.',
  levelNotStartedStudents:
    'Eligible enrolled students for a selected level with no Progress activity and no ActivityAttempt for that levelId.',
  completionRate:
    'levelCompletedStudents ÷ eligible enrolled students × 100 for one selected level and scope. Null/unavailable when the denominator is 0. Never uses curriculum lesson document counts as the denominator.',
  activeLearnersInPeriod:
    'Unique enrolled students with ≥1 ActivityAttempt (or KGAlphabetAttempt) whose createdAt falls inside the selected UTC date range.',
  timeSpentMinutes:
    'Sum of ActivityAttempt.timeTakenMs (and KGAlphabetAttempt.timeSpentMs when applicable) ÷ 60000. Shown only when attempt timestamps exist; never fabricated from attempt counts alone.',
} as const

export type LearningProgressState = 'completed' | 'in_progress' | 'not_started'

export function completionRatePercent(completed: number, eligible: number): number | null {
  if (eligible <= 0) return null
  return Math.round((completed / eligible) * 1000) / 10
}
