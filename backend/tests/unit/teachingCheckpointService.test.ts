import { Types } from 'mongoose'
import { TeachingCheckpoint } from '../../src/models/TeachingCheckpoint'
import { TeachingCheckpointService } from '../../src/services/teaching-checkpoint.service'
import { Student } from '../../src/models/Student'
import { CurriculumAccessService } from '../../src/services/curriculum-access.service'

const studentId = '650000000000000000000001'
const activityId = '650000000000000000000002'
const lessonId = '650000000000000000000003'
const requestId = '00000000-0000-4000-8000-000000000001'
const scope = {
  namespace: 'talkora.mh.english.g01',
  bookId: 'ENGLISH_BALBHARATI_G01',
  trackId: 'ENGLISH_MEDIUM',
  edition: '2025-26',
  lessonId,
  activityId,
  objectiveId: 'bal-g01-u1-c1.01-o01',
  version: 'v1',
  approvedRevision: 'approved-fixture-v1',
} as const

const turn = {
  studentId, scope, requestId, expectedRevision: 0,
  observation: 'LEXICAL_MISMATCH',
  strategy: 'CORRECT',
  answerSupport: 'SUPPORTED',
  hintLevel: 1,
  retryPending: true,
} as const

const previous = process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT
const originalNodeEnv = process.env.NODE_ENV
const previousTalkoraEnv = process.env.TALKORA_ENV

function mockAccess(draft = false) {
  jest.spyOn(CurriculumAccessService, 'assertActivity').mockResolvedValue({
    activity: { status: draft ? 'draft' : 'active' },
    lesson: { _id: new Types.ObjectId(lessonId), status: draft ? 'draft' : 'active' },
    level: { number: 1, status: draft ? 'draft' : 'active', availability: draft ? 'UPCOMING' : 'PUBLISHED' },
    isClass1Demo: draft, isKGPilot: false,
  } as any)
  jest.spyOn(Student, 'findById').mockReturnValue({
    select: () => ({ lean: async () => ({ grade: 1, status: 'active' }) }),
  } as any)
}

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  delete process.env.TALKORA_ENV
  process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT = 'true'
  mockAccess()
})

afterEach(() => {
  if (previous === undefined) delete process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT
  else process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT = previous
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv
  if (previousTalkoraEnv === undefined) delete process.env.TALKORA_ENV
  else process.env.TALKORA_ENV = previousTalkoraEnv
  jest.restoreAllMocks()
})

