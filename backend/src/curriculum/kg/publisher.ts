import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { ObjectId } from 'mongodb'
import type { ActivityStage, ActivityType } from '../../models/Activity'
import type { KGCurriculumUnit, KGActivityPlan } from '../types'
import { lessons as kgUnits, validateKGCurriculum } from './lessons'
import { KG_CURRICULUM_VERSION } from './constants'
import { kgLessonVideoScript } from './video-scripts'

export { KG_CURRICULUM_VERSION } from './constants'

type MongoRecord = Record<string, unknown> & { _id: ObjectId }

export interface KGCurriculumSnapshot {
  classes: MongoRecord[]
  levels: MongoRecord[]
  lessons: MongoRecord[]
  activities: MongoRecord[]
}

export interface KGWrite<T extends MongoRecord = MongoRecord> {
  collection: 'curriculumclasses' | 'levels' | 'lessons' | 'activities'
  action: 'insert'
  stableKey: string
  document: T
}

export interface KGNoop {
  collection: KGWrite['collection']
  stableKey: string
  reason: 'already-current'
}

export interface KGImportPlan {
  valid: boolean
  counts: {
    units: number
    lessons: number
    activities: number
    inserts: number
    updates: number
    unchanged: number
    missingPictureAssets: number
    missingPrerecordedAudioItems: number
    introVideosNotCreated: number
  }
  writes: KGWrite[]
  unchanged: KGNoop[]
  errors: string[]
  protectedCollectionsWritten: string[]
}

const ACTIVITY_TYPES: readonly ActivityType[] = ['PICTURE_CHOICE', 'SPEAK_PROMPT', 'OPEN_CONVERSATION']
const ACTIVITY_STAGES: readonly ActivityStage[] = [
  'WARM_UP', 'PRACTICE_ZONE', 'LISTEN_REPEAT', 'SPEAK', 'INTERACT', 'HOME_PRACTICE',
]

function stableObjectId(namespace: string, key: string): ObjectId {
  const hex = createHash('sha256').update(`talkora-kg-publisher:${namespace}:${key}`).digest('hex').slice(0, 24)
  return new ObjectId(hex)
}

function idEquals(left: unknown, right: unknown): boolean {
  return String(left) === String(right)
}

function toCanonical(value: unknown): unknown {
  if (value instanceof ObjectId) return value.toHexString()
  if (value instanceof Date) return { $date: value.toISOString() }
  if (Buffer.isBuffer(value)) return { $binary: value.toString('base64') }
  if (Array.isArray(value)) return value.map(toCanonical)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(Object.keys(record).sort().flatMap((key) => {
      if (record[key] === undefined) return []
      return [[key, toCanonical(record[key])]]
    }))
  }
  return value
}

/** Fingerprint the exact KG-relevant read set so apply can fail closed on any intervening change. */
export function fingerprintKGCurriculumSnapshot(snapshot: KGCurriculumSnapshot): string {
  const ordered = Object.fromEntries((['classes', 'levels', 'lessons', 'activities'] as const).map((collection) => [
    collection,
    [...snapshot[collection]].sort((left, right) => String(left._id).localeCompare(String(right._id))),
  ]))
  return createHash('sha256').update(JSON.stringify(toCanonical(ordered))).digest('hex')
}

/** Compare fields the importer owns. Existing timestamps and unrelated fields are ignored. */
function matchesManagedFields(desired: MongoRecord, existing: MongoRecord): boolean {
  const existingProjection = Object.fromEntries(Object.keys(desired).map((key) => [key, existing[key]]))
  return isDeepStrictEqual(toCanonical(desired), toCanonical(existingProjection))
}

function recordId(record: MongoRecord): ObjectId {
  const id = record._id
  if (id instanceof ObjectId) return id
  if (typeof id === 'string' && ObjectId.isValid(id)) return new ObjectId(id)
  throw new Error(`Encountered a curriculum record with an invalid _id: ${String(id)}`)
}

