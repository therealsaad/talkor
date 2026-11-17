import { z } from 'zod'
import { ApiError } from '../utils/ApiError'
import { FIRST_DAY_SCENES } from '../scripts/class1-first-day-scenes'
import { FIRST_DAY_POEM_LINES, FIRST_DAY_POEM_STEPS } from '../curriculum/class1-first-day-poem'

const text = (max: number) => z.string().trim().min(1).max(max)
const line = text(160).refine(value => !/[\u0000-\u001f\u007f]/.test(value))
const sourceSchema = z.object({
  reference: text(300).nullable(), label: text(240).nullable(),
  book: text(160).nullable(), edition: text(40).nullable(), chapter: text(60).nullable(),
  pageStart: z.number().int().positive().nullable(), pageEnd: z.number().int().positive().nullable(),
}).strict()
const hintsSchema = z.object({ en: text(240).nullable(), hi: text(240).nullable(), mr: text(240).nullable() }).strict()
const authoringSchema = z.object({
  version: z.literal(1), objective: text(240).optional(),
  book: text(160).optional(), edition: text(40).optional(), chapter: text(60).optional(),
  hints: hintsSchema.optional(),
}).strict()

/** Optional, bounded Node -> Python contract. This version enables only the
 * already authorized First Day v3/v4 paths; it is never a publication flag. */
export const lessonTeachingContextSchema = z.object({
  version: z.literal(1), grade: z.literal(1), lessonKey: z.literal('g01-l01'),
  sceneKey: text(32), activityKey: text(96), revision: text(120),
  mode: z.enum(['SCHOOL_ACTION', 'RECITE']), learnerBand: z.literal('EARLY_PRIMARY'),
  focus: z.enum(['school', 'skip', 'run', 'walk', 'smile', 'bell', 'jump', 'play', 'classroom', 'grade one']),
  source: sourceSchema, objective: text(240), teacherQuestion: text(1400),
  lineIds: z.array(text(96)).min(1).max(10), modelLines: z.array(line).min(1).max(10),
  vocabulary: z.array(text(40)).max(32), hints: hintsSchema,
  support: z.object({
    mode: z.enum(['MODEL', 'GUIDE', 'PRACTISE', 'CHECK']),
    hintLevel: z.number().int().min(0).max(3),
    reason: z.enum(['FIRST_ATTEMPT', 'RETRY', 'REPEATED_DIFFICULTY', 'SUPPORTED_ATTEMPT', 'INDEPENDENT_EVIDENCE']),
    recentAttempts: z.number().int().min(0).max(8),
  }).strict(),
}).strict().refine(value => value.lineIds.length === value.modelLines.length)
  .refine(value => JSON.stringify(value).length <= 6000)
export type LessonTeachingContext = z.infer<typeof lessonTeachingContextSchema>

export function selectLessonSupport(input: {
  attempts: Array<{ correct?: boolean; hintsUsed?: number }>
  retry?: { waiting?: boolean; hintLevel?: number; attempt?: number }
}): LessonTeachingContext['support'] {
  const attempts = input.attempts.slice(0, 8).filter(attempt => typeof attempt.correct === 'boolean')
  const hintLevel = Math.max(0, Math.min(3, Math.floor(Number(input.retry?.hintLevel) || 0)))
  const failed = attempts.findIndex(attempt => attempt.correct === true)
  const consecutiveWrong = failed < 0 ? attempts.length : failed
  const recentAttempts = attempts.length
  if (hintLevel >= 2 || (input.retry?.waiting && (input.retry.attempt || 0) >= 2) || consecutiveWrong >= 2)
    return { mode: 'MODEL', hintLevel, reason: 'REPEATED_DIFFICULTY', recentAttempts }
  if (input.retry?.waiting || attempts[0]?.correct === false)
    return { mode: 'GUIDE', hintLevel, reason: 'RETRY', recentAttempts }
  if (hintLevel > 0 || (attempts[0]?.hintsUsed || 0) > 0)
    return { mode: 'PRACTISE', hintLevel, reason: 'SUPPORTED_ATTEMPT', recentAttempts }
  if (attempts[0]?.correct === true && attempts[0].hintsUsed === 0)
    return { mode: 'CHECK', hintLevel, reason: 'INDEPENDENT_EVIDENCE', recentAttempts }
  return { mode: 'MODEL', hintLevel, reason: 'FIRST_ATTEMPT', recentAttempts }
}

