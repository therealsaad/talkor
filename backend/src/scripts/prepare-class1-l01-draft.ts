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
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Progress } from '../models/Progress'

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
  // The textbook bridge is added AFTER the tiny-word foundation. Original
  // prompts address Unit One 1.1 outcomes without reproducing its rhyme.
  { key: 'say-walk', title: 'My First Day: say walk', type: 'LISTEN_AND_REPEAT', stage: 'SPEAK', prompt: 'Look at Miss Julie walking to school. Can you say walk?', target: 'walk', choices: [] as string[], answer: '', aiEnabled: false, allowMic: true },
  { key: 'find-school', title: 'My First Day: find the school', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Look at these places. Which one is a school?', target: 'school', choices: ['bell', 'school', 'playground'], answer: 'school', aiEnabled: false, allowMic: false },
  { key: 'school-talk', title: 'My First Day: talk to Miss Julie', type: 'CONVERSATION', stage: 'INTERACT', prompt: 'Tell me one thing you like to do at school. You can start with: I play.', target: 'school', choices: [] as string[], answer: '', aiEnabled: true, allowMic: true },
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
    if (lessons.some(item => item.order !== 1 ||
      !['Letters and Sounds', 'Two-Letter Word Adventure', 'Little Words & My First Day'].includes(item.title) ||
      item.status !== 'draft')) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_LESSON', reason: 'Unexpected existing lesson; manual review required.' }, null, 2))
      process.exitCode = 2
      return
    }
    const lesson = lessons[0]
    const existing = lesson ? await Activity.find({ lessonId: lesson._id }).select('_id activityKey order status').lean() : []
    if (existing.some(item => item.status !== 'draft' ||
      STEPS.findIndex(step => `class1-l01-${step.key}` === item.activityKey) + 1 !== item.order)) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_ACTIVITY', reason: 'Other activities belong to this lesson; no modification permitted.' }, null, 2))
      process.exitCode = 2
      return
    }
    // An earlier demo learner may already have completed the seven-step draft.
    // Adding required steps after that would silently change their completion
    // contract. Require a staff-reviewed migration instead of rewriting records.
    if (applyRequested && existing.length) {
      const [hasStudentAttempts, hasSavedLessonProgress] = await Promise.all([
        ActivityAttempt.exists({ activityId: { $in: existing.map(item => item._id) } }),
        klass && level && lesson ? Progress.exists({
          classId: klass._id,
          levels: { $elemMatch: {
            levelId: level._id,
            lessons: { $elemMatch: { lessonId: lesson._id, $or: [
              { completed: true },
              { 'completedActivityIds.0': { $exists: true } },
            ] } },
          } },
        }) : Promise.resolve(null),
      ])
      if (hasStudentAttempts || hasSavedLessonProgress) {
        console.log(JSON.stringify({ status: 'STOP_STUDENT_PROGRESS_EXISTS', reason: 'Existing Class 1 attempts or completed activities require a reviewed migration. No changes made.' }, null, 2))
        process.exitCode = 2
        return
      }
    }
    console.log(JSON.stringify({
      action: applyRequested ? 'APPLY_DRAFT_ONLY' : 'PREVIEW_ONLY', classExists: !!klass,
      levelExists: !!level, lessonExists: !!lesson, activitiesExisting: existing.length,
      plannedActivities: STEPS.length, grade: 1, levelId: 'g01-l01',
      note: '90-second video asset still required. No KG modifications, publishing, or student access changes. Teacher review remains required.'
    }, null, 2))
    if (!applyRequested) return

    const actualClass = klass ?? await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: 'draft' })
    const actualLevel = level ?? await Level.create({
      classId: actualClass._id, number: 1, term: 1, unitNumber: 1, order: 1,
      unitType: 'CONVERSATION', visualTheme: 'Two-Letter Word Meadow', title: 'Two-Letter Word Adventure', place: 'Two-Letter Word Meadow',
      description: 'Little words followed by the 2025 Balbharati Grade One My First Day theme.',
      learningObjectives: ['Recognise and build at and in', 'Speak walk and recognise school', 'Talk briefly about school'],
      speakingGoals: ['Say at and walk with Miss Julie without harsh pronunciation grading'],
      curriculumVersion: VERSION, availability: 'UPCOMING', status: 'draft',
      sourceBook: 'English Balbharati Grade One (2025), Unit One, 1.1 My First Day', sourcePages: [1],
    })
    const actualLesson = lesson ?? await Lesson.create({
      levelId: actualLevel._id, order: 1, title: 'Letters and Sounds',
      subtitle: 'A short Julie story, little words, then My First Day', estimatedMinutes: 12, xpReward: 0,
      teacherIntroduction: 'First, watch Miss Julie. Then we will build little words and learn how to talk about school.',
      settings: { talkoraDemoDraft: true, experienceId: 'g01-l01', boardReviewRequired: true, syllabusVerified: false,
        sourceBook: null, audioProvider: 'ai4bharat', audioStorage: 's3', audioStatus: 'not-verified',
        frontendStudentPlayable: true, progressPersisted: true,
        introVideoKey: 'class1-g01-l01', introDurationSeconds: 90, introVideoReviewStatus: 'AWAITING_UPLOAD',
        lessonPlanRevision: 'first-day-bridge-v1',
        homework: 'Say I am Sam and I walk to school with someone at home.' },
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
        expectedPatterns: step.allowMic && !step.aiEnabled ? [step.target] : step.target === 'at' ? ['at'] : [],
        keywords: index < 7 ? ['at', 'in', 'am'] : ['walk', 'run', 'school', 'play', 'bell'],
        difficulty: 'easy', xp: 0, estimatedSeconds: 40, voiceEnabled: true,
        aiEnabled: step.aiEnabled, allowMic: step.allowMic, allowOptions: !step.allowMic,
        repeatRequired: false, maxConversationTurns: 2,
        ...(step.aiEnabled ? {
          conversationGoal: { requiredConcepts: [], minTurns: 2, maxTurns: 2 },
          metadata: { conversationMode: 'OPEN', digitalType: 'GUIDED_WORD_TALK',
            allowedVocabulary: index < 7
              ? ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up']
              : ['walk', 'run', 'jump', 'play', 'school', 'bell', 'I', 'go', 'to'] },
        } : {}),
        source: index < 7
          ? { sourceType: 'ENRICHMENT', label: 'Talkora original Class 1 tiny-word foundation' }
          : { sourceType: 'SYLLABUS', pdf: 'https://ebooks.ebalbharati.in/pdfs/103050001.pdf', pageStart: 1, pageEnd: 1,
              label: 'Original Talkora activity aligned to English Balbharati Grade One (2025), 1.1 My First Day' },
        content: { audioKey: `class-01/level-01/v1/${step.key}.wav`,
          ...(step.key === 'find-school' ? { pictureMode: true,
            languageHint: 'स्कूल पहचानो / शाळा ओळखा',
          } : {}),
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
