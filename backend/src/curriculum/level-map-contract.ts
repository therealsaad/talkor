import { GRADE_ROADMAP, roadmapForGrade, type RoadmapLevel } from './roadmap'

/** A stable curriculum address. One set of models/controllers serves all 110 addresses. */
export type MappedLevelStatus = 'NOT_MAPPED' | 'DRAFT' | 'INCOMPLETE' | 'PUBLISHED' | 'ARCHIVED'

export function parseGrade(value: unknown): number {
  if (typeof value !== 'string' || !/^(?:0|[1-9]|10)$/.test(value)) {
    throw new Error('grade must be an integer from 0 (KG) to 10')
  }
  return Number(value)
}

export function parseLevel(value: unknown): number {
  if (typeof value !== 'string' || !/^(?:[1-9]|10)$/.test(value)) {
    throw new Error('level must be an integer from 1 to 10')
  }
  return Number(value)
}

export function gradeName(grade: number): string {
  return grade === 0 ? 'Kindergarten (KG)' : `Class ${grade}`
}

export function roadmapEntry(grade: number, level: number): RoadmapLevel {
  const record = roadmapForGrade(grade)?.[level - 1]
  if (!record || record.grade !== grade || record.level !== level) {
    throw new Error('Curriculum address does not exist')
  }
  return record
}

export function mappedStatus(input: {
  present: boolean
  availability?: string
  status?: string
  activeLessons?: number
  activeActivities?: number
}): MappedLevelStatus {
  if (!input.present) return 'NOT_MAPPED'
  if (input.availability === 'ARCHIVED') return 'ARCHIVED'
  if (input.availability !== 'PUBLISHED' || input.status !== 'active') return 'DRAFT'
  // Never label a shell with no actual playable activities as a completed lesson.
  return (input.activeLessons ?? 0) > 0 && (input.activeActivities ?? 0) > 0 ? 'PUBLISHED' : 'INCOMPLETE'
}

/** Pure integrity check; run from tests and the seed script before any writes. */
export function assertRoadmapCoverage() {
  if (GRADE_ROADMAP.length !== 110) throw new Error('Expected 110 curriculum addresses')
  const seen = new Set<string>()
  for (const item of GRADE_ROADMAP) {
    if (!Number.isInteger(item.grade) || item.grade < 0 || item.grade > 10 ||
        !Number.isInteger(item.level) || item.level < 1 || item.level > 10 ||
        !item.title.trim() || item.id !== `g${String(item.grade).padStart(2, '0')}-l${String(item.level).padStart(2, '0')}` ||
        seen.has(item.id)) throw new Error(`Invalid or duplicated curriculum address: ${item.id}`)
    seen.add(item.id)
  }
  for (let grade = 0; grade <= 10; grade++) {
    if (roadmapForGrade(grade)?.length !== 10) throw new Error(`Class ${grade} does not have exactly ten level addresses`)
  }
}
