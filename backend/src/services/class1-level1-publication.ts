import { CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_PARALLEL_REVISION } from './class1-demo-access'
import { FIRST_DAY_SCENES } from '../scripts/class1-first-day-scenes'

type Status = 'active' | 'draft'
export interface Class1ReleaseSnapshot {
  grade: number
  classroomStatus: Status
  level: { number: number; status: Status; availability: string; curriculumVersion: string }
  lesson: {
    status: Status
    settings?: Record<string, unknown> | null
  }
  activities: Array<{
    activityKey?: string
    status: string
    type: string
    curriculumVersion?: string
    aiEnabled?: boolean
    allowMic?: boolean
    voiceEnabled?: boolean
    core?: boolean
    required?: boolean
    content?: Record<string, unknown>
  }>
  otherActiveLessons: number
  savedCompletedLevels: number
}

/** Static validation of the *actual Mongo* v3 lesson; never trust a preview
 * config, draft-approval checkbox, or frontend map as a publishing signal.
 * All activity IDs and student progress survive the release untouched.
 */
export function class1Level1ReleaseBlockers(input: Class1ReleaseSnapshot): string[] {
  const blockers: string[] = []
  if (input.grade !== 1 || input.level.number !== 1 ||
      input.level.curriculumVersion !== CLASS1_DEMO_VERSION)
    blockers.push('WRONG_LEVEL_OR_CURRICULUM')
  if (!['active', 'draft'].includes(input.classroomStatus))
    blockers.push('INVALID_CLASS_STATUS')
  if (input.level.status !== 'draft' || input.level.availability !== 'UPCOMING')
    blockers.push('LEVEL_NOT_A_PROTECTED_DRAFT')
  if (input.lesson.status !== 'draft' ||
      input.lesson.settings?.talkoraDemoDraft !== true ||
      input.lesson.settings?.experienceId !== 'g01-l01' ||
      input.lesson.settings?.lessonPlanRevision !== CLASS1_FIRST_DAY_PARALLEL_REVISION)
    blockers.push('WRONG_FIRST_DAY_LESSON_REVISION')
  if (input.otherActiveLessons !== 0) blockers.push('COMPETING_ACTIVE_LESSON')
  if (input.savedCompletedLevels !== 0) blockers.push('COMPLETED_LEGACY_PROGRESS_NEEDS_REVIEW')
  if (input.activities.length !== FIRST_DAY_SCENES.length) blockers.push('INCOMPLETE_SCENE_COUNT')
  const keys = new Set<string>()
  for (let i = 0; i < input.activities.length; i++) {
    const item = input.activities[i]
    const expected = FIRST_DAY_SCENES[i]
    if (!item || !expected ||
        item.activityKey !== 'class1-l01-v3-' + expected.key ||
        item.status !== 'draft' ||
        item.type !== 'CONVERSATION' ||
        item.curriculumVersion !== CLASS1_DEMO_VERSION ||
        item.aiEnabled !== true || item.voiceEnabled !== true || item.allowMic !== true ||
        item.core === false || item.required === false ||
        item.content?.audioKey !== 'class-01/level-01/v3/' + expected.key + '-en.wav')
      blockers.push('INVALID_SCENE_' + (i + 1))
    if (item?.activityKey) keys.add(item.activityKey)
  }
  if (keys.size !== input.activities.length) blockers.push('DUPLICATE_SCENE_KEYS')
  return blockers
}

export function requiredClass1AudioKeys(): string[] {
  return FIRST_DAY_SCENES.map(scene => 'class-01/level-01/v3/' + scene.key + '-en.wav')
}

/** Do not infer approval from the fact that a file exists. */
export function class1ReleaseApprovalBlockers(approval: {
  release?: string; intro?: string; audio?: string; device?: string
}): string[] {
  return ([
    ['release', 'TALKORA_CLASS1_L01_RELEASE_APPROVED'],
    ['intro', 'TALKORA_FIRST_DAY_INTRO_REVIEWED'],
    ['audio', 'TALKORA_FIRST_DAY_AUDIO_REVIEWED'],
    ['device', 'TALKORA_CLASS1_L01_DEVICE_TESTED'],
  ] as const).filter(([key]) => approval[key] !== 'YES').map(([, name]) => name + '_NOT_CONFIRMED')
}
