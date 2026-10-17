import { ObjectId } from 'mongodb'
import { lessons } from '../../src/curriculum/kg/lessons'
import {
  createEmptyKGSnapshot,
  fingerprintKGCurriculumSnapshot,
  planKGCurriculumImport,
  runKGDryRun,
  verifyExplicitMongoDatabase,
} from '../../src/curriculum/kg/publisher'

describe('KG-only curriculum publisher', () => {
  it('maps all 8 units, 24 lessons, and 168 activities as unpublished inserts', () => {
    const plan = planKGCurriculumImport(createEmptyKGSnapshot())

    expect(plan.valid).toBe(true)
    expect(plan.counts).toMatchObject({ units: 8, lessons: 24, activities: 168, inserts: 201, updates: 0, unchanged: 0 })
    expect(plan.writes).toHaveLength(201)
    expect(new Set(plan.writes.map((write) => write.collection))).toEqual(new Set([
      'curriculumclasses', 'levels', 'lessons', 'activities',
    ]))
    expect(plan.protectedCollectionsWritten).toEqual([])

    const levelWrites = plan.writes.filter((write) => write.collection === 'levels')
    const lessonWrites = plan.writes.filter((write) => write.collection === 'lessons')
    const activityWrites = plan.writes.filter((write) => write.collection === 'activities')
    expect(levelWrites).toHaveLength(8)
    expect(levelWrites.every(({ document }) => document.grade === undefined && document.status === 'draft' && document.availability === 'UPCOMING')).toBe(true)
    expect(lessonWrites).toHaveLength(24)
    expect(lessonWrites.every(({ document }) => document.status === 'draft')).toBe(true)
    expect(activityWrites).toHaveLength(168)
    expect(activityWrites.every(({ document }) => document.status === 'draft' && document.grade === 0)).toBe(true)
    const classId = plan.writes.find((write) => write.collection === 'curriculumclasses')!.document._id
    const levelIds = new Set(levelWrites.map((write) => String(write.document._id)))
    const lessonIds = new Set(lessonWrites.map((write) => String(write.document._id)))
    expect(levelWrites.every((write) => String(write.document.classId) === String(classId))).toBe(true)
    expect(lessonWrites.every((write) => levelIds.has(String(write.document.levelId)))).toBe(true)
    expect(activityWrites.every((write) => lessonIds.has(String(write.document.lessonId)))).toBe(true)
    const referencedPictureKeys = new Set(lessons.flatMap((unit) => [
      ...unit.visualAssets.map((asset) => asset.assetKey),
      ...unit.lessons.flatMap((lesson) => lesson.activities.flatMap((activity) => {
        const pictureAsset = activity.content?.pictureAsset as { assetKey?: string } | undefined
        const options = activity.content?.pictureOptions as Array<{ assetKey?: string }> | undefined
        return [
          ...(pictureAsset?.assetKey ? [pictureAsset.assetKey] : []),
          ...(Array.isArray(options) ? options.flatMap((option) => option.assetKey ? [option.assetKey] : []) : []),
        ]
      })),
    ]))
    expect(plan.counts.missingPictureAssets).toBe(referencedPictureKeys.size)
    expect(plan.counts.missingPrerecordedAudioItems).toBe(lessons.reduce((count, unit) => count + unit.vocabulary.length, 0))
    expect(plan.counts.introVideosNotCreated).toBe(8)
  })

  it('preserves the shared lesson engine activity contract, including picture choices and answer fields', () => {
    const plan = planKGCurriculumImport(createEmptyKGSnapshot())
    const activityWrites = plan.writes.filter((write) => write.collection === 'activities')
    const sources = lessons.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.activities))
    expect(activityWrites.map((write) => write.stableKey)).toEqual(sources.map((activity) => activity.activityKey))

    for (const source of sources) {
      const mapped = activityWrites.find((write) => write.stableKey === source.activityKey)!.document
      expect(mapped).toMatchObject({
        curriculumVersion: source.curriculumVersion,
        activityKey: source.activityKey,
        grade: 0,
        term: source.term,
        unitNumber: source.unitNumber,
        type: source.type,
        stage: source.stage,
        core: source.core,
        required: source.required,
        order: source.order,
        expectedPatterns: source.expectedPatterns,
        keywords: source.keywords,
        difficulty: source.difficulty,
        xp: source.xp,
        estimatedSeconds: source.estimatedSeconds,
        voiceEnabled: source.voiceEnabled,
        aiEnabled: source.aiEnabled,
        allowMic: source.allowMic,
        allowOptions: source.allowOptions,
        repeatRequired: source.repeatRequired,
        maxConversationTurns: source.maxConversationTurns,
        source: source.source,
        metadata: source.metadata,
        status: 'draft',
      })
      for (const optionalField of ['content', 'choices', 'answer', 'conversationGoal']) {
        if (source[optionalField as keyof typeof source] !== undefined) {
          expect(mapped[optionalField]).toEqual(source[optionalField as keyof typeof source])
        }
      }
    }
    for (const unit of lessons) {
      for (const lesson of unit.lessons) {
        const mapped = plan.writes.find((write) => write.collection === 'lessons' && write.stableKey === lesson.lessonKey)!.document
        const settings = mapped.settings as { visualAssets: Array<{ assetKey: string; status: string }>; introVideo: { lessonKey: string; status: string; scenes: unknown[] } }
        const listedKeys = new Set(settings.visualAssets.map((asset) => asset.assetKey))
        for (const activity of lesson.activities.filter((item) => item.type === 'PICTURE_CHOICE')) {
          const pictureAsset = activity.content?.pictureAsset as { assetKey: string }
          expect(listedKeys.has(pictureAsset.assetKey)).toBe(true)
          const pictureOptions = activity.content?.pictureOptions as Array<{ assetKey: string; status: string }>
          expect(pictureOptions).toHaveLength(activity.choices?.length ?? 0)
          expect(pictureOptions.every((option) => listedKeys.has(option.assetKey) && option.status === 'MISSING')).toBe(true)
        }
        expect(settings.visualAssets.every((asset) => asset.status === 'MISSING')).toBe(true)
        expect(settings.introVideo).toMatchObject({ lessonKey: lesson.lessonKey, status: 'NOT_CREATED' })
        expect(settings.introVideo.scenes).toHaveLength(4)
      }
    }
  })

  it('is idempotent for already-current records and does not overwrite drifted records', () => {
    const first = planKGCurriculumImport(createEmptyKGSnapshot())
    const snapshot = {
      classes: first.writes.filter((write) => write.collection === 'curriculumclasses').map((write) => write.document),
      levels: first.writes.filter((write) => write.collection === 'levels').map((write) => write.document),
      lessons: first.writes.filter((write) => write.collection === 'lessons').map((write) => write.document),
      activities: first.writes.filter((write) => write.collection === 'activities').map((write) => write.document),
    }
    const second = planKGCurriculumImport(snapshot)
    expect(second.valid).toBe(true)
    expect(second.writes).toHaveLength(0)
    expect(second.counts).toMatchObject({ inserts: 0, updates: 0, unchanged: 201 })

    const changed = { ...snapshot, activities: snapshot.activities.map((activity, index) =>
      index === 0 ? { ...activity, status: 'active' } : activity) }
    const blocked = planKGCurriculumImport(changed)
    expect(blocked.valid).toBe(false)
    expect(blocked.errors.some((message) => message.includes('No update will be generated'))).toBe(true)
    expect(blocked.counts.updates).toBe(0)
  })

  it('keeps the dry-run pure and leaves the supplied snapshot unchanged', () => {
    const snapshot = createEmptyKGSnapshot()
    const before = JSON.stringify(snapshot)
    const plan = runKGDryRun(snapshot)
    expect(plan.valid).toBe(true)
    expect(JSON.stringify(snapshot)).toBe(before)
    expect(plan.writes.every((write) => write.action === 'insert')).toBe(true)
  })

  it('fingerprints KG read-scope records deterministically and detects changes', () => {
    const original = createEmptyKGSnapshot()
    const record = { _id: new ObjectId(), grade: 0, status: 'draft', updatedAt: new Date('2026-10-13T00:00:00Z') }
    original.classes.push(record)
    const first = fingerprintKGCurriculumSnapshot(original)
    expect(fingerprintKGCurriculumSnapshot(original)).toBe(first)
    expect(fingerprintKGCurriculumSnapshot({ ...original, classes: [{ ...record, status: 'active' }] })).not.toBe(first)
  })

  it('requires the explicit URI database path to match --database', () => {
    expect(verifyExplicitMongoDatabase('mongodb+srv://example.invalid/talkora?retryWrites=true', 'talkora')).toBe('talkora')
    expect(() => verifyExplicitMongoDatabase('mongodb+srv://example.invalid/?authSource=talkora', 'talkora'))
      .toThrow(/no explicit database path/)
    expect(() => verifyExplicitMongoDatabase('mongodb://localhost:27017/test', 'talkora'))
      .toThrow(/Target database mismatch/)
    expect(() => verifyExplicitMongoDatabase('mongodb://localhost:27017/talkora', ''))
      .toThrow(/explicit target database/)
  })

  it('reuses a Grade 0 class without changing its status and blocks duplicate unit-order collisions', () => {
    const existingClass = { _id: new ObjectId(), grade: 0, name: 'Existing KG', order: 0, status: 'active' }
    const withClass = planKGCurriculumImport({ ...createEmptyKGSnapshot(), classes: [existingClass] })
    expect(withClass.valid).toBe(true)
    expect(withClass.writes.some((write) => write.collection === 'curriculumclasses')).toBe(false)
    expect(withClass.writes.filter((write) => write.collection === 'levels')).toHaveLength(8)

    const otherUnit = {
      _id: new ObjectId(),
      classId: existingClass._id,
      number: 1,
      unitNumber: 1,
      curriculumVersion: 'another-curriculum',
    }
    const collision = planKGCurriculumImport({ ...createEmptyKGSnapshot(), classes: [existingClass], levels: [otherUnit] })
    expect(collision.valid).toBe(false)
    expect(collision.errors.some((message) => message.includes('already used by a different curriculum record'))).toBe(true)
  })
})
