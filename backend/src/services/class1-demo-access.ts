export const CLASS1_DEMO_VERSION = 'talkora-class1-l01-demo-draft-v1'
export const CLASS1_DEMO_EXPERIENCE_ID = 'g01-l01'
export const CLASS1_DEMO_ACTIVITY_PREFIX = 'class1-l01-'

export interface Class1DemoStudentIdentity {
  id: string
  grade: number
  status: string
}

/**
 * Development-only draft access for one explicitly configured student.
 * The authenticated Student document supplies this identity; browser input is
 * never used to select a grade, curriculum version, or allowlisted student.
 */
export function isAuthorizedClass1DemoStudent(
  student: Class1DemoStudentIdentity,
  options: {
    nodeEnv?: string
    enabled?: string
    studentId?: string
  } = {},
): boolean {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV
  const enabled = options.enabled ?? process.env.TALKORA_CLASS1_STUDENT_DEMO
  const configuredId = (options.studentId ?? process.env.TALKORA_CLASS1_DEMO_STUDENT_ID ?? '').trim().toLowerCase()
  const studentId = student.id.trim().toLowerCase()

  return nodeEnv !== 'production' &&
    enabled === 'true' &&
    student.grade === 1 &&
    student.status === 'active' &&
    /^[a-f0-9]{24}$/.test(configuredId) &&
    configuredId === studentId
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

export function isClass1DemoActivity(activity: {
  activityKey?: string
  curriculumVersion?: string
  status?: string
}): boolean {
  return activity.status === 'draft' &&
    activity.curriculumVersion === CLASS1_DEMO_VERSION &&
    activity.activityKey?.startsWith(CLASS1_DEMO_ACTIVITY_PREFIX) === true
}