describe('isolated Class 1 teaching checkpoint (no live student API)', () => {
  it('fails closed without feature opt-in or in production before touching Mongo', async () => {
    const update = jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate')
    delete process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT
    await expect(TeachingCheckpointService.begin(studentId, scope)).rejects.toMatchObject({ statusCode: 403 })
    expect(update).not.toHaveBeenCalled()
    process.env.TALKORA_TEACHING_CHECKPOINT_EXPERIMENT = 'true'
    process.env.NODE_ENV = 'production'
    await expect(TeachingCheckpointService.commitTurn(turn)).rejects.toMatchObject({ statusCode: 403 })
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses a real-looking draft lesson even with a claimed approval revision', async () => {
    jest.restoreAllMocks()
    mockAccess(true)
    const update = jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate')
    await expect(TeachingCheckpointService.begin(studentId, scope)).rejects.toMatchObject({ statusCode: 403 })
    expect(update).not.toHaveBeenCalled()
  })

  it('refuses to cross tracks, fake school book IDs or smuggle student speech', async () => {
    const db = jest.spyOn(TeachingCheckpoint, 'findOne')
    await expect(TeachingCheckpointService.commitTurn({
      ...turn, scope: { ...scope, bookId: 'MY_ENGLISH_BOOK_G01_NON_ENGLISH_MEDIUM' },
    } as any)).rejects.toMatchObject({ statusCode: 400 })
    await expect(TeachingCheckpointService.commitTurn({
      ...turn, transcript: 'student says their home address',
    } as any)).rejects.toMatchObject({ statusCode: 400 })
    await expect(TeachingCheckpointService.commitTurn({
      ...turn, xpAwarded: 999,
    } as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(db).not.toHaveBeenCalled()
  })

  it('begins a version-scoped checkpoint without updating existing student progress', async () => {
    const db = jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate').mockResolvedValue({
      revision: 3, hintLevel: 2, retryPending: true, lastStrategy: 'RETEACH',
    } as any)
    const result = await TeachingCheckpointService.begin(studentId, scope)
    expect(result).toEqual({
      revision: 3, hintLevel: 2, retryPending: true, latestStrategy: 'RETEACH',
    })
    const [query, change, options] = db.mock.calls[0]
    expect(query.studentId.toString()).toBe(studentId)
    expect(query.activityId.toString()).toBe(activityId)
    expect(query.scopeHash).toMatch(/^[0-9a-f]{64}$/)
    expect(change).toHaveProperty('$setOnInsert')
    expect(change).not.toHaveProperty('$set')
    expect(options).toMatchObject({ upsert: true, runValidators: true })
  })

  it('atomically records a turn, then replays the exact same request without duplicate write', async () => {
    const document: any = {
      _id: new Types.ObjectId(), revision: 0, hintLevel: 0,
      retryPending: false, turnReceipts: [],
    }
    jest.spyOn(TeachingCheckpoint, 'findOne').mockImplementation(async () => document as any)
    const update = jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate').mockImplementation(async (query: any, change: any) => {
      expect(query.revision).toBe(document.revision)
      expect(query['turnReceipts.requestId']).toEqual({ $ne: requestId })
      expect(change).not.toHaveProperty('$set.xpAwarded')
      document.revision += 1
      document.hintLevel = change.$set.hintLevel
      document.retryPending = change.$set.retryPending
      document.turnReceipts.push(change.$push.turnReceipts)
      return document
    })
    const first = await TeachingCheckpointService.commitTurn(turn)
    expect(first).toMatchObject({ revision: 1, replayed: false, evidenceAccepted: false, xpAwarded: 0 })
    const second = await TeachingCheckpointService.commitTurn(turn)
    expect(second).toMatchObject({ revision: 1, replayed: true, evidenceAccepted: false, xpAwarded: 0 })
    expect(update).toHaveBeenCalledTimes(1)
    expect(document.turnReceipts).toHaveLength(1)
    expect(document.turnReceipts[0]).not.toHaveProperty('transcript')
    expect(document.turnReceipts[0]).not.toHaveProperty('studentName')
  })

  it('rejects the same request ID with different signals and old revisions', async () => {
    const id = new Types.ObjectId()
    const document: any = {
      _id: id, revision: 2, turnReceipts: [
        { requestId, payloadHash: 'f'.repeat(64), revision: 1 },
      ],
    }
    jest.spyOn(TeachingCheckpoint, 'findOne').mockResolvedValue(document as any)
    await expect(TeachingCheckpointService.commitTurn(turn)).rejects.toMatchObject({ statusCode: 409 })
    document.turnReceipts = []
    await expect(TeachingCheckpointService.commitTurn(turn)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('refuses a conflicting concurrent turn after CAS loses; never silently awards progress', async () => {
    const document: any = {
      _id: new Types.ObjectId(), revision: 0, turnReceipts: [],
    }
    jest.spyOn(TeachingCheckpoint, 'findOne').mockResolvedValue(document as any)
    jest.spyOn(TeachingCheckpoint, 'findOneAndUpdate').mockResolvedValue(null)
    await expect(TeachingCheckpointService.commitTurn(turn)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('refuses to exceed a bounded 64-turn checkpoint', async () => {
    const document: any = {
      _id: new Types.ObjectId(), revision: 64, turnReceipts: [],
    }
    jest.spyOn(TeachingCheckpoint, 'findOne').mockResolvedValue(document as any)
    await expect(TeachingCheckpointService.commitTurn({ ...turn, expectedRevision: 63 }))
      .rejects.toMatchObject({ statusCode: 409 })
  })
})
