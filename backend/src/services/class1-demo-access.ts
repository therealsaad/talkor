export const CLASS1_DEMO_VERSION = 'talkora-class1-l01-demo-draft-v1'
export const CLASS1_DEMO_EXPERIENCE_ID = 'g01-l01'
export const CLASS1_DEMO_ACTIVITY_PREFIX = 'class1-l01-'

/** Shared database filters keep every demo read pinned to the same draft. */
export const CLASS1_DEMO_LESSON_FILTER = {
  status: 'draft' as const,
  'settings.talkoraDemoDraft': true,
  'settings.experienceId': CLASS1_DEMO_EXPERIENCE_ID,
}

export const CLASS1_DEMO_ACTIVITY_FILTER = {
  status: 'draft' as const,
  curriculumVersion: CLASS1_DEMO_VERSION,
  activityKey: /^class1-l01-/,
}

export interface Class1DemoStudentIdentity {
  id: string
  grade: number
  status: string
}

/**
 * Development-only draft access for an explicitly configured student or,
 * when the separate all-students flag is enabled, every active Class 1 student.
 * The authenticated Student document supplies this identity; browser input is
 * never used to select a grade or curriculum version.
 */
export function isAuthorizedClass1DemoStudent(
  student: Class1DemoStudentIdentity,
  options: {
    nodeEnv?: string
    enabled?: string
    studentId?: string
    allStudents?: string
  } = {},
): boolean {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV
  const enabled = options.enabled ?? process.env.TALKORA_CLASS1_STUDENT_DEMO
  const allStudents = options.allStudents ?? process.env.TALKORA_CLASS1_DEMO_ALL_STUDENTS
  const configuredId = (options.studentId ?? process.env.TALKORA_CLASS1_DEMO_STUDENT_ID ?? '').trim().toLowerCase()
  const studentId = student.id.trim().toLowerCase()

  return nodeEnv === 'development' &&
    enabled === 'true' &&
    student.grade === 1 &&
    student.status === 'active' &&
    (allStudents === 'true' || (/^[a-f0-9]{24}$/.test(configuredId) && configuredId === studentId))
}

export function isClass1DemoLevel(level: {
  number?: number
  curriculumVersion?: string
  status?: string
  availability?: string
}): boolean {
  return level.number === 1 &&
    level.curriculumVersion === CLASS1_DEMO_VERSION &&
    level.status === 'draft' &&
    level.availability === 'UPCOMING'
}

export function isClass1DemoLesson(lesson: {
  status?: string
  settings?: Record<string, unknown>
}): boolean {
  return lesson.status === 'draft' &&
    lesson.settings?.talkoraDemoDraft === true &&
    lesson.settings?.experienceId === CLASS1_DEMO_EXPERIENCE_ID
}

export function isClass1DemoActivity(activity: {
  activityKey?: string
  curriculumVersion?: string
  status?: string
}): boolean {
  return activity.status === 'draft' &&
    activity.curriculumVersion === CLASS1_DEMO_VERSION &&
    Boolean(activity.activityKey && /^class1-l01-v(?:2|3)-/.test(activity.activityKey))
}

/** An additive Class 1 First Day lesson coexists with historic v2 student
 * attempts and progress. Prefer it only after the media-verified installer
 * marks all ten scenes ready. KG and ordinary published lessons are unchanged. */
export const CLASS1_FIRST_DAY_PARALLEL_REVISION = 'class1-first-day-only-v3-parallel'

export function preferClass1FirstDayLesson<T extends { settings?: Record<string, unknown> | null }>(
  lessons: T[],
): T[] {
  const firstDay = lessons.filter(lesson =>
    lesson.settings?.lessonPlanRevision === CLASS1_FIRST_DAY_PARALLEL_REVISION)
  return firstDay.length ? firstDay : lessons
}