function unitStableKey(unit: KGCurriculumUnit): string {
  return `${unit.curriculumVersion}:unit:${unit.unitNumber}`
}

function mapClass(id: ObjectId): MongoRecord {
  return {
    _id: id,
    grade: 0,
    name: 'Kindergarten (KG)',
    description: 'Grade 0 foundation pilot; curriculum units remain unpublished until school review.',
    order: 0,
    status: 'draft',
  }
}

function mapUnit(unit: KGCurriculumUnit, classId: ObjectId, id: ObjectId): MongoRecord {
  const speakingGoals = Array.from(new Set(unit.lessons.flatMap((lesson) => lesson.learningObjectives)))
  return {
    _id: id,
    classId,
    number: unit.unitNumber,
    term: unit.term,
    unitNumber: unit.unitNumber,
    unitType: 'CONVERSATION',
    visualTheme: unit.world,
    learningObjectives: unit.learningObjectives,
    speakingGoals,
    sourcePages: [],
    curriculumVersion: unit.curriculumVersion,
    availability: 'UPCOMING',
    title: unit.title,
    place: unit.world,
    description: unit.description,
    order: unit.unitNumber,
    status: 'draft',
  }
}

function unitVisualAssetManifest(unit: KGCurriculumUnit): Array<Record<string, unknown>> {
  const manifest = new Map<string, Record<string, unknown>>()
  for (const asset of unit.visualAssets) manifest.set(asset.assetKey, { ...asset })
  for (const lesson of unit.lessons) {
    for (const activity of lesson.activities) {
      if (activity.type !== 'PICTURE_CHOICE') continue
      const pictureAsset = activity.content?.pictureAsset as { assetKey?: unknown; status?: unknown } | undefined
      const optionAssets = activity.content?.pictureOptions as Array<{ word?: unknown; assetKey?: unknown; status?: unknown }> | undefined
      const referencedAssets: Array<{ word?: unknown; assetKey?: unknown; status?: unknown }> = [
        ...(pictureAsset ? [pictureAsset] : []),
        ...(Array.isArray(optionAssets) ? optionAssets : []),
      ]
      for (const reference of referencedAssets) {
        if (typeof reference?.assetKey !== 'string' || reference.status !== 'MISSING') continue
        if (!manifest.has(reference.assetKey)) {
          manifest.set(reference.assetKey, {
            assetKey: reference.assetKey,
            kind: 'PICTURE_ILLUSTRATION',
            altText: `Child-friendly picture for ${String(reference.word ?? activity.target ?? 'a KG vocabulary word').toLowerCase()}`,
            status: 'MISSING',
          })
        }
      }
    }
  }
  return Array.from(manifest.values())
}

function mapLesson(unit: KGCurriculumUnit, lesson: KGCurriculumUnit['lessons'][number], levelId: ObjectId, id: ObjectId): MongoRecord {
  const settings = {
    foundation: true,
    languageSupport: 'hi-en',
    pilotStatus: 'PILOT_UNAPPROVED',
    schoolSyllabusApproved: false,
    curriculumVersion: unit.curriculumVersion,
    lessonKey: lesson.lessonKey,
    learningObjectives: lesson.learningObjectives,
    newWords: lesson.newWords,
    reviewWords: lesson.reviewWords,
    modelSentence: lesson.modelSentence,
    conversationQuestion: lesson.conversationQuestion,
    conversationModel: lesson.conversationModel,
    spokenHomework: lesson.homework,
    visualAssets: unitVisualAssetManifest(unit),
    introVideo: kgLessonVideoScript(unit, lesson),
  }
  return {
    _id: id,
    levelId,
    title: lesson.title,
    subtitle: lesson.subtitle,
    order: lesson.order,
    estimatedMinutes: lesson.estimatedMinutes,
    xpReward: 35,
    teacherIntroduction: lesson.teacherIntroduction,
    settings,
    status: 'draft',
  }
}

