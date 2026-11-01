/**
 * Sprint 3.1: real MongoDB checkpoint reliability tests.
 *
 * Uses a fresh, throwaway database in the CI mongo:7 container.
 * The optional local mongodb-memory-server fallback also runs REAL MongoDB.
 * Curriculum/auth are deliberately stubbed because the qualified teacher's
 * signed curriculum approval route does not exist yet. No student API is used.
 */
import mongoose, { Types } from 'mongoose'
import { randomUUID } from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { TeachingCheckpoint } from '../../src/models/TeachingCheckpoint'
import { TeachingCheckpointService } from '../../src/services/teaching-checkpoint.service'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'
import { Student } from '../../src/models/Student'

const STUDENT_A = new Types.ObjectId().toString()
const STUDENT_B = new Types.ObjectId().toString()
const ACTIVITY = new Types.ObjectId().toString()
const LESSON = new Types.ObjectId().toString()
const scopeA = {
  namespace: 'talkora.mh.english.g01',
  bookId: 'ENGLISH_BALBHARATI_G01',
  trackId: 'ENGLISH_MEDIUM',
  edition: '2025-26',
  lessonId: LESSON,
  activityId: ACTIVITY,
  objectiveId: 'bal-g01-u1-c1.01-o01',
  version: 'v1',
  approvedRevision: 'approved-fixture-only-v1',
} as const
const scopeB = {
  ...scopeA,
  bookId: 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM',
  trackId: 'NON_ENGLISH_MEDIUM',
  objectiveId: 'meb-g01-u1-c1.01-o01',
} as const

function turn(overrides: Record<string, unknown> = {}) {
  return {
    studentId: STUDENT_A,
    scope: scopeA,
    requestId: randomUUID(),
    expectedRevision: 0,
    observation: 'LEXICAL_MISMATCH' as const,
    strategy: 'RETEACH' as const,
    answerSupport: 'SUPPORTED' as const,
    hintLevel: 1,
    retryPending: true,
    ...overrides,
  }
}

let memory: MongoMemoryServer | null = null
let uri: string
const dbName = 'talkora_sprint31_' + process.pid + '_' + randomUUID().replace(/-/g, '')

beforeAll(async () => {
  const external = process.env.TALKORA_CHECKPOINT_TEST_MONGO_URI
  if (external) {
    // CI must never be able to turn this destructive integration test into
    // a production DB test by pointing the env var at a remote Mongo service.
    if (external !== 'mongodb://127.0.0.1:27017') {
      throw new Error('Checkpoint tests refuse any non-local MongoDB endpoint')
    }
    uri = external
  } else {
    memory = await MongoMemoryServer.create({
      binary: { version: process.env.MONGOMS_VERSION || '7.0.14' },
    })
    uri = memory.getUri()
  }
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 })
  // Real unique indexes are required for the upsert and CAS guarantees.
  await TeachingCheckpoint.createIndexes()
}, 90000)

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    // Only this process's randomized test database can ever be dropped.
    if (mongoose.connection.name !== dbName) throw new Error('Refusing to drop an unexpected Mongo database')
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
  if (memory) await memory.stop()
}, 90000)

beforeEach(async () => {
  process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT = 'true'
  process.env.NODE_ENV = 'test'
  delete process.env.TALKORA_ENV
  await TeachingCheckpoint.deleteMany({})
  // Exercise genuine Mongo reads and writes, not a mocked checkpoint model.
  // Only the pending school/teacher/lesson authorization source is stubbed.
  jest.spyOn(CurriculumAccessService, 'assertActivity').mockImplementation(async () => ({
    activity: { status: 'active' },
    lesson: { _id: new Types.ObjectId(LESSON), status: 'active' },
    level: { number: 1, status: 'active', availability: 'PUBLISHED' },
    isKGPilot: false,
    isClass1Demo: false,
  } as any))
  jest.spyOn(Student, 'findById').mockImplementation((() => ({
    select: () => ({ lean: async () => ({ grade: 1, status: 'active' }) }),
  })) as any)
})

afterEach(() => {
  delete process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT
  jest.restoreAllMocks()
})

