/**
 * Talkora Class 1 Level 1 — conservative, additive, draft-only curriculum preparation.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/prepare-class1-l01-draft.ts
 *   pnpm exec tsx src/scripts/prepare-class1-l01-draft.ts --apply
 *
 * No changes without --apply. Never publishes, overwrites, or removes existing data.
 * Does NOT seed KG and does NOT create extra Level numbers beyond 1-10.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'

const VERSION = 'talkora-class1-l01-demo-draft-v1'
const applyRequested = process.argv.includes('--apply')
const STEPS = [
  { key: 'listen-at', title: 'Listen: find at', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Listen to the word at. Choose at.', target: 'at', choices: ['an', 'at', 'in'], answer: 'at', aiEnabled: false, allowMic: false },
  { key: 'build-at', title: 'Build at', type: 'SPELLING', stage: 'PRACTICE_ZONE', prompt: 'Put a and t together to make at.', target: 'at', choices: ['t', 'a'], answer: 'at', aiEnabled: false, allowMic: false },
  { key: 'listen-in', title: 'Listen: find in', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Listen to the word in. Choose in.', target: 'in', choices: ['is', 'on', 'in'], answer: 'in', aiEnabled: false, allowMic: false },
  { key: 'build-in', title: 'Build in', type: 'SPELLING', stage: 'PRACTICE_ZONE', prompt: 'Put i and n together to make in.', target: 'in', choices: ['n', 'i'], answer: 'in', aiEnabled: false, allowMic: false },
  { key: 'look-at-me', title: 'Look at me', type: 'MCQ', stage: 'PRACTICE_ZONE', prompt: 'Look __ me. Choose the missing word.', target: 'at', choices: ['in', 'at', 'on'], answer: 'at', aiEnabled: false, allowMic: false },
  { key: 'i-am-sam', title: 'Build a sentence', type: 'SENTENCE_BUILDER', stage: 'FINAL_CHALLENGE', prompt: 'Build the sentence: I am Sam.', target: 'I am Sam.', choices: ['Sam.', 'am', 'I'], answer: 'I am Sam.', aiEnabled: false, allowMic: false },
  { key: 'repeat-at', title: 'Guided word talk with Miss Julie', type: 'CONVERSATION', stage: 'INTERACT', prompt: 'Say at. Then use the word at with Miss Julie.', target: 'at', choices: [] as string[], answer: '', aiEnabled: true, allowMic: true },
] as const

async function main() {
  if (applyRequested && process.env.NODE_ENV === 'production') {
    throw new Error('Refusing demo seed in production. Run in a controlled local/staging environment only.')
  }
  await connectDatabase()
  try {
    const klass = await CurriculumClass.findOne({ grade: 1 })
    const level = klass ? await Level.findOne({ classId: klass._id, number: 1 }) : null
    if (level && level.curriculumVersion !== VERSION) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_LEVEL', reason: 'Class 1 Level 1 exists with a different owner/version; no modification permitted.', version: level.curriculumVersion }, null, 2))
      process.exitCode = 2
      return
    }
    if (level && (level.status !== 'draft' || level.availability !== 'UPCOMING')) {
      console.log(JSON.stringify({ status: 'STOP_LEVEL_ALREADY_LIVE', reason: 'Refusing to touch an existing active or published level.' }, null, 2))
      process.exitCode = 2
      return
    }
    const lessons = level ? await Lesson.find({ levelId: level._id }).select('_id order title status').lean() : []
    if (lessons.some(item => item.order !== 1 || item.title !== 'Letters and Sounds' || item.status !== 'draft')) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_LESSON', reason: 'Unexpected existing lesson; manual review required.' }, null, 2))
      process.exitCode = 2
      return
    }
    const lesson = lessons[0]
    const existing = lesson ? await Activity.find({ lessonId: lesson._id }).select('_id activityKey order status').lean() : []
    if (existing.some(item => item.status !== 'draft' || !STEPS.some(step => `class1-l01-${step.key}` === item.activityKey))) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_ACTIVITY', reason: 'Other activities belong to this lesson; no modification permitted.' }, null, 2))
      process.exitCode = 2
      return
    }
    console.log(JSON.stringify({
      action: applyRequested ? 'APPLY_DRAFT_ONLY' : 'PREVIEW_ONLY', classExists: !!klass,
      levelExists: !!level, lessonExists: !!lesson, activitiesExisting: existing.length,
      plannedActivities: STEPS.length, grade: 1, levelId: 'g01-l01',
      note: 'No KG modifications. No publishing. Syllabus references unverified. Does not activate student access or AI frontend.'
    }, null, 2))
    if (!applyRequested) return

    const actualClass = klass ?? await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: 'draft' })
    const actualLevel = level ?? await Level.create({
      classId: actualClass._id, number: 1, term: 1, unitNumber: 1, order: 1,
      unitType: 'CONVERSATION', visualTheme: 'Two-Letter Word Meadow', title: 'Two-Letter Word Adventure', place: 'Two-Letter Word Meadow',
      description: 'Foundational listening, decoding, word building, and guided speaking.',
      learningObjectives: ['Recognise and build at and in', 'Begin reading simple English phrases'],
      speakingGoals: ['Repeat at with Miss Julie without harsh pronunciation grading'],
      curriculumVersion: VERSION, availability: 'UPCOMING', status: 'draft', sourcePages: [],
    })
    const actualLesson = lesson ?? await Lesson.create({
      levelId: actualLevel._id, order: 1, title: 'Letters and Sounds',
      subtitle: 'Listen, build, say, and use small words', estimatedMinutes: 8, xpReward: 0,
      teacherIntroduction: 'We will listen, build, read and say small English words.',
      settings: { talkoraDemoDraft: true, experienceId: 'g01-l01', boardReviewRequired: true, syllabusVerified: false,
        sourceBook: null, audioProvider: 'ai4bharat', audioStorage: 's3', audioStatus: 'not-verified',
        frontendStudentPlayable: true, progressPersisted: true, homework: 'Say I am Sam and Look at me with someone at home.' },
      status: 'draft',
    })
    const previously = new Set(existing.map(a => a.activityKey))
    let inserted = 0
    for (let index = 0; index < STEPS.length; index++) {
      const step = STEPS[index]
      const key = `class1-l01-${step.key}`
      if (previously.has(key)) continue
      const occupancy = await Activity.exists({ lessonId: actualLesson._id, order: index + 1 })
      if (occupancy) throw new Error(`Activity order ${index + 1} already occupied. Stop without overwriting.`)
      await Activity.create({
        lessonId: actualLesson._id, curriculumVersion: VERSION, activityKey: key,
        grade: 1, term: 1, unitNumber: 1, order: index + 1,
        type: step.type, stage: step.stage, title: step.title, prompt: step.prompt,
        instruction: step.prompt, target: step.target, modelSentence: step.target,
        choices: [...step.choices], ...(step.answer ? { answer: step.answer } : {}),
        expectedPatterns: step.target === 'at' ? ['at'] : [], keywords: ['at', 'in', 'am'],
        difficulty: 'easy', xp: 0, estimatedSeconds: 40, voiceEnabled: true,
        aiEnabled: step.aiEnabled, allowMic: step.allowMic, allowOptions: !step.allowMic,
        repeatRequired: false, maxConversationTurns: 2,
        ...(step.aiEnabled ? {
          conversationGoal: { requiredConcepts: [], minTurns: 2, maxTurns: 2 },
          metadata: { conversationMode: 'OPEN', digitalType: 'GUIDED_WORD_TALK',
            allowedVocabulary: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'] },
        } : {}),
        source: { sourceType: 'ENRICHMENT', label: 'Talkora original Class 1 foundation demo; not verified Balbharati material' },
        content: { audioKey: `class-01/level-01/v1/${step.key}.wav`,
          teacherReviewRequired: true, pronunciationAssessment: 'not-verified' },
        core: true, required: true, status: 'draft',
      })
      inserted++
    }
    console.log(JSON.stringify({ status: 'DRAFT_PREPARED', inserted, level: 'g01-l01',
      studentsCanAccess: false, classStatus: actualClass.status,
      next: 'Rerun audit-class1-l01-readiness.ts, inspect school curriculum studio, verify audio and speech before publishing.' }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}
main().catch(() => { console.error('Draft preparation failed. Check connectivity, uniqueness conflicts, and current records. No destructive cleanup was attempted.'); process.exitCode = 1 })