function mapActivity(activity: KGActivityPlan, lessonId: ObjectId, id: ObjectId): MongoRecord {
  return {
    _id: id,
    lessonId,
    curriculumVersion: activity.curriculumVersion,
    activityKey: activity.activityKey,
    grade: 0,
    term: activity.term,
    unitNumber: activity.unitNumber,
    type: activity.type,
    stage: activity.stage,
    core: activity.core,
    required: activity.required,
    title: activity.title,
    prompt: activity.prompt,
    ...(activity.instruction === undefined ? {} : { instruction: activity.instruction }),
    order: activity.order,
    ...(activity.target === undefined ? {} : { target: activity.target }),
    ...(activity.teacherPrompt === undefined ? {} : { teacherPrompt: activity.teacherPrompt }),
    ...(activity.modelSentence === undefined ? {} : { modelSentence: activity.modelSentence }),
    expectedPatterns: activity.expectedPatterns,
    keywords: activity.keywords,
    ...(activity.hint === undefined ? {} : { hint: activity.hint }),
    ...(activity.content === undefined ? {} : { content: activity.content }),
    ...(activity.choices === undefined ? {} : { choices: activity.choices }),
    ...(activity.answer === undefined ? {} : { answer: activity.answer }),
    difficulty: activity.difficulty,
    xp: activity.xp,
    estimatedSeconds: activity.estimatedSeconds,
    voiceEnabled: activity.voiceEnabled,
    aiEnabled: activity.aiEnabled,
    allowMic: activity.allowMic,
    allowOptions: activity.allowOptions,
    repeatRequired: activity.repeatRequired,
    maxConversationTurns: activity.maxConversationTurns,
    ...(activity.conversationGoal === undefined ? {} : { conversationGoal: activity.conversationGoal }),
    source: activity.source,
    metadata: activity.metadata,
    status: 'draft',
  }
}

function stableMatch<T extends MongoRecord>(
  rows: T[],
  description: string,
  errors: string[],
): T | undefined {
  if (rows.length > 1) errors.push(`Duplicate existing records match ${description}.`)
  return rows.length === 1 ? rows[0] : undefined
}

/**
 * Pure planner: no model imports, DB connection, index creation, or writes.
 * It inserts missing KG-only documents and treats drift as a review blocker instead of overwriting it.
 */
