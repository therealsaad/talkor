export type AuditClassDocument = {
  _id: unknown
  grade: number
  name?: string
  status?: string
}

export type AuditLevelDocument = {
  _id: unknown
  classId: unknown
  requiredLevelId?: unknown
  number?: number
  title?: string
  status?: string
  availability?: string
  curriculumVersion?: string
  sourceBook?: string
  sourcePages?: number[]
}

export type AuditLessonDocument = {
  _id: unknown
  levelId: unknown
  title?: string
  status?: string
}

export type AuditActivityDocument = {
  _id: unknown
  lessonId: unknown
  grade?: number
  status?: string
  core?: boolean
  required?: boolean
  source?: {
    sourceType?: string
    pdf?: string
    pageStart?: number
    pageEnd?: number
  }
}

export type CurriculumAuditInput = {
  classes: readonly AuditClassDocument[]
  levels: readonly AuditLevelDocument[]
  lessons: readonly AuditLessonDocument[]
  activities: readonly AuditActivityDocument[]
}

export type CurriculumGradeAudit = {
  grade: number
  curriculumClassId: string | null
  curriculumClassName: string | null
  curriculumClassStatus: string | null
  unitCount: number
  publishedUnitCount: number
  publishedLessonCount: number
  activityCount: number
  requiredActivityCount: number
  sourceMaterialReferenceCount: number
  missingReferences: string[]
}

export type CurriculumAuditReport = {
  grades: CurriculumGradeAudit[]
  orphanReferences: string[]
}

function referenceId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && 'toString' in value) {
    return String(value)
  }
  return String(value)
}

function hasSourceMaterialReference(level: AuditLevelDocument): boolean {
  return Boolean(level.sourceBook?.trim() && level.sourcePages?.length)
}

function activityHasSourceMaterialReference(activity: AuditActivityDocument): boolean {
  return activity.source?.sourceType === 'SYLLABUS' && Boolean(
    activity.source.pdf?.trim() || activity.source.pageStart !== undefined || activity.source.pageEnd !== undefined,
  )
}

/** Pure summary logic shared by the Atlas audit and database-free tests. */
export function auditCurriculumDocuments(input: CurriculumAuditInput): CurriculumAuditReport {
  const classIds = new Set(input.classes.map((item) => referenceId(item._id)))
  const levelById = new Map(input.levels.map((item) => [referenceId(item._id), item]))
  const lessonById = new Map(input.lessons.map((item) => [referenceId(item._id), item]))
  const lessonsByLevel = new Map<string, AuditLessonDocument[]>()
  const activitiesByLesson = new Map<string, AuditActivityDocument[]>()
  const orphanReferences: string[] = []

  for (const level of input.levels) {
    const classId = referenceId(level.classId)
    if (!classIds.has(classId)) orphanReferences.push(`Level ${referenceId(level._id)} references missing CurriculumClass ${classId || '(empty)'}`)
    const requiredLevelId = referenceId(level.requiredLevelId)
    if (requiredLevelId && !levelById.has(requiredLevelId)) {
      orphanReferences.push(`Level ${referenceId(level._id)} references missing prerequisite Level ${requiredLevelId}`)
    }
  }

  for (const lesson of input.lessons) {
    const levelId = referenceId(lesson.levelId)
    if (!levelById.has(levelId)) orphanReferences.push(`Lesson ${referenceId(lesson._id)} references missing Level ${levelId || '(empty)'}`)
    lessonsByLevel.set(levelId, [...(lessonsByLevel.get(levelId) || []), lesson])
  }

  for (const activity of input.activities) {
    const lessonId = referenceId(activity.lessonId)
    if (!lessonById.has(lessonId)) orphanReferences.push(`Activity ${referenceId(activity._id)} references missing Lesson ${lessonId || '(empty)'}`)
    activitiesByLesson.set(lessonId, [...(activitiesByLesson.get(lessonId) || []), activity])
  }

  const grades: CurriculumGradeAudit[] = []
  for (let grade = 0; grade <= 10; grade += 1) {
    const gradeClasses = input.classes.filter((item) => item.grade === grade)
    const activeClasses = gradeClasses.filter((item) => item.status === 'active')
    const displayClass = activeClasses[0] || gradeClasses[0] || null
    const activeClassIds = new Set(activeClasses.map((item) => referenceId(item._id)))
    const classIdsForGrade = new Set(gradeClasses.map((item) => referenceId(item._id)))
    const gradeLevels = input.levels.filter((item) => classIdsForGrade.has(referenceId(item.classId)))
    const publishedLevels = gradeLevels.filter((item) => activeClassIds.has(referenceId(item.classId)) && item.status === 'active' && item.availability === 'PUBLISHED')
    const publishedLevelIds = new Set(publishedLevels.map((item) => referenceId(item._id)))
    const publishedLessons = input.lessons.filter((item) => item.status === 'active' && publishedLevelIds.has(referenceId(item.levelId)))
    const publishedLessonIds = new Set(publishedLessons.map((item) => referenceId(item._id)))
    const publishedActivities = input.activities.filter((item) => item.status === 'active' && publishedLessonIds.has(referenceId(item.lessonId)))
    const missingReferences: string[] = []

    if (activeClasses.length === 0) missingReferences.push(`No active CurriculumClass is configured for grade ${grade}`)
    if (activeClasses.length > 1) missingReferences.push(`${activeClasses.length} active CurriculumClass records use grade ${grade}`)
    if (activeClasses.length > 0 && publishedLevels.length === 0) {
      missingReferences.push(`No active published units are configured for grade ${grade}`)
    }

    for (const level of publishedLevels) {
      const levelId = referenceId(level._id)
      const activeLessons = (lessonsByLevel.get(levelId) || []).filter((lesson) => lesson.status === 'active')
      if (activeLessons.length === 0) missingReferences.push(`Published unit ${level.title || levelId} has no active lesson`)
      for (const lesson of activeLessons) {
        const lessonId = referenceId(lesson._id)
        const activeActivities = (activitiesByLesson.get(lessonId) || []).filter((activity) => activity.status === 'active')
        if (activeActivities.length === 0) missingReferences.push(`Published lesson ${lesson.title || lessonId} has no active activity`)
      }
    }

    const classLevelIds = new Set(gradeLevels.map((item) => referenceId(item._id)))
    const syllabusReferences = input.levels.filter((item) => classLevelIds.has(referenceId(item._id)) && hasSourceMaterialReference(item)).length
      + publishedActivities.filter(activityHasSourceMaterialReference).length

    grades.push({
      grade,
      curriculumClassId: displayClass ? referenceId(displayClass._id) : null,
      curriculumClassName: displayClass?.name || null,
      curriculumClassStatus: displayClass?.status || null,
      unitCount: gradeLevels.length,
      publishedUnitCount: publishedLevels.length,
      publishedLessonCount: publishedLessons.length,
      activityCount: publishedActivities.length,
      requiredActivityCount: publishedActivities.filter((item) => item.core !== false && item.required !== false).length,
      sourceMaterialReferenceCount: syllabusReferences,
      missingReferences,
    })
  }

  return { grades, orphanReferences }
}