describe('Sprint 3.1 real MongoDB advisory checkpoint reliability', () => {
  it('persists a turn across disconnect/reconnect, then resumes without new progress records', async () => {
    await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    const input = turn()
    const result = await TeachingCheckpointService.commitTurn(input)
    expect(result).toMatchObject({
      revision: 1, replayed: false, xpAwarded: 0, evidenceAccepted: false,
    })
    await mongoose.disconnect()
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 })
    const resumed = await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    expect(resumed).toMatchObject({
      revision: 1, hintLevel: 1, retryPending: true, latestStrategy: 'RETEACH',
    })
    const replay = await TeachingCheckpointService.commitTurn(input)
    expect(replay).toMatchObject({ revision: 1, replayed: true, xpAwarded: 0 })
    expect(await TeachingCheckpoint.countDocuments()).toBe(1)
    const saved = await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean()
    expect(saved?.turnReceipts).toHaveLength(1)
    expect(saved).not.toHaveProperty('transcript')
    expect(saved).not.toHaveProperty('studentPin')
    expect(saved).not.toHaveProperty('xp')
    expect(await mongoose.connection.db!.collection('activityattempts').countDocuments({})).toBe(0)
    expect(await mongoose.connection.db!.collection('progresses').countDocuments({})).toBe(0)
  }, 30000)

  it('serializes concurrent distinct request IDs at the same revision via Mongo CAS', async () => {
    await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    const requests = Array.from({ length: 16 }, () => TeachingCheckpointService.commitTurn(turn()))
    const results = await Promise.allSettled(requests)
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(rejected).toHaveLength(15)
    expect(rejected.every(r => r.reason?.statusCode === 409)).toBe(true)
    const record = await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean()
    expect(record?.revision).toBe(1)
    expect(record?.turnReceipts).toHaveLength(1)
  }, 30000)

  it('handles simultaneous duplicate request IDs with exactly one write and safe replays', async () => {
    await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    const input = turn()
    const results = await Promise.all(
      Array.from({ length: 12 }, () => TeachingCheckpointService.commitTurn(input)),
    )
    expect(results.filter(r => r.replayed === false)).toHaveLength(1)
    expect(results.filter(r => r.replayed === true)).toHaveLength(11)
    expect(results.every(r => r.revision === 1 && r.xpAwarded === 0)).toBe(true)
    const record = await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean()
    expect(record?.turnReceipts).toHaveLength(1)
  }, 30000)

  it('refuses changed content with a reused idempotency ID and a stale revision', async () => {
    await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    const input = turn()
    await TeachingCheckpointService.commitTurn(input)
    await expect(TeachingCheckpointService.commitTurn({ ...input, strategy: 'ASK' }))
      .rejects.toMatchObject({ statusCode: 409 })
    await expect(TeachingCheckpointService.commitTurn(turn()))
      .rejects.toMatchObject({ statusCode: 409 })
    expect((await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean())?.revision).toBe(1)
  })

  it('isolates students and textbook/edition revisions on the same canonical activity', async () => {
    await Promise.all([
      TeachingCheckpointService.begin(STUDENT_A, scopeA),
      TeachingCheckpointService.begin(STUDENT_B, scopeA),
      TeachingCheckpointService.begin(STUDENT_A, scopeB),
      TeachingCheckpointService.begin(STUDENT_A, { ...scopeA, approvedRevision: 'approved-fixture-only-v2' }),
    ])
    const studentA = await TeachingCheckpointService.commitTurn(turn())
    const studentB = await TeachingCheckpointService.commitTurn(turn({
      studentId: STUDENT_B, requestId: randomUUID(),
    }))
    const otherBook = await TeachingCheckpointService.commitTurn(turn({
      scope: scopeB, requestId: randomUUID(),
    }))
    expect([studentA.revision, studentB.revision, otherBook.revision]).toEqual([1, 1, 1])
    expect(await TeachingCheckpoint.countDocuments()).toBe(4)
    const secondRevision = await TeachingCheckpointService.begin(STUDENT_A, {
      ...scopeA, approvedRevision: 'approved-fixture-only-v2',
    })
    expect(secondRevision.revision).toBe(0)
    expect((await TeachingCheckpoint.find({ studentId: STUDENT_A }).lean()).length).toBe(3)
  })

  it('refuses production use and unapproved draft activity before any database write', async () => {
    const update = jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate')
    process.env.NODE_ENV = 'production'
    await expect(TeachingCheckpointService.begin(STUDENT_A, scopeA)).rejects.toMatchObject({ statusCode: 403 })
    expect(update).not.toHaveBeenCalled()
    process.env.NODE_ENV = 'test'
    jest.spyOn(CurriculumAccessService, 'assertActivity').mockResolvedValue({
      activity: { status: 'draft' },
      lesson: { _id: new Types.ObjectId(LESSON), status: 'draft' },
      level: { number: 1, status: 'draft', availability: 'UPCOMING' },
      isClass1Demo: true,
      isKGPilot: false,
    } as any)
    await expect(TeachingCheckpointService.begin(STUDENT_A, scopeA)).rejects.toMatchObject({ statusCode: 403 })
    expect(update).not.toHaveBeenCalled()
    expect(await TeachingCheckpoint.countDocuments()).toBe(0)
  })

  it('maintains a bounded 64-turn receipt history and rejects turn 65', async () => {
    await TeachingCheckpointService.begin(STUDENT_A, scopeA)
    for (let revision = 0; revision < 64; revision++) {
      const output = await TeachingCheckpointService.commitTurn(turn({
        expectedRevision: revision, requestId: randomUUID(),
      }))
      expect(output.revision).toBe(revision + 1)
    }
    const record = await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean()
    expect(record?.revision).toBe(64)
    expect(record?.turnReceipts).toHaveLength(64)
    await expect(TeachingCheckpointService.commitTurn(turn({
      expectedRevision: 63, requestId: randomUUID(),
    }))).rejects.toMatchObject({ statusCode: 409 })
    expect((await TeachingCheckpoint.findOne({ studentId: STUDENT_A }).lean())?.revision).toBe(64)
  }, 40000)
})
