import { Types } from 'mongoose'
import { Student } from '../models/Student'
import { Teacher } from '../models/Teacher'
import { Progress } from '../models/Progress'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Level } from '../models/Level'
import { CurriculumClass } from '../models/CurriculumClass'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGAlphabetAttempt } from '../models/KGAlphabetAttempt'
import { ApiError } from '../utils/ApiError'
import {
  LEARNING_PROGRESS_METRIC_DEFINITIONS,
  completionRatePercent,
  type LearningProgressState,
} from './learning-progress.metrics'

export type LearningProgressScope = {
  schoolId: string
  /** When set, restrict to students assigned to this teacher. */
  teacherId?: string
}

export type LearningProgressFilters = {
  grade?: number
  className?: string
  from?: Date
  to?: Date
  search?: string
  state?: LearningProgressState
  page?: number
  limit?: number
}

type RosterStudent = {
  _id: Types.ObjectId
  fullName: string
  rollNumber: string
  grade: number
  className?: string
  teacherId?: Types.ObjectId
}

function oid(id: string) {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid id')
  return new Types.ObjectId(id)
}

function parseDateBound(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw ApiError.badRequest('Dates must be YYYY-MM-DD in UTC')
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (endOfDay) return new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

export function parseLearningProgressQuery(query: Record<string, unknown>): LearningProgressFilters {
  const filters: LearningProgressFilters = {}
  if (query.grade !== undefined && query.grade !== '') {
    const grade = Number(query.grade)
    if (!Number.isInteger(grade) || grade < 0 || grade > 10) throw ApiError.badRequest('grade must be 0–10')
    filters.grade = grade
  }
  if (typeof query.className === 'string' && query.className.trim()) {
    filters.className = query.className.trim()
  }
  if (typeof query.search === 'string' && query.search.trim()) {
    filters.search = query.search.trim().slice(0, 80)
  }
  if (typeof query.state === 'string' && query.state) {
    if (!['completed', 'in_progress', 'not_started'].includes(query.state)) {
      throw ApiError.badRequest('state must be completed, in_progress, or not_started')
    }
    filters.state = query.state as LearningProgressState
  }
  filters.from = parseDateBound(typeof query.from === 'string' ? query.from : undefined, false)
  filters.to = parseDateBound(typeof query.to === 'string' ? query.to : undefined, true)
  if (filters.from && filters.to && filters.from > filters.to) {
    throw ApiError.badRequest('from must be on or before to')
  }
  const page = query.page === undefined || query.page === '' ? 1 : Number(query.page)
  const limit = query.limit === undefined || query.limit === '' ? 25 : Number(query.limit)
  if (!Number.isInteger(page) || page < 1) throw ApiError.badRequest('page must be a positive integer')
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw ApiError.badRequest('limit must be 1–100')
  filters.page = page
  filters.limit = limit
  return filters
}

async function loadRoster(scope: LearningProgressScope, filters: LearningProgressFilters = {}): Promise<RosterStudent[]> {
  const match: Record<string, unknown> = {
    schoolId: oid(scope.schoolId),
    status: 'active',
  }
  if (scope.teacherId) match.teacherId = oid(scope.teacherId)
  if (filters.grade !== undefined) match.grade = filters.grade
  if (filters.className) match.className = filters.className
  if (filters.search) {
    match.$or = [
      { fullName: { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { rollNumber: { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ]
  }
  return Student.find(match).select('_id fullName rollNumber grade className teacherId').lean() as Promise<RosterStudent[]>
}

/** Flatten verified completions from Progress docs for a set of students. */
async function verifiedCompletions(studentIds: Types.ObjectId[], from?: Date, to?: Date) {
  if (!studentIds.length) return [] as Array<{
    studentId: Types.ObjectId
    levelId: Types.ObjectId
    completedAt?: Date
    totalTimeMs: number
    curriculumVersion: string
    classId: Types.ObjectId
  }>
  const pipeline: object[] = [
    { $match: { studentId: { $in: studentIds } } },
    { $unwind: '$levels' },
    { $match: { 'levels.status': 'completed' } },
  ]
  if (from || to) {
    const completedAt: Record<string, Date> = {}
    if (from) completedAt.$gte = from
    if (to) completedAt.$lte = to
    pipeline.push({ $match: { 'levels.completedAt': completedAt } })
  }
  pipeline.push({
    $project: {
      _id: 0,
      studentId: 1,
      levelId: '$levels.levelId',
      completedAt: '$levels.completedAt',
      totalTimeMs: '$levels.totalTimeMs',
      curriculumVersion: 1,
      classId: 1,
    },
  })
  // Deduplicate same student+level across Progress docs (e.g. grade changes).
  pipeline.push({
    $group: {
      _id: { studentId: '$studentId', levelId: '$levelId' },
      completedAt: { $min: '$completedAt' },
      totalTimeMs: { $max: '$totalTimeMs' },
      curriculumVersion: { $first: '$curriculumVersion' },
      classId: { $first: '$classId' },
    },
  })
  pipeline.push({
    $project: {
      _id: 0,
      studentId: '$_id.studentId',
      levelId: '$_id.levelId',
      completedAt: 1,
      totalTimeMs: 1,
      curriculumVersion: 1,
      classId: 1,
    },
  })
  return Progress.aggregate(pipeline as import('mongoose').PipelineStage[]).allowDiskUse(true)
}

async function levelActivityStudentIds(studentIds: Types.ObjectId[], levelId: Types.ObjectId) {
  if (!studentIds.length) return new Set<string>()
  const [fromProgress, fromAttempts] = await Promise.all([
    Progress.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $unwind: '$levels' },
      {
        $match: {
          'levels.levelId': levelId,
          $or: [
            { 'levels.status': { $in: ['in-progress', 'completed'] } },
            { 'levels.lessons.0': { $exists: true } },
            { 'levels.totalTimeMs': { $gt: 0 } },
          ],
        },
      },
      { $group: { _id: '$studentId' } },
    ]).allowDiskUse(true),
    ActivityAttempt.distinct('studentId', { studentId: { $in: studentIds }, levelId }),
  ])
  const ids = new Set<string>()
  for (const row of fromProgress) ids.add(String(row._id))
  for (const id of fromAttempts) ids.add(String(id))
  return ids
}

async function kgVerifiedCompletions(studentIds: Types.ObjectId[], from?: Date, to?: Date) {
  if (!studentIds.length) return [] as Array<{ studentId: Types.ObjectId; completedAt: Date }>
  const match: Record<string, unknown> = {
    studentId: { $in: studentIds },
    currentIndex: 8,
    completedAt: { $exists: true, $ne: null },
  }
  if (from || to) {
    const completedAt: Record<string, Date> = {}
    if (from) completedAt.$gte = from
    if (to) completedAt.$lte = to
    match.completedAt = { ...completedAt, $exists: true, $ne: null }
  }
  return KGAlphabetProgress.find(match).select('studentId completedAt').lean() as Promise<
    Array<{ studentId: Types.ObjectId; completedAt: Date }>
  >
}

export const LearningProgressService = {
  metricDefinitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,

  async overview(scope: LearningProgressScope, filters: LearningProgressFilters = {}) {
    const roster = await loadRoster(scope, filters)
    const studentIds = roster.map((s) => s._id)
    const teacherCount = scope.teacherId
      ? 1
      : await Teacher.countDocuments({ schoolId: oid(scope.schoolId), status: 'active' })

    if (!studentIds.length) {
      return {
        scope: { schoolId: scope.schoolId, teacherId: scope.teacherId || null },
        filters: {
          grade: filters.grade ?? null,
          className: filters.className ?? null,
          from: filters.from?.toISOString() ?? null,
          to: filters.to?.toISOString() ?? null,
        },
        definitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,
        metrics: {
          enrolledStudents: 0,
          teacherCount,
          studentsWithLearningActivity: 0,
          uniqueVerifiedLevelCompletions: 0,
          studentsWhoCompletedAtLeastOneLevel: 0,
          studentsInProgress: 0,
          activeLearnersInPeriod: 0,
          timeSpentMinutes: null as number | null,
        },
        recentCompletions: [] as unknown[],
        gradeBreakdown: [] as unknown[],
      }
    }

    const dateMatch: Record<string, Date> = {}
    if (filters.from) dateMatch.$gte = filters.from
    if (filters.to) dateMatch.$lte = filters.to
    const hasDate = Object.keys(dateMatch).length > 0

    const [completions, kgCompletions, attemptStats, kgAttemptStats, inProgressRows] = await Promise.all([
      verifiedCompletions(studentIds, filters.from, filters.to),
      kgVerifiedCompletions(
        roster.filter((s) => s.grade === 0).map((s) => s._id),
        filters.from,
        filters.to,
      ),
      ActivityAttempt.aggregate([
        {
          $match: {
            studentId: { $in: studentIds },
            ...(hasDate ? { createdAt: dateMatch } : {}),
          },
        },
        {
          $group: {
            _id: null,
            students: { $addToSet: '$studentId' },
            totalTimeMs: { $sum: '$timeTakenMs' },
          },
        },
      ]).allowDiskUse(true),
      KGAlphabetAttempt.aggregate([
        {
          $match: {
            studentId: { $in: roster.filter((s) => s.grade === 0).map((s) => s._id) },
            ...(hasDate ? { createdAt: dateMatch } : {}),
          },
        },
        {
          $group: {
            _id: null,
            students: { $addToSet: '$studentId' },
            totalTimeMs: { $sum: '$timeSpentMs' },
          },
        },
      ]).allowDiskUse(true),
      Progress.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        { $unwind: '$levels' },
        { $match: { 'levels.status': 'in-progress' } },
        { $group: { _id: '$studentId' } },
      ]).allowDiskUse(true),
    ])

    const completedStudentIds = new Set(completions.map((c) => String(c.studentId)))
    for (const row of kgCompletions) completedStudentIds.add(String(row.studentId))

    // Unique verified completions: curriculum pairs + KG L1 only when that student has no curriculum completion yet counted in period.
    const curriculumPairs = new Set(completions.map((c) => `${c.studentId}:${c.levelId}`))
    let uniqueVerified = curriculumPairs.size
    for (const row of kgCompletions) {
      const sid = String(row.studentId)
      // Synthetic key for KG L1 — only add if student has zero curriculum completions in this result set.
      const hasCurriculum = [...curriculumPairs].some((key) => key.startsWith(`${sid}:`))
      if (!hasCurriculum) uniqueVerified += 1
    }

    const activityStudents = new Set<string>()
    for (const id of attemptStats[0]?.students || []) activityStudents.add(String(id))
    for (const id of kgAttemptStats[0]?.students || []) activityStudents.add(String(id))

    // In progress = Progress status in-progress, OR activity without any verified completion yet.
    const studentsInProgressSet = new Set(inProgressRows.map((row) => String(row._id)))
    for (const id of activityStudents) {
      if (!completedStudentIds.has(id)) studentsInProgressSet.add(id)
    }
    const studentsInProgress = studentsInProgressSet.size

    const totalTimeMs =
      Number(attemptStats[0]?.totalTimeMs || 0) + Number(kgAttemptStats[0]?.totalTimeMs || 0)

    const levelIds = [...new Set(completions.map((c) => String(c.levelId)))]
    const levels = levelIds.length
      ? await Level.find({ _id: { $in: levelIds.map((id) => new Types.ObjectId(id)) } })
          .select('title number classId')
          .lean()
      : []
    const levelMap = new Map(levels.map((level) => [String(level._id), level]))
    const classIds = [...new Set(levels.map((level) => String(level.classId)))]
    const classes = classIds.length
      ? await CurriculumClass.find({ _id: { $in: classIds } }).select('grade name').lean()
      : []
    const classMap = new Map(classes.map((klass) => [String(klass._id), klass]))
    const rosterMap = new Map(roster.map((s) => [String(s._id), s]))

    const recentCompletions = [
      ...completions.map((c) => {
        const student = rosterMap.get(String(c.studentId))
        const level = levelMap.get(String(c.levelId))
        const klass = level ? classMap.get(String(level.classId)) : undefined
        return {
          studentId: String(c.studentId),
          fullName: student?.fullName || 'Unknown',
          rollNumber: student?.rollNumber || '',
          grade: student?.grade ?? klass?.grade ?? null,
          className: student?.className || null,
          levelId: String(c.levelId),
          levelNumber: level?.number ?? null,
          levelTitle: level?.title || 'Level',
          completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null,
          totalTimeMs: typeof c.totalTimeMs === 'number' && c.totalTimeMs > 0 ? c.totalTimeMs : null,
          source: 'progress' as const,
        }
      }),
      ...kgCompletions.map((c) => {
        const student = rosterMap.get(String(c.studentId))
        return {
          studentId: String(c.studentId),
          fullName: student?.fullName || 'Unknown',
          rollNumber: student?.rollNumber || '',
          grade: 0,
          className: student?.className || null,
          levelId: 'kg-alphabet-l1',
          levelNumber: 1,
          levelTitle: 'KG Alphabet (A–D)',
          completedAt: c.completedAt ? new Date(c.completedAt).toISOString() : null,
          totalTimeMs: null as number | null,
          source: 'kg_alphabet' as const,
        }
      }),
    ]
      .sort((a, b) => {
        const at = a.completedAt ? Date.parse(a.completedAt) : 0
        const bt = b.completedAt ? Date.parse(b.completedAt) : 0
        return bt - at
      })
      .slice(0, 20)

    const grades = [...new Set(roster.map((s) => s.grade))].sort((a, b) => a - b)
    const gradeBreakdown = grades.map((grade) => {
      const group = roster.filter((s) => s.grade === grade)
      const groupIds = new Set(group.map((s) => String(s._id)))
      const completedInGrade = completions.filter((c) => groupIds.has(String(c.studentId)))
      const kgInGrade = grade === 0 ? kgCompletions.filter((c) => groupIds.has(String(c.studentId))) : []
      const studentsCompleted = new Set([
        ...completedInGrade.map((c) => String(c.studentId)),
        ...kgInGrade.map((c) => String(c.studentId)),
      ])
      const withActivity = [...groupIds].filter((id) => activityStudents.has(id)).length
      const uniqueCompletions =
        new Set(completedInGrade.map((c) => `${c.studentId}:${c.levelId}`)).size +
        kgInGrade.filter((c) => !completedInGrade.some((x) => String(x.studentId) === String(c.studentId))).length
      // Same definition as overview: Progress in-progress ∪ activity without verified completion.
      const inProgressInGrade = [...groupIds].filter((id) => {
        if (studentsCompleted.has(id)) return false
        return studentsInProgressSet.has(id) || activityStudents.has(id)
      }).length
      return {
        grade,
        enrolledStudents: group.length,
        studentsWithLearningActivity: withActivity,
        uniqueVerifiedLevelCompletions: uniqueCompletions,
        studentsWhoCompletedAtLeastOneLevel: studentsCompleted.size,
        studentsInProgress: inProgressInGrade,
        studentsNotStarted: Math.max(0, group.length - withActivity),
      }
    })

    return {
      scope: { schoolId: scope.schoolId, teacherId: scope.teacherId || null },
      filters: {
        grade: filters.grade ?? null,
        className: filters.className ?? null,
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
      },
      definitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,
      metrics: {
        enrolledStudents: roster.length,
        teacherCount,
        studentsWithLearningActivity: activityStudents.size,
        uniqueVerifiedLevelCompletions: uniqueVerified,
        studentsWhoCompletedAtLeastOneLevel: completedStudentIds.size,
        studentsInProgress,
        // When no date filter is set, active learners = students with any recorded activity.
        activeLearnersInPeriod: activityStudents.size,
        timeSpentMinutes:
          totalTimeMs > 0
            ? Math.round(totalTimeMs / 60000)
            : activityStudents.size === 0
              ? null
              : 0,
      },
      recentCompletions,
      gradeBreakdown,
    }
  },

  async levelsForGrade(scope: LearningProgressScope, grade: number) {
    if (!Number.isInteger(grade) || grade < 0 || grade > 10) throw ApiError.badRequest('grade must be 0–10')
    // Ensure caller is scoped (school exists via auth); roster not required to list curriculum.
    void scope
    const klass = await CurriculumClass.findOne({ grade, status: 'active' }).select('_id name grade').lean()
    if (!klass) return { grade, classId: null, levels: [] as unknown[] }
    const levels = await Level.find({ classId: klass._id, status: 'active', availability: 'PUBLISHED' })
      .select('_id number title place order')
      .sort({ order: 1, number: 1 })
      .lean()
    return {
      grade,
      classId: String(klass._id),
      levels: levels.map((level) => ({
        id: String(level._id),
        number: level.number,
        title: level.title,
        place: level.place,
        order: level.order,
      })),
    }
  },

  async levelReport(scope: LearningProgressScope, levelId: string, filters: LearningProgressFilters = {}) {
    const levelObjectId = oid(levelId)
    const level = await Level.findById(levelObjectId)
      .select('_id number title place classId status availability curriculumVersion')
      .lean()
    if (!level) throw ApiError.notFound('Level not found')
    const klass = await CurriculumClass.findById(level.classId).select('grade name').lean()
    if (!klass) throw ApiError.notFound('Curriculum class for level not found')

    const rosterFilters: LearningProgressFilters = {
      ...filters,
      grade: filters.grade !== undefined ? filters.grade : klass.grade,
    }
    // Level reports are always scoped to the level's curriculum grade unless explicitly filtered further by className/search.
    if (rosterFilters.grade !== klass.grade) {
      // Empty eligible set when asking for a mismatched grade.
      return {
        level: {
          id: String(level._id),
          number: level.number,
          title: level.title,
          place: level.place,
          curriculumVersion: level.curriculumVersion,
          grade: klass.grade,
          availability: level.availability,
        },
        filters: {
          grade: rosterFilters.grade,
          className: filters.className ?? null,
          state: filters.state ?? null,
          from: filters.from?.toISOString() ?? null,
          to: filters.to?.toISOString() ?? null,
        },
        definitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,
        summary: {
          eligibleStudents: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          completionRate: null as number | null,
        },
        students: [],
        pagination: { page: filters.page || 1, limit: filters.limit || 25, total: 0, pages: 0 },
      }
    }

    const roster = await loadRoster(scope, rosterFilters)
    const studentIds = roster.map((s) => s._id)

    const [progressRows, activityIds] = await Promise.all([
      studentIds.length
        ? Progress.aggregate([
            { $match: { studentId: { $in: studentIds } } },
            { $unwind: '$levels' },
            { $match: { 'levels.levelId': levelObjectId } },
            {
              $group: {
                _id: '$studentId',
                statuses: { $addToSet: '$levels.status' },
                completedAt: { $min: '$levels.completedAt' },
                totalTimeMs: { $max: '$levels.totalTimeMs' },
                hasLessons: { $max: { $cond: [{ $gt: [{ $size: { $ifNull: ['$levels.lessons', []] } }, 0] }, 1, 0] } },
              },
            },
          ]).allowDiskUse(true)
        : Promise.resolve([]),
      levelActivityStudentIds(studentIds, levelObjectId),
    ])

    const progressByStudent = new Map<
      string,
      { state: LearningProgressState; completedAt: string | null; totalTimeMs: number | null }
    >()

    for (const row of progressRows) {
      const statuses: string[] = row.statuses || []
      let state: LearningProgressState = 'not_started'
      if (statuses.includes('completed')) state = 'completed'
      else if (statuses.includes('in-progress') || row.hasLessons || activityIds.has(String(row._id))) {
        state = 'in_progress'
      } else if (activityIds.has(String(row._id))) {
        state = 'in_progress'
      }
      // Date filter on completed: if filtering by completion date and completed outside range, treat as not counting as completed in this view.
      let completedAt = row.completedAt ? new Date(row.completedAt).toISOString() : null
      if (state === 'completed' && (filters.from || filters.to)) {
        const ts = row.completedAt ? +new Date(row.completedAt) : null
        const inRange =
          ts !== null &&
          (!filters.from || ts >= +filters.from) &&
          (!filters.to || ts <= +filters.to)
        if (!inRange) {
          // Still completed historically, but excluded from "completed in period" — show as completed only when no date filter intent for roster state.
          // For level reports with date filters, completed means "completed within the selected period".
          state = activityIds.has(String(row._id)) || statuses.includes('in-progress') || row.hasLessons
            ? 'in_progress'
            : 'not_started'
          completedAt = null
        }
      }
      progressByStudent.set(String(row._id), {
        state,
        completedAt,
        totalTimeMs: typeof row.totalTimeMs === 'number' && row.totalTimeMs > 0 ? row.totalTimeMs : null,
      })
    }

    for (const id of activityIds) {
      if (!progressByStudent.has(id)) {
        progressByStudent.set(id, { state: 'in_progress', completedAt: null, totalTimeMs: null })
      } else {
        const existing = progressByStudent.get(id)!
        if (existing.state === 'not_started') {
          progressByStudent.set(id, { ...existing, state: 'in_progress' })
        }
      }
    }

    const classified = roster.map((student) => {
      const info = progressByStudent.get(String(student._id))
      const state: LearningProgressState = info?.state || 'not_started'
      return {
        studentId: String(student._id),
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        grade: student.grade,
        className: student.className || null,
        state,
        completedAt: info?.completedAt || null,
        totalTimeMs: info?.totalTimeMs ?? null,
      }
    })

    const completed = classified.filter((row) => row.state === 'completed')
    const inProgress = classified.filter((row) => row.state === 'in_progress')
    const notStarted = classified.filter((row) => row.state === 'not_started')

    let rows = classified
    if (filters.state) rows = classified.filter((row) => row.state === filters.state)

    const page = filters.page || 1
    const limit = filters.limit || 25
    const total = rows.length
    const start = (page - 1) * limit
    const pageRows = rows.slice(start, start + limit)

    return {
      level: {
        id: String(level._id),
        number: level.number,
        title: level.title,
        place: level.place,
        curriculumVersion: level.curriculumVersion,
        grade: klass.grade,
        availability: level.availability,
      },
      filters: {
        grade: rosterFilters.grade,
        className: filters.className ?? null,
        state: filters.state ?? null,
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
      },
      definitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,
      summary: {
        eligibleStudents: roster.length,
        completed: completed.length,
        inProgress: inProgress.length,
        notStarted: notStarted.length,
        completionRate: completionRatePercent(completed.length, roster.length),
      },
      students: pageRows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 0,
      },
    }
  },

  async studentDetail(scope: LearningProgressScope, studentId: string) {
    const id = oid(studentId)
    const student = await Student.findOne({
      _id: id,
      schoolId: oid(scope.schoolId),
      ...(scope.teacherId ? { teacherId: oid(scope.teacherId) } : {}),
    })
      .select('_id fullName rollNumber grade className status teacherId')
      .lean()
    if (!student) throw ApiError.notFound('Student not found within your school and role')

    const [progressDocs, attemptsByLevel, kgProgress] = await Promise.all([
      Progress.find({ studentId: id }).select('classId curriculumVersion levels xp lastActivityAt').lean(),
      ActivityAttempt.aggregate([
        { $match: { studentId: id } },
        {
          $group: {
            _id: '$levelId',
            attempts: { $sum: 1 },
            totalTimeMs: { $sum: '$timeTakenMs' },
            lastAttemptAt: { $max: '$createdAt' },
          },
        },
      ]).allowDiskUse(true),
      student.grade === 0
        ? KGAlphabetProgress.findOne({ studentId: id }).select('currentIndex completedAt xp').lean()
        : Promise.resolve(null),
    ])

    const levelIds = new Set<string>()
    for (const doc of progressDocs) {
      for (const level of doc.levels) levelIds.add(String(level.levelId))
    }
    for (const row of attemptsByLevel) {
      if (row._id) levelIds.add(String(row._id))
    }
    const levels = levelIds.size
      ? await Level.find({ _id: { $in: [...levelIds].map((x) => new Types.ObjectId(x)) } })
          .select('title number classId')
          .lean()
      : []
    const levelMap = new Map(levels.map((level) => [String(level._id), level]))
    const attemptMap = new Map(attemptsByLevel.map((row) => [String(row._id), row]))

    type LevelHistoryRow = {
      levelId: string
      levelNumber: number | null
      levelTitle: string
      state: LearningProgressState
      completedAt: string | null
      totalTimeMs: number | null
      attemptCount: number
      curriculumVersion: string
      source: 'progress' | 'kg_alphabet'
    }

    const levelHistory: LevelHistoryRow[] = progressDocs.flatMap((doc) =>
      doc.levels
        .filter((level) => level.status === 'completed' || level.status === 'in-progress' || (level.lessons?.length ?? 0) > 0)
        .map((level) => {
          const meta = levelMap.get(String(level.levelId))
          const attempts = attemptMap.get(String(level.levelId))
          return {
            levelId: String(level.levelId),
            levelNumber: meta?.number ?? null,
            levelTitle: meta?.title || 'Level',
            state: (level.status === 'completed'
              ? 'completed'
              : level.status === 'in-progress' || (level.lessons?.length ?? 0) > 0
                ? 'in_progress'
                : 'not_started') as LearningProgressState,
            completedAt: level.completedAt ? new Date(level.completedAt).toISOString() : null,
            totalTimeMs:
              typeof level.totalTimeMs === 'number' && level.totalTimeMs > 0
                ? level.totalTimeMs
                : attempts?.totalTimeMs
                  ? Number(attempts.totalTimeMs)
                  : null,
            attemptCount: Number(attempts?.attempts || 0),
            curriculumVersion: doc.curriculumVersion,
            source: 'progress' as const,
          }
        }),
    )

    // Include attempt-only levels not yet on Progress.
    for (const [levelId, attempts] of attemptMap) {
      if (levelHistory.some((row) => row.levelId === levelId)) continue
      const meta = levelMap.get(levelId)
      levelHistory.push({
        levelId,
        levelNumber: meta?.number ?? null,
        levelTitle: meta?.title || 'Level',
        state: 'in_progress',
        completedAt: null,
        totalTimeMs: Number(attempts.totalTimeMs) || null,
        attemptCount: Number(attempts.attempts || 0),
        curriculumVersion: progressDocs[0]?.curriculumVersion || 'legacy',
        source: 'progress',
      })
    }

    if (student.grade === 0 && kgProgress) {
      const kgComplete = Boolean(kgProgress.completedAt) && (kgProgress.currentIndex ?? 0) === 8
      levelHistory.unshift({
        levelId: 'kg-alphabet-l1',
        levelNumber: 1,
        levelTitle: 'KG Alphabet (A–D)',
        state: kgComplete ? 'completed' : (kgProgress.currentIndex ?? 0) > 0 ? 'in_progress' : 'not_started',
        completedAt: kgProgress.completedAt ? new Date(kgProgress.completedAt).toISOString() : null,
        totalTimeMs: null,
        attemptCount: 0,
        curriculumVersion: 'kg-alphabet-pilot',
        source: 'kg_alphabet' as const,
      })
    }

    const verifiedCompletionsCount = levelHistory.filter((row) => row.state === 'completed').length

    return {
      student: {
        id: String(student._id),
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        grade: student.grade,
        className: student.className || null,
        status: student.status,
      },
      definitions: LEARNING_PROGRESS_METRIC_DEFINITIONS,
      summary: {
        verifiedLevelCompletions: verifiedCompletionsCount,
        inProgressLevels: levelHistory.filter((row) => row.state === 'in_progress').length,
        totalXp: progressDocs.reduce((sum, doc) => sum + (doc.xp || 0), 0),
        lastActivityAt: progressDocs.reduce<string | null>((latest, doc) => {
          if (!doc.lastActivityAt) return latest
          const iso = new Date(doc.lastActivityAt).toISOString()
          return !latest || iso > latest ? iso : latest
        }, null),
      },
      levels: levelHistory.sort((a, b) => {
        if (a.state === 'completed' && b.state !== 'completed') return -1
        if (b.state === 'completed' && a.state !== 'completed') return 1
        return (b.completedAt || '').localeCompare(a.completedAt || '')
      }),
    }
  },

  async exportLevelCsv(scope: LearningProgressScope, levelId: string, filters: LearningProgressFilters = {}) {
    // Two calls max: probe total, then one full-page fetch capped at 5000 (avoids N page re-aggregations).
    const probe = await this.levelReport(scope, levelId, { ...filters, page: 1, limit: 1 })
    const exportLimit = Math.min(Math.max(probe.pagination.total, 1), 5000)
    const report =
      probe.pagination.total <= 1
        ? probe
        : await this.levelReport(scope, levelId, { ...filters, page: 1, limit: exportLimit })
    const students = report.students

    const header = [
      'student_id',
      'full_name',
      'roll_number',
      'grade',
      'class_name',
      'level_id',
      'level_number',
      'level_title',
      'progress_state',
      'completed_at_utc',
      'time_ms',
    ]
    const lines = [header.join(',')]
    for (const row of students) {
      lines.push(
        [
          csvEscape(row.studentId),
          csvEscape(row.fullName),
          csvEscape(row.rollNumber),
          String(row.grade),
          csvEscape(row.className || ''),
          csvEscape(report.level.id),
          String(report.level.number),
          csvEscape(report.level.title),
          csvEscape(row.state),
          csvEscape(row.completedAt || ''),
          row.totalTimeMs == null ? '' : String(row.totalTimeMs),
        ].join(','),
      )
    }
    return {
      csv: `${lines.join('\n')}\n`,
      records: students.length,
      level: report.level,
      summary: report.summary,
    }
  },
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
