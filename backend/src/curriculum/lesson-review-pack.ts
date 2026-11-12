import { z } from 'zod'

const text = (max: number) => z.string().trim().min(1).max(max)
const chapterCode = z.string().regex(/^\d{1,2}\.\d{1,2}$/)
const identifier = z.string().regex(/^[a-z0-9][a-z0-9._:-]{1,119}$/)
const modelLine = text(160).refine(value => !/[\u0000-\u001f\u007f]/.test(value))
const plainWords = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const teaching = z.object({
  teacherQuestion: text(1400), targets: z.array(text(40)).min(1).max(32),
  lineIds: z.array(identifier).min(1).max(10), modelLines: z.array(modelLine).min(1).max(10),
  hints: z.object({ en: text(240), hi: text(240), mr: text(240) }).strict(),
  retryEnglish: text(240), expectedEvidence: text(700),
}).strict().superRefine((value, context) => {
  if (value.lineIds.length !== value.modelLines.length || new Set(value.lineIds).size !== value.lineIds.length)
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lineIds'], message: 'Model lines need unique matching IDs' })
  const model = ' ' + plainWords(value.modelLines.join(' ')) + ' '
  if (value.targets.some(target => !plainWords(target) || !model.includes(' ' + plainWords(target) + ' ')))
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['targets'], message: 'Every target must occur as a word in the model' })
})

const common = z.object({
  id: identifier, prompt: text(1400), mode: text(40), approved: z.literal(false),
  evidence: z.object({
    kind: z.enum(['PRACTICE_REVIEW_REQUIRED', 'HUMAN_REVIEW_REQUIRED']), description: text(700),
  }).strict(),
})
const activity = z.discriminatedUnion('kind', [
  common.extend({ kind: z.literal('MODEL_PRACTICE'), chapter: chapterCode,
    exerciseNumber: z.null(), teaching }).strict(),
  common.extend({ kind: z.literal('EDUCATOR_CHECKPOINT'), chapter: chapterCode,
    exerciseNumber: z.number().int().min(1).max(64), teaching: z.null() }).strict(),
  common.extend({ kind: z.literal('SUPPLEMENTARY_PRACTICE'), chapter: z.null(),
    exerciseNumber: z.null(), teaching: z.null() }).strict(),
])

/** Offline teacher-review transport only. Nothing imports this schema into an
 * API, provider, publisher or progression path. A valid pack grants no access. */
export const lessonReviewPackSchema = z.object({
  schemaVersion: z.literal(1), status: z.literal('DRAFT_REVIEW_ONLY'),
  grade: z.number().int().min(0).max(10), level: z.number().int().min(1).max(10),
  lessonKey: z.string().regex(/^g(?:0\d|10)-l(?:0[1-9]|10)$/), title: text(240), objective: text(600),
  studentPlayable: z.literal(false), syllabusVerified: z.literal(false),
  source: z.object({
    book: text(160).nullable(), edition: text(60).nullable(),
    reference: z.string().url().refine(value => {
      try {
        const url = new URL(value)
        return url.protocol === 'https:' && url.hostname === 'ebooks.ebalbharati.in' &&
          !url.username && !url.password && !url.port && !url.search && !url.hash && /^\/pdfs\/\d{9}\.pdf$/.test(url.pathname)
      } catch { return false }
    }).nullable(),
    reviewStatus: z.literal('UNVERIFIED_FOR_RELEASE'),
  }).strict(),
  authoringSources: z.array(z.object({
    path: z.string().max(240).regex(/^(?:client|backend)\/[a-zA-Z0-9_./-]+\.(?:ts|json)$/)
      .refine(value => !value.split('/').includes('..')),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict()).min(1).max(20),
  chapters: z.array(z.object({
    code: chapterCode, title: text(240), objective: text(600),
    pageStart: z.number().int().positive().nullable(),
    numberedExercisesExpected: z.number().int().min(0).max(64),
  }).strict()).max(100),
  gates: z.object({
    educator: z.literal('PENDING'), language: z.literal('PENDING'), media: z.literal('UNVERIFIED'),
    runtime: z.literal('NOT_ENABLED'), physicalVoice: z.literal('UNVERIFIED'), publication: z.literal('LOCKED'),
  }).strict(),
  activities: z.array(activity).min(1).max(300),
}).strict().superRefine((pack, context) => {
  const issue = (path: (string | number)[], message: string) =>
    context.addIssue({ code: z.ZodIssueCode.custom, path, message })
  if (pack.lessonKey !== `g${String(pack.grade).padStart(2, '0')}-l${String(pack.level).padStart(2, '0')}`)
    issue(['lessonKey'], 'Grade and level must match the canonical address')
  for (const [key, values] of [
    ['activities', pack.activities.map(item => item.id)],
    ['chapters', pack.chapters.map(item => item.code)],
    ['authoringSources', pack.authoringSources.map(item => item.path)],
  ] as const) if (new Set(values).size !== values.length) issue([key], 'Duplicate identity')
  const chapters = new Set(pack.chapters.map(item => item.code))
  pack.activities.forEach((item, index) => {
    if (item.chapter && !chapters.has(item.chapter)) issue(['activities', index, 'chapter'], 'Unknown source chapter')
    if (item.kind === 'EDUCATOR_CHECKPOINT' && item.evidence.kind !== 'HUMAN_REVIEW_REQUIRED')
      issue(['activities', index, 'evidence'], 'Numbered textbook work needs separate educator evidence')
    if (JSON.stringify(item).length > 6000) issue(['activities', index], 'Review activity exceeds the data budget')
    if (item.kind === 'MODEL_PRACTICE' && item.teaching.lineIds.some((id, n) => id !== `${item.id}:model-${n + 1}`))
      issue(['activities', index, 'teaching', 'lineIds'], 'Model line IDs must belong to this activity')
  })
  for (const chapter of pack.chapters) {
    const numbers = pack.activities.filter(item => item.kind === 'EDUCATOR_CHECKPOINT' && item.chapter === chapter.code)
      .map(item => item.exerciseNumber!).sort((a, b) => a - b)
    const expected = Array.from({ length: chapter.numberedExercisesExpected }, (_, index) => index + 1)
    if (JSON.stringify(numbers) !== JSON.stringify(expected)) issue(['chapters'], 'Missing or duplicate numbered exercise')
  }
  if (JSON.stringify(pack).length > 128000) issue([], 'Review pack exceeds the data budget')
})

export type LessonReviewPack = z.infer<typeof lessonReviewPackSchema>
