/**
 * Read-only Atlas curriculum audit. This script imports no Mongoose models,
 * creates no indexes, and only issues MongoDB find/listDatabases commands.
 *
 * Run: pnpm audit:curriculum
 */
import 'dotenv/config'
import { MongoClient, type Document } from 'mongodb'
import { starters } from '../curriculum'
import { auditCurriculumDocuments } from '../services/curriculum-audit'

type CurriculumLevel = Document & {
  _id: unknown
  classId: unknown
  requiredLevelId?: unknown
  grade?: number
  number?: number
  unitNumber?: number
  title?: string
  status?: string
  availability?: string
  curriculumVersion?: string
  sourceBook?: string
  sourcePages?: number[]
}

type CurriculumLesson = Document & { _id: unknown; levelId: unknown; title?: string; status?: string }
type CurriculumActivity = Document & {
  _id: unknown
  lessonId: unknown
  grade?: number
  status?: string
  core?: boolean
  required?: boolean
  curriculumVersion?: string
  source?: { sourceType?: string; pdf?: string; pageStart?: number; pageEnd?: number }
}

function requiredUri(): { uri: string; host: string; selectedDatabase: string } {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required for the read-only Atlas audit')

  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB Atlas SRV URI')
  }
  const host = parsed.hostname.toLowerCase()
  if (parsed.protocol !== 'mongodb+srv:' || !host.endsWith('.mongodb.net') || /^(localhost|127\.0\.0\.1|::1)$/i.test(host)) {
    throw new Error('Refusing to connect: this audit only accepts MongoDB Atlas mongodb+srv URIs')
  }

  // MongoDB drivers select `test` when an SRV URI omits the database path.
  const selectedDatabase = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) || 'test'
  return { uri, host, selectedDatabase }
}

