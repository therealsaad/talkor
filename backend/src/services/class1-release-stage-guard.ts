import { CLASS1_DEMO_VERSION } from './class1-demo-access'

/** Pure preflight rules for additive staging. No flags or frontend labels can
 * upgrade a level to PUBLISHED; that remains the separate release transaction. */
export function class1FirstDayStageBlockers(input: {
  existingLevel?: { status: string; availability: string; curriculumVersion: string } | null
  existingV3Count: number
  activeLessonCount: number
  completedLegacyCount: number
}): string[] {
  const blockers: string[] = []
  if (input.existingLevel && (
    input.existingLevel.status !== 'draft' ||
    input.existingLevel.availability !== 'UPCOMING' ||
    input.existingLevel.curriculumVersion !== CLASS1_DEMO_VERSION
  )) blockers.push('LEVEL1_ALREADY_ACTIVE_OR_NOT_A_REVIEWABLE_DRAFT')
  if (input.existingV3Count !== 0) blockers.push('FIRST_DAY_V3_ALREADY_EXISTS_REVIEW_BEFORE_RETRY')
  if (input.activeLessonCount > 0) blockers.push('COMPETING_ACTIVE_LESSON')
  if (input.completedLegacyCount > 0) blockers.push('COMPLETED_LEGACY_PROGRESS_NEEDS_REVIEW')
  return blockers
}

export function class1StageApprovalBlockers(input: {
  database: string
  expectedDatabase?: string
  stage?: string
  intro?: string
  audio?: string
}): string[] {
  const blockers: string[] = []
  if (!input.database || !input.expectedDatabase ||
      input.expectedDatabase !== input.database) blockers.push('EXPLICIT_TARGET_DATABASE_MISMATCH')
  if (input.stage !== 'YES') blockers.push('TALKORA_CLASS1_L01_STAGE_APPROVED_NOT_CONFIRMED')
  if (input.intro !== 'YES') blockers.push('TALKORA_FIRST_DAY_INTRO_REVIEWED_NOT_CONFIRMED')
  if (input.audio !== 'YES') blockers.push('TALKORA_FIRST_DAY_AUDIO_REVIEWED_NOT_CONFIRMED')
  return blockers
}
