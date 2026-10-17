import { env } from '../config/env'
import { KG_CURRICULUM_VERSION } from '../curriculum/kg/constants'

export { KG_CURRICULUM_VERSION }

export interface KGPilotStudentIdentity {
  id: string
  grade: number
  status: string
}

/** Authorization is based on a server-configured Student _id and the persisted Grade 0 profile. */
export function isAuthorizedKGPilotStudent(
  student: KGPilotStudentIdentity,
  allowlistedIds: readonly string[] = env.kgPilotStudentIds,
): boolean {
  const id = student.id.toLowerCase()
  return student.grade === 0 &&
    student.status === 'active' &&
    /^[a-f0-9]{24}$/.test(id) &&
    allowlistedIds.some((allowlistedId) => allowlistedId.toLowerCase() === id)
}

/** Separate ABCD alphabet pilot; opt-in is persisted per school-admin-approved student. */
export function isAuthorizedKGAlphabetStudent(
  student: KGPilotStudentIdentity & { kgAlphabetPilotEnabled?: boolean },
  legacyAllowlistedIds: readonly string[] = env.kgPilotStudentIds,
): boolean {
  return student.grade === 0 && student.status === 'active' &&
    (student.kgAlphabetPilotEnabled === true || isAuthorizedKGPilotStudent(student, legacyAllowlistedIds))
}

export function isKGPilotLevel(level: {
  curriculumVersion?: string
  status?: string
  availability?: string
}): boolean {
  return level.curriculumVersion === KG_CURRICULUM_VERSION &&
    level.status === 'draft' &&
    level.availability === 'UPCOMING'
}
