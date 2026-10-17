import dotenv from 'dotenv'
import { MongoClient, ObjectId, type ClientSession } from 'mongodb'
import { lessons as kgUnits } from '../curriculum/kg/lessons'
import {
  KG_CURRICULUM_VERSION,
  fingerprintKGCurriculumSnapshot,
  planKGCurriculumImport,
  verifyExplicitMongoDatabase,
  type KGCurriculumSnapshot,
} from '../curriculum/kg/publisher'

dotenv.config()

function parseArgs(args: string[]): { mode: 'dry-run' | 'apply'; database: string; expectedSnapshotHash?: string } {
  const databaseIndex = args.indexOf('--database')
  const database = databaseIndex >= 0 ? args[databaseIndex + 1] : ''
  const hashIndex = args.indexOf('--expected-snapshot-hash')
  const expectedSnapshotHash = hashIndex >= 0 ? args[hashIndex + 1] : undefined
  const dryRun = args.includes('--dry-run')
  const apply = args.includes('--apply')
  if (dryRun === apply) throw new Error('Choose exactly one mode: --dry-run or --apply.')
  if (!database || database.startsWith('--')) throw new Error('Pass an explicit target with --database <name>.')
  if (args.filter((arg) => arg === '--database').length !== 1) throw new Error('Pass --database exactly once.')
  if (apply && (!expectedSnapshotHash || !/^[a-f0-9]{64}$/.test(expectedSnapshotHash))) {
    throw new Error('Apply requires the 64-character --expected-snapshot-hash printed by the dry-run.')
  }
  if (dryRun && expectedSnapshotHash) throw new Error('--expected-snapshot-hash is only valid with --apply.')
  if (hashIndex >= 0 && (args[hashIndex + 1] ?? '').startsWith('--')) throw new Error('Pass a hash after --expected-snapshot-hash.')
  const unexpected = args.filter((arg) => arg.startsWith('--') && !['--dry-run', '--apply', '--database', '--expected-snapshot-hash'].includes(arg))
  if (unexpected.length) throw new Error(`Unknown option: ${unexpected[0]}`)
  return { mode: dryRun ? 'dry-run' : 'apply', database, expectedSnapshotHash }
}

function uniqueObjectIds(records: Array<{ _id: ObjectId }>): ObjectId[] {
  return Array.from(new Map(records.map((record) => [record._id.toHexString(), record._id])).values())
}

async function readSnapshot(db: ReturnType<MongoClient['db']>, session?: ClientSession): Promise<KGCurriculumSnapshot> {
  const collection = (name: string) => db.collection<Record<string, unknown> & { _id: ObjectId }>(name)
  const find = (name: string, filter: Record<string, unknown>) => collection(name).find(filter, session ? { session } : {}).toArray()
  const classes = await find('curriculumclasses', { grade: 0 })
  const classIds = uniqueObjectIds(classes)
  const versionedLevels = await find('levels', { curriculumVersion: KG_CURRICULUM_VERSION })
  const classLevels = classIds.length
    ? await find('levels', { classId: { $in: classIds } })
    : []
  const levels = Array.from(new Map([...versionedLevels, ...classLevels].map((record) => [record._id.toHexString(), record])).values())
  const levelIds = uniqueObjectIds(levels)
  const lessonKeys = kgUnits.flatMap((unit) => unit.lessons.map((lesson) => lesson.lessonKey))
  const keyedLessons = await find('lessons', { 'settings.lessonKey': { $in: lessonKeys } })
  const levelLessons = levelIds.length
    ? await find('lessons', { levelId: { $in: levelIds } })
    : []
  const lessons = Array.from(new Map([...keyedLessons, ...levelLessons].map((record) => [record._id.toHexString(), record])).values())
  const lessonIds = uniqueObjectIds(lessons)
  const activityKeys = kgUnits.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.activities.map((activity) => activity.activityKey)))
  const keyedActivities = await find('activities', { activityKey: { $in: activityKeys } })
  const versionedActivities = await find('activities', { curriculumVersion: KG_CURRICULUM_VERSION })
  const lessonActivities = lessonIds.length
    ? await find('activities', { lessonId: { $in: lessonIds } })
    : []
  const activities = Array.from(new Map([...keyedActivities, ...versionedActivities, ...lessonActivities]
    .map((record) => [record._id.toHexString(), record])).values())
  return { classes, levels, lessons, activities }
}