export function planKGCurriculumImport(
  snapshot: KGCurriculumSnapshot,
  units: readonly KGCurriculumUnit[] = kgUnits,
): KGImportPlan {
  const errors = [...validateKGCurriculum(units).errors]
  const writes: KGWrite[] = []
  const unchanged: KGNoop[] = []
  const addRecord = (collection: KGWrite['collection'], stableKey: string, desired: MongoRecord, existing?: MongoRecord) => {
    if (!existing) {
      writes.push({ collection, action: 'insert', stableKey, document: desired })
    } else if (matchesManagedFields(desired, existing)) {
      unchanged.push({ collection, stableKey, reason: 'already-current' })
    } else {
      errors.push(`${collection} record ${stableKey} exists but differs from the pilot source; review it manually. No update will be generated.`)
    }
  }

  for (const unit of units) {
    if (unit.curriculumVersion !== KG_CURRICULUM_VERSION) errors.push(`${unit.title} has an unexpected curriculum version.`)
    for (const lesson of unit.lessons) {
      for (const item of lesson.activities) {
        if (!ACTIVITY_TYPES.includes(item.type)) errors.push(`${item.activityKey} has unsupported activity type ${item.type}.`)
        if (!ACTIVITY_STAGES.includes(item.stage)) errors.push(`${item.activityKey} has unsupported activity stage ${item.stage}.`)
        if (item.type === 'PICTURE_CHOICE') {
          const asset = item.content?.pictureAsset as { assetKey?: unknown; status?: unknown } | undefined
          if (!item.choices || item.choices.length < 2 || !item.answer || !item.choices.includes(item.answer)) {
            errors.push(`${item.activityKey} needs at least two choices and an answer present in those choices.`)
          }
          if (typeof asset?.assetKey !== 'string' || asset.status !== 'MISSING') {
            errors.push(`${item.activityKey} must reference an explicitly missing picture asset.`)
          }
        }
        if (item.type === 'OPEN_CONVERSATION' &&
          (!item.teacherPrompt || !item.conversationGoal || !item.aiEnabled || !item.voiceEnabled || !item.allowMic)) {
          errors.push(`${item.activityKey} is missing required shared-engine conversation fields.`)
        }
      }
    }
  }

  const classMatch = stableMatch(snapshot.classes.filter((item) => item.grade === 0), 'Grade 0 curriculum class', errors)
  const classId = classMatch ? recordId(classMatch) : stableObjectId('class', 'grade-0')
  const desiredClass = mapClass(classId)
  if (classMatch) {
    // Class records can predate KG and may be active. Never change an existing class status or description.
    unchanged.push({ collection: 'curriculumclasses', stableKey: 'grade:0', reason: 'already-current' })
  } else {
    writes.push({ collection: 'curriculumclasses', action: 'insert', stableKey: 'grade:0', document: desiredClass })
  }

  const resolvedLevels = new Map<number, ObjectId>()
  for (const unit of units) {
    const stableKey = unitStableKey(unit)
    const stableRows = snapshot.levels.filter((row) => row.curriculumVersion === unit.curriculumVersion && row.unitNumber === unit.unitNumber)
    const stableRow = stableMatch(stableRows, stableKey, errors)
    const classCollision = snapshot.levels.filter((row) => idEquals(row.classId, classId) &&
      (row.number === unit.unitNumber || row.unitNumber === unit.unitNumber || row.order === unit.unitNumber))
    if (classCollision.some((row) => !stableRows.some((stable) => idEquals(stable._id, row._id)))) {
      errors.push(`Grade 0 unit/order ${unit.unitNumber} is already used by a different curriculum record.`)
    }
    if (stableRow && !idEquals(stableRow.classId, classId)) errors.push(`${stableKey} is assigned to a different curriculum class.`)
    const levelId = stableRow ? recordId(stableRow) : stableObjectId('level', stableKey)
    resolvedLevels.set(unit.unitNumber, levelId)
    addRecord('levels', stableKey, mapUnit(unit, classId, levelId), stableRow)
  }

  const lessonsByKey = new Map<string, ObjectId>()
  for (const unit of units) {
    const levelId = resolvedLevels.get(unit.unitNumber)!
    for (const lesson of unit.lessons) {
      const stableRows = snapshot.lessons.filter((row => {
        const settings = row.settings as Record<string, unknown> | undefined
        return settings?.lessonKey === lesson.lessonKey
      }))
      const stableRow = stableMatch(stableRows, lesson.lessonKey, errors)
      const orderCollision = snapshot.lessons.filter((row) => idEquals(row.levelId, levelId) && row.order === lesson.order)
      if (orderCollision.some((row) => !stableRows.some((stable) => idEquals(stable._id, row._id)))) {
        errors.push(`Lesson order ${lesson.order} in ${unit.title} is already used by another lesson.`)
      }
      if (stableRow && !idEquals(stableRow.levelId, levelId)) errors.push(`${lesson.lessonKey} is linked to a different unit.`)
      const stableKey = lesson.lessonKey
      const lessonId = stableRow ? recordId(stableRow) : stableObjectId('lesson', stableKey)
      lessonsByKey.set(stableKey, lessonId)
      addRecord('lessons', stableKey, mapLesson(unit, lesson, levelId, lessonId), stableRow)
    }
  }

  for (const unit of units) {
    for (const lesson of unit.lessons) {
      const lessonId = lessonsByKey.get(lesson.lessonKey)!
      for (const activity of lesson.activities) {
        const stableRows = snapshot.activities.filter((row =>
          row.curriculumVersion === activity.curriculumVersion && row.activityKey === activity.activityKey))
        const sameKeyRows = snapshot.activities.filter((row) => row.activityKey === activity.activityKey)
        if (sameKeyRows.some((row) => !stableRows.some((stable) => idEquals(stable._id, row._id)))) {
          errors.push(`Activity key ${activity.activityKey} already exists with a different curriculum version.`)
        }
        const stableRow = stableMatch(stableRows, activity.activityKey, errors)
        const orderCollision = snapshot.activities.filter((row) => idEquals(row.lessonId, lessonId) && row.order === activity.order)
        if (orderCollision.some((row) => !stableRows.some((stable) => idEquals(stable._id, row._id)))) {
          errors.push(`Activity order ${activity.order} in ${lesson.lessonKey} is already used by another activity.`)
        }
        if (stableRow && !idEquals(stableRow.lessonId, lessonId)) errors.push(`${activity.activityKey} is linked to a different lesson.`)
        const activityId = stableRow ? recordId(stableRow) : stableObjectId('activity', activity.activityKey)
        addRecord('activities', activity.activityKey, mapActivity(activity, lessonId, activityId), stableRow)
      }
    }
  }

  const missingPictureAssets = new Set(units.flatMap((unit) => unitVisualAssetManifest(unit)
    .filter((asset) => asset.status === 'MISSING').map((asset) => String(asset.assetKey)))).size
  const missingPrerecordedAudioItems = units.reduce((total, unit) => total + unit.vocabulary
    .filter((word) => word.audio.prerecordedStatus === 'NOT_CREATED').length, 0)

  return {
    valid: errors.length === 0,
    counts: {
      units: units.length,
      lessons: units.reduce((total, unit) => total + unit.lessons.length, 0),
      activities: units.reduce((total, unit) => total + unit.lessons.reduce((count, lesson) => count + lesson.activities.length, 0), 0),
      inserts: writes.length,
      updates: 0,
      unchanged: unchanged.length,
      missingPictureAssets,
      missingPrerecordedAudioItems,
      introVideosNotCreated: units.filter((unit) => unit.introVideo.status === 'NOT_CREATED').length,
    },
    writes,
    unchanged,
    errors: Array.from(new Set(errors)),
    protectedCollectionsWritten: [],
  }
}