interface TeachingActivity {
  activityKey?: string; curriculumVersion?: string; modelSentence?: string; hint?: string
  teacherPrompt?: string; prompt: string; instruction?: string; keywords?: string[]
  metadata?: Record<string, unknown>; content?: Record<string, unknown>
  source?: { pdf?: string; label?: string; pageStart?: number; pageEnd?: number }
}

/** A read-only projection of authorized existing Lesson/Activity records.
 * Never accepts student-provided context, answers, approval status or progress. */
export function buildLessonTeachingContext(input: {
  grade: number; lessonKey?: string; activity?: TeachingActivity
  settings?: Record<string, unknown>; support: LessonTeachingContext['support']
}): LessonTeachingContext | undefined {
  const a = input.activity
  if (input.grade !== 1 || input.lessonKey !== 'g01-l01' || !a ||
      !/^class1-l01-v[34]-/.test(a.activityKey || '')) return undefined
  const metadata = a.metadata || {}
  const sceneKey = typeof metadata.sceneKey === 'string' ? metadata.sceneKey : ''
  const poem = FIRST_DAY_POEM_STEPS.find(step => step.key === sceneKey)
  const action = FIRST_DAY_SCENES.find(scene => scene.key === sceneKey)
  if (!poem && !action) throw ApiError.activityUnavailable('The current teaching scene is not authored')
  if (a.activityKey !== `class1-l01-${poem ? 'v4' : 'v3'}-${sceneKey}`)
    throw ApiError.activityUnavailable('The teaching scene does not match this activity')
  const authored = metadata.teaching === undefined ? undefined : authoringSchema.safeParse(metadata.teaching)
  if (authored && !authored.success) throw ApiError.activityUnavailable('The lesson teaching data needs review')
  const spec = authored?.success ? authored.data : undefined
  // Old v3 fixtures/records without a model retain their reviewed legacy path.
  // New authoring records opt in explicitly and must be complete.
  if (!poem && !a.modelSentence?.trim() && !spec) return undefined
  const modelLines = poem ? a.content?.poemLines : [a.modelSentence]
  if (poem && (!Array.isArray(modelLines) || JSON.stringify(modelLines) !==
      JSON.stringify(FIRST_DAY_POEM_LINES.slice(poem.start, poem.end))))
    throw ApiError.activityUnavailable('The current poem lines do not match the authored scene')
  const nullText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null
  const vocabulary = metadata.allowedVocabulary ?? a.keywords ?? []
  const result = lessonTeachingContextSchema.safeParse({
    version: 1, grade: 1, lessonKey: 'g01-l01', sceneKey, activityKey: a.activityKey,
    revision: input.settings?.lessonPlanRevision || a.curriculumVersion || 'legacy-first-day',
    mode: poem ? 'RECITE' : 'SCHOOL_ACTION', learnerBand: 'EARLY_PRIMARY',
    focus: (poem?.target || action?.focus || '').toLowerCase().replace(/^grin$/, 'smile').replace(/^go in$/, 'classroom'),
    source: {
      reference: nullText(a.source?.pdf), label: nullText(a.source?.label),
      book: spec?.book || null, edition: spec?.edition || null, chapter: spec?.chapter || null,
      pageStart: a.source?.pageStart ?? null, pageEnd: a.source?.pageEnd ?? null,
    },
    objective: spec?.objective || (poem
      ? 'Listen to and recite the current English poem lines in order.'
      : 'Understand and use the current school action in a short English sentence.'),
    teacherQuestion: (a.teacherPrompt || a.prompt).trim(),
    lineIds: Array.isArray(modelLines) ? modelLines.map((_, index) =>
      `g01-l01:${sceneKey}:line-${(poem?.start || 0) + index + 1}`) : [],
    modelLines, vocabulary,
    hints: spec?.hints || { en: nullText(a.hint), hi: null, mr: null },
    support: input.support,
  })
  if (!result.success) throw ApiError.activityUnavailable('The lesson teaching data needs review')
  return result.data
}