function printPlan(plan: ReturnType<typeof planKGCurriculumImport>, database: string, mode: 'dry-run' | 'apply', snapshotHash: string) {
  console.log(`KG curriculum ${mode}; target database: ${database}`)
  console.log(`Source: Grade 0 pilot ${KG_CURRICULUM_VERSION}`)
  console.log(`KG read-scope snapshot fingerprint: ${snapshotHash}`)
  console.log(`Units: ${plan.counts.units}; lessons: ${plan.counts.lessons}; activities: ${plan.counts.activities}`)
  console.log(`Planned inserts: ${plan.counts.inserts}; updates: ${plan.counts.updates}; already current: ${plan.counts.unchanged}; conflicts: ${plan.errors.length}`)
  console.log(`Missing picture assets: ${plan.counts.missingPictureAssets}; prerecorded audio items not created: ${plan.counts.missingPrerecordedAudioItems}; intro videos not created: ${plan.counts.introVideosNotCreated}`)
  console.log('Student, progress, activity-attempt, Class 4, and database settings writes: 0')
  for (const collection of ['curriculumclasses', 'levels', 'lessons', 'activities'] as const) {
    const count = plan.writes.filter((write) => write.collection === collection).length
    if (count) console.log(`Planned inserts in ${collection}: ${count}`)
  }
  for (const error of plan.errors) console.error(`BLOCKED: ${error}`)
  if (!plan.valid) console.error('Plan is invalid. No writes were applied.')
}

function requireExactEmptyTargetPlan(plan: ReturnType<typeof planKGCurriculumImport>) {
  if (!plan.valid || plan.errors.length !== 0) throw new Error(`Refusing to apply: validation/conflict count is ${plan.errors.length}.`)
  if (plan.counts.units !== 8 || plan.counts.lessons !== 24 || plan.counts.activities !== 168 ||
    plan.counts.inserts !== 201 || plan.counts.updates !== 0 || plan.counts.unchanged !== 0) {
    throw new Error(`Refusing to apply: expected 201 inserts, 0 updates, 0 no-ops; received ${plan.counts.inserts} inserts, ${plan.counts.updates} updates, ${plan.counts.unchanged} no-ops.`)
  }
  const allowed = new Set(['curriculumclasses', 'levels', 'lessons', 'activities'])
  if (plan.protectedCollectionsWritten.length !== 0 || plan.writes.some((write) => !allowed.has(write.collection))) {
    throw new Error('Refusing to apply: plan attempts to write outside the KG curriculum collection allowlist.')
  }
}

function requireFullyImportedPlan(plan: ReturnType<typeof planKGCurriculumImport>) {
  if (!plan.valid || plan.errors.length !== 0 || plan.counts.units !== 8 || plan.counts.lessons !== 24 ||
    plan.counts.activities !== 168 || plan.counts.inserts !== 0 || plan.counts.updates !== 0 || plan.counts.unchanged !== 201) {
    throw new Error('Post-insert validation failed: expected all 201 KG records to be current, draft, and reference-valid.')
  }
}

async function applyInTransaction(
  client: MongoClient,
  db: ReturnType<MongoClient['db']>,
  expectedSnapshotHash: string,
) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      const currentSnapshot = await readSnapshot(db, session)
      if (fingerprintKGCurriculumSnapshot(currentSnapshot) !== expectedSnapshotHash) {
        throw new Error('KG curriculum read-scope data changed after dry-run; transaction aborted.')
      }
      const currentPlan = planKGCurriculumImport(currentSnapshot)
      requireExactEmptyTargetPlan(currentPlan)
      const now = new Date()
      for (const write of currentPlan.writes) {
        const document = { ...write.document, createdAt: now, updatedAt: now }
        await db.collection(write.collection).insertOne(document, { session })
      }
      const insertedSnapshot = await readSnapshot(db, session)
      requireFullyImportedPlan(planKGCurriculumImport(insertedSnapshot))
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } })
  } finally {
    await session.endSession()
  }
}

async function main() {
  const { mode, database, expectedSnapshotHash } = parseArgs(process.argv.slice(2))
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required. The publisher will not use an implicit database.')
  verifyExplicitMongoDatabase(uri, database)

  // The native driver does not invoke Mongoose model initialization or create indexes.
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(database)
    const snapshot = await readSnapshot(db)
    const snapshotHash = fingerprintKGCurriculumSnapshot(snapshot)
    const plan = planKGCurriculumImport(snapshot)
    printPlan(plan, database, mode, snapshotHash)
    if (mode === 'dry-run') {
      if (!plan.valid) process.exitCode = 2
    } else {
      if (snapshotHash !== expectedSnapshotHash) throw new Error('KG curriculum read-scope data changed since the approved dry-run; nothing was inserted.')
      requireExactEmptyTargetPlan(plan)
      await applyInTransaction(client, db, expectedSnapshotHash!)
      const verifiedSnapshot = await readSnapshot(db)
      requireFullyImportedPlan(planKGCurriculumImport(verifiedSnapshot))
      console.log('Post-apply verification passed: 1 class, 8 draft units, 24 draft lessons, 168 draft activities; all references valid.')
      console.log('Protected collections and existing Class 4 records were not written.')
    }
  } finally {
    await client.close()
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