/** A read-only database name check. URI paths are mandatory; authSource is not a target database. */
export function verifyExplicitMongoDatabase(uri: string, expectedDatabase: string): string {
  if (!expectedDatabase || !/^[a-zA-Z0-9_-]+$/.test(expectedDatabase)) {
    throw new Error('Pass an explicit target database name with --database <name>.')
  }
  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    throw new Error('MONGODB_URI is not a valid MongoDB connection URI.')
  }
  if (parsed.protocol !== 'mongodb:' && parsed.protocol !== 'mongodb+srv:') {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv://.')
  }
  const uriDatabase = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  if (!uriDatabase) throw new Error('MONGODB_URI has no explicit database path; refusing MongoDB’s implicit test database.')
  if (uriDatabase !== expectedDatabase) {
    throw new Error(`Target database mismatch: --database is ${expectedDatabase}, but MONGODB_URI names ${uriDatabase}.`)
  }
  return uriDatabase
}

export function createEmptyKGSnapshot(): KGCurriculumSnapshot {
  return { classes: [], levels: [], lessons: [], activities: [] }
}

/** Test helper that accepts only an already-loaded snapshot and cannot access a DB or mutate it. */
export function runKGDryRun(snapshot: KGCurriculumSnapshot, units: readonly KGCurriculumUnit[] = kgUnits): KGImportPlan {
  return planKGCurriculumImport(snapshot, units)
}

export function describeKGActivityMapping(activity: KGActivityPlan): Pick<KGActivityPlan, 'activityKey' | 'type' | 'stage'> {
  return { activityKey: activity.activityKey, type: activity.type, stage: activity.stage }
}