function id(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

function seedCounts(levels: CurriculumLevel[], lessons: CurriculumLesson[], activities: CurriculumActivity[]) {
  const seededLevels = levels.filter((level) => /^talkora-foundation-g\d+-v1$/.test(level.curriculumVersion || ''))
  const seededLevelIds = new Set(seededLevels.map((level) => id(level._id)))
  const seededLessons = lessons.filter((lesson) => seededLevelIds.has(id(lesson.levelId)))
  const seededLessonIds = new Set(seededLessons.map((lesson) => id(lesson._id)))
  const seededActivities = activities.filter((activity) => seededLessonIds.has(id(activity.lessonId)))
  return {
    unitCount: seededLevels.length,
    publishedUnitCount: seededLevels.filter((level) => level.status === 'active' && level.availability === 'PUBLISHED').length,
    lessonCount: seededLessons.length,
    activeLessonCount: seededLessons.filter((lesson) => lesson.status === 'active').length,
    activityCount: seededActivities.length,
    activeActivityCount: seededActivities.filter((activity) => activity.status === 'active').length,
  }
}

async function auditDatabase(client: MongoClient, databaseName: string) {
  const db = client.db(databaseName)
  const [classes, levels, lessons, activities, progressDocuments, attempts] = await Promise.all([
    db.collection('curriculumclasses').find({}, { projection: { grade: 1, name: 1, status: 1 } }).toArray(),
    db.collection<CurriculumLevel>('levels').find({}, { projection: {
      classId: 1, requiredLevelId: 1, grade: 1, number: 1, unitNumber: 1, title: 1, status: 1,
      availability: 1, curriculumVersion: 1, sourceBook: 1, sourcePages: 1,
    } }).toArray(),
    db.collection<CurriculumLesson>('lessons').find({}, { projection: { levelId: 1, title: 1, status: 1 } }).toArray(),
    db.collection<CurriculumActivity>('activities').find({}, { projection: {
      lessonId: 1, grade: 1, status: 1, core: 1, required: 1, curriculumVersion: 1, source: 1,
    } }).toArray(),
    db.collection('progress').find({}, { projection: { classId: 1, levels: 1 } }).toArray(),
    db.collection('activityattempts').find({}, { projection: { classId: 1, levelId: 1 } }).toArray(),
  ])

  const report = auditCurriculumDocuments({
    classes: classes as never,
    levels,
    lessons,
    activities,
  })

  const syllabusEvidence = report.grades.map((grade) => {
    const gradeClassIds = new Set(classes.filter((item) => item.grade === grade.grade).map((item) => id(item._id)))
    const gradeLevelIds = new Set(levels.filter((item) => gradeClassIds.has(id(item.classId))).map((item) => id(item._id)))
    const gradeLessonIds = new Set(lessons.filter((item) => gradeLevelIds.has(id(item.levelId))).map((item) => id(item._id)))
    const unitReferences = levels.filter((item) => gradeLevelIds.has(id(item._id)) && Boolean(item.sourceBook?.trim() && item.sourcePages?.length))
    const activityReferences = activities.filter((item) => gradeLessonIds.has(id(item.lessonId))
      && item.source?.sourceType === 'SYLLABUS'
      && Boolean(item.source.pdf?.trim() || item.source.pageStart !== undefined || item.source.pageEnd !== undefined))
    return {
      grade: grade.grade,
      unitReferences: unitReferences.map((item) => ({ unit: item.title, sourceBook: item.sourceBook, sourcePages: item.sourcePages })),
      activitySourceReferenceCount: activityReferences.length,
    }
  })

  const seedDryRunReview = report.grades.map((grade) => {
    const gradeClasses = classes.filter((item) => item.grade === grade.grade)
    const classIds = new Set(gradeClasses.map((item) => id(item._id)))
    const gradeLevels = levels.filter((item) => classIds.has(id(item.classId)))
    const gradeProgress = progressDocuments.filter((item) => classIds.has(id(item.classId)))
    const gradeAttempts = attempts.filter((item) => classIds.has(id(item.classId)))
    const sourceUnitCount = starters[grade.grade]?.length || 0
    const unitPositions = Array.from({ length: sourceUnitCount }, (_, index) => index + 1)
    const levelNumberCollisions = unitPositions.filter((number) => gradeLevels.some((level) => level.number === number))
    const fallbackLevelNumberCollisions = levelNumberCollisions
      .map((number) => 100 + number)
      .filter((number) => gradeLevels.some((level) => level.number === number))
    const unitNumberCollisions = unitPositions.filter((unitNumber) => gradeLevels.some((level) => level.unitNumber === unitNumber))
    const foundationLevels = gradeLevels.filter((level) => level.curriculumVersion === `talkora-foundation-g${grade.grade}-v1`)
    const foundationLevelIds = new Set(foundationLevels.map((level) => id(level._id)))
    return {
      grade: grade.grade,
      sourceStarterUnitCount: sourceUnitCount,
      existingFoundationUnitCount: foundationLevels.length,
      existingLevelNumberCollisions: levelNumberCollisions,
      fallbackLevelNumberCollisions,
      existingUnitNumberCollisions: unitNumberCollisions,
      progressDocumentCount: gradeProgress.length,
      activityAttemptCount: gradeAttempts.length,
      existingFoundationUnitsWithProgress: gradeProgress.flatMap((progress) =>
        (progress.levels || []).filter((item: { levelId?: unknown }) => foundationLevelIds.has(id(item.levelId)))
          .map((item: { levelId?: unknown }) => id(item.levelId))),
      existingFoundationUnitsWithAttempts: [...new Set(gradeAttempts
        .filter((attempt) => foundationLevelIds.has(id(attempt.levelId)))
        .map((attempt) => id(attempt.levelId)))],
    }
  })

  return {
    database: databaseName,
    collectionCounts: {
      curriculumClasses: classes.length,
      levels: levels.length,
      lessons: lessons.length,
      activities: activities.length,
    },
    foundationSeed: seedCounts(levels, lessons, activities),
    seedDryRunReview,
    grades: report.grades,
    orphanReferences: report.orphanReferences,
    syllabusSourceReferences: syllabusEvidence,
  }
}

async function main() {
  const { uri, host, selectedDatabase } = requiredUri()
  const expectedDatabase = process.env.MONGODB_DATABASE?.trim() || 'talkora'
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 })
  try {
    await client.connect()
    let availableTalkoraDatabases: string[] | null = null
    let databaseListingNote: string | null = null
    try {
      const listing = await client.db('admin').command({ listDatabases: 1, nameOnly: true, authorizedDatabases: true }) as {
        databases?: Array<{ name: string }>
      }
      availableTalkoraDatabases = (listing.databases || [])
        .map((database) => database.name)
        .filter((name) => /^talkora(?:[-_].*)?$/i.test(name))
        .sort()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'database listing failed'
      databaseListingNote = message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb+srv://[redacted]@').slice(0, 240)
    }

    const databaseNames = [...new Set([selectedDatabase, expectedDatabase, ...(availableTalkoraDatabases || [])])]
    const audits = []
    for (const databaseName of databaseNames) {
      try {
        audits.push(await auditDatabase(client, databaseName))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'curriculum reads failed'
        audits.push({
          database: databaseName,
          error: message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb+srv://[redacted]@').slice(0, 240),
        })
      }
    }

    console.log(JSON.stringify({
      mode: 'READ_ONLY',
      atlasHost: host,
      sourceCurriculum: Array.from({ length: 11 }, (_, grade) => {
        const unitCount = starters[grade]?.length || 0
        return { grade, starterUnitCount: unitCount, generatedLessonCount: unitCount, generatedActivityCount: unitCount * 5,
          contentType: unitCount ? 'unapproved enrichment starter' : grade === 4 ? 'authored syllabus kept outside starter catalog' : 'no starter source module' }
      }),
      databaseSelectedByBackendUri: selectedDatabase,
      expectedDatabase: expectedDatabase,
      matchesExpectedDatabase: selectedDatabase === expectedDatabase,
      availableTalkoraDatabases,
      databaseListingNote,
      audits,
    }, null, 2))
  } finally {
    await client.close()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown audit error'
  console.error(`Read-only curriculum audit failed: ${message.replace(/mongodb(?:\+srv)?:\/\/[^@\s]+@/gi, 'mongodb+srv://[redacted]@')}`)
  process.exitCode = 1
})
