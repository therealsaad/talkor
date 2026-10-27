/**
 * Talkora Class 1 Level 1 — conservative, additive, draft-only curriculum preparation.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/prepare-class1-l01-draft.ts
 *   pnpm exec tsx src/scripts/prepare-class1-l01-draft.ts --apply
 *
 * No changes without --apply. Refreshes only this owned, unpublished lesson
 * when it has no student attempts or saved progress.
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
const AUDIO_REVISION = 'v2'
const applyRequested = process.argv.includes('--apply')
const STEPS = [
  { key: 'listen-am', title: 'Listen: find am', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Listen for am. Choose the word you hear.', target: 'am', choices: ['an', 'am', 'at'], answer: 'am', aiEnabled: false, allowMic: false },
  { key: 'build-an', title: 'Build an', type: 'SPELLING', stage: 'PRACTICE_ZONE', prompt: 'Put a and n together to make an.', target: 'an', choices: ['n', 'a'], answer: 'an', aiEnabled: false, allowMic: false },
  { key: 'listen-at', title: 'Listen: find at', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Listen for at. Choose the word you hear.', target: 'at', choices: ['in', 'at', 'on'], answer: 'at', aiEnabled: false, allowMic: false },
  { key: 'listen-in', title: 'Listen: find in', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Listen for in. Choose the word you hear.', target: 'in', choices: ['is', 'on', 'in'], answer: 'in', aiEnabled: false, allowMic: false },
  { key: 'use-on', title: 'Use on in a sentence', type: 'MCQ', stage: 'PRACTICE_ZONE', prompt: 'The book is __ the table. Choose the little word.', target: 'on', choices: ['in', 'on', 'at'], answer: 'on', aiEnabled: false, allowMic: false },
  { key: 'it-is-up', title: 'Read: It is up', type: 'MCQ', stage: 'PRACTICE_ZONE', prompt: 'Read: It is up. Which little word says where?', target: 'up', choices: ['up', 'it', 'is'], answer: 'up', aiEnabled: false, allowMic: false },
  { key: 'review-little-words', title: 'Guided little-word talk with Miss Julie', type: 'CONVERSATION', stage: 'INTERACT', prompt: 'Practise am, an, at, in, is, it, on, and up with Miss Julie. She will help you say one short phrase.', target: 'am, an, at, in, is, it, on, up', choices: [] as string[], answer: '', aiEnabled: true, allowMic: true },
  // The textbook bridge is added AFTER the tiny-word foundation. Original
  // prompts address Unit One 1.1 outcomes without reproducing its rhyme.
  { key: 'say-walk', title: 'My First Day: say walk', type: 'LISTEN_AND_REPEAT', stage: 'SPEAK', prompt: 'Look at Miss Julie walking to school. Can you say walk?', target: 'walk', choices: [] as string[], answer: '', aiEnabled: false, allowMic: true },
  { key: 'find-school', title: 'My First Day: find the school', type: 'WORD_RECOGNITION', stage: 'LISTEN_REPEAT', prompt: 'Look at these places. Which one is a school?', target: 'school', choices: ['bell', 'school', 'playground'], answer: 'school', aiEnabled: false, allowMic: false },
  { key: 'school-talk', title: 'My First Day: talk to Miss Julie', type: 'CONVERSATION', stage: 'INTERACT', prompt: 'Tell me one thing you like to do at school. You can start with: I play.', target: 'school', choices: [] as string[], answer: '', aiEnabled: true, allowMic: true },
] as const
const LEGACY_STEP_KEYS = [
  'listen-at', 'build-at', 'listen-in', 'build-in', 'look-at-me', 'i-am-sam', 'repeat-at',
  'say-walk', 'find-school', 'school-talk',
]

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
    const existing = lesson ? await Activity.find({ lessonId: lesson._id }).select('_id activityKey curriculumVersion order status').lean() : []
    const existingOrders = existing.map(item => item.order)
    const currentActivityKeys = new Set(STEPS.map(step => `class1-l01-v2-${step.key}`))
    const originalLegacyKeys = new Set(LEGACY_STEP_KEYS.map(key => `class1-l01-${key}`))
    const retainedLegacyKeys = new Set(LEGACY_STEP_KEYS.map(key => `class1-l01-legacy-${key}`))
    const recognizedActivityKeys = new Set([...currentActivityKeys, ...originalLegacyKeys, ...retainedLegacyKeys])
    if (existing.some(item => item.status !== 'draft' ||
      item.curriculumVersion !== VERSION ||
      !recognizedActivityKeys.has(item.activityKey || '') ||
      !Number.isInteger(item.order) || item.order < 1 || item.order > STEPS.length * 2 ||
      (currentActivityKeys.has(item.activityKey || '') && item.order > STEPS.length) ||
      (originalLegacyKeys.has(item.activityKey || '') && item.order > STEPS.length)) ||
      new Set(existingOrders).size !== existingOrders.length) {
      console.log(JSON.stringify({ status: 'STOP_EXISTING_ACTIVITY', reason: 'Other activities belong to this lesson; no modification permitted.' }, null, 2))
      process.exitCode = 2
      return
    }
    // Activity order is part of saved progress. Never rewrite this owned draft
    // after a learner has attempted it or recorded lesson progress.
    const [attemptRows, progressRows] = await Promise.all([
      existing.length ? ActivityAttempt.aggregate([
        { $match: { activityId: { $in: existing.map(item => item._id) } } },
        { $group: { _id: '$activityId', attempts: { $sum: 1 } } },
      ]) : Promise.resolve([]),
      klass && level && lesson ? Progress.find({
        classId: klass._id,
        levels: { $elemMatch: { levelId: level._id, lessons: { $elemMatch: { lessonId: lesson._id } } } },
      }).select('levels').lean() : Promise.resolve([]),
    ])
    const attemptCounts = new Map(attemptRows.map((row: { _id: unknown; attempts: number }) => [String(row._id), row.attempts]))
    const lessonProgress = progressRows.flatMap(progress => progress.levels
      .filter(entry => String(entry.levelId) === String(level?._id))
      .flatMap(entry => entry.lessons.filter(item => String(item.lessonId) === String(lesson?._id))))
    const completedCounts = new Map<string, number>()
    for (const progress of lessonProgress) {
      for (const activityId of progress.completedActivityIds || []) {
        const key = String(activityId)
        completedCounts.set(key, (completedCounts.get(key) || 0) + 1)
      }
    }
    const hasStudentAttempts = attemptRows.length > 0
    const hasSavedLessonProgress = lessonProgress.some(item => item.completed || item.completedActivityIds.length > 0)
    const legacyActivitiesToRetain = existing.filter(item => originalLegacyKeys.has(item.activityKey || ''))
    const currentActivitiesExisting = existing.filter(item => currentActivityKeys.has(item.activityKey || ''))
    console.log(JSON.stringify({
      action: applyRequested ? 'APPLY_DRAFT_ONLY' : 'PREVIEW_ONLY', classExists: !!klass,
      levelExists: !!level, lessonExists: !!lesson, activitiesExisting: existing.length,
      plannedActivities: STEPS.length, currentActivitiesExisting: currentActivitiesExisting.length,
      legacyActivitiesToRetain: legacyActivitiesToRetain.length, grade: 1, levelId: 'g01-l01',
      hasStudentAttempts: Boolean(hasStudentAttempts), hasSavedLessonProgress: Boolean(hasSavedLessonProgress),
      progressByActivity: existing.map(item => ({
        key: item.activityKey,
        order: item.order,
        attempts: attemptCounts.get(String(item._id)) || 0,
        completedStudents: completedCounts.get(String(item._id)) || 0,
      })),
      note: 'Keeps legacy Activity IDs and attempts for history, makes those activities optional, and adds a fresh required v2 activity set. No attempt/progress documents are deleted or rewritten; no publishing or KG changes.'
    }, null, 2))
    if (!applyRequested) return

    const actualClass = klass ?? await CurriculumClass.create({ grade: 1, name: 'Class 1', order: 1, status: 'draft' })
    const actualLevel = level ?? await Level.create({
      classId: actualClass._id, number: 1, term: 1, unitNumber: 1, order: 1,
      unitType: 'CONVERSATION', visualTheme: 'Two-Letter Word Meadow', title: 'Two-Letter Word Adventure', place: 'Two-Letter Word Meadow',
      description: 'Little words followed by the 2025 Balbharati Grade One My First Day theme.',
      learningObjectives: ['Recognise am, an, at, in, is, it, on, and up', 'Use the little words in short phrases', 'Speak walk and recognise school'],
      speakingGoals: ['Use a little word in a short phrase with Miss Julie', 'Say walk without harsh pronunciation grading'],
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
        introVideoKey: 'class1-g01-l01', introDurationSeconds: 90, introVideoReviewStatus: 'PRESENT_LOCAL_REVIEW_REQUIRED',
        lessonPlanRevision: 'first-day-bridge-v1',
        homework: 'Say I am Sam and I walk to school with someone at home.' },
      status: 'draft',
    })
    await Level.updateOne({ _id: actualLevel._id, curriculumVersion: VERSION, status: 'draft' }, { $set: {
      title: 'Little Words & My First Day', place: 'First Day Word Meadow', visualTheme: 'First Day Word Meadow',
      description: 'A welcome story, eight little English words, and an original speaking bridge to Balbharati Unit One 1.1.',
      learningObjectives: ['Recognise am, an, at, in, is, it, on, and up', 'Use the little words in short phrases', 'Speak walk and recognise school'],
      speakingGoals: ['Use a little word in a short phrase with Miss Julie', 'Say walk without harsh pronunciation grading'],
      sourceBook: 'English Balbharati Grade One (2025), Unit One 1.1 My First Day', sourcePages: [1],
    } })
    await Lesson.updateOne({ _id: actualLesson._id, status: 'draft', 'settings.talkoraDemoDraft': true }, { $set: {
      title: 'Little Words & My First Day', subtitle: 'Watch Miss Julie, learn eight little words, and talk about school',
      estimatedMinutes: 12,
      teacherIntroduction: 'Watch Miss Julie’s welcome story. We will learn am, an, at, in, is, it, on, and up, then talk about your first day at school.',
      'settings.lessonPlanRevision': 'first-day-little-words-v2',
      'settings.introVideoReviewStatus': 'PRESENT_LOCAL_REVIEW_REQUIRED',
      'settings.sourceBook': 'English Balbharati Grade One (2025), Unit One 1.1 My First Day',
      'settings.sourcePages': [1],
      'settings.syllabusVerified': false,
      'settings.audioProvider': 'ai4bharat',
      'settings.audioStorage': 's3',
      'settings.audioStatus': 'requires-human-review',
      'settings.homework': 'Say It is up and I walk to school with someone at home.',
    } })
    // Move the original activity records out of the student path without
    // changing their IDs; saved progress and attempt history still reference
    // those exact records. A fresh required v2 set can then use orders 1-10.
    let retained = 0
    for (const prior of legacyActivitiesToRetain) {
      const originalKey = prior.activityKey || ''
      const legacyName = originalKey.replace('class1-l01-', '')
      await Activity.updateOne({
        _id: prior._id, lessonId: actualLesson._id, curriculumVersion: VERSION,
        activityKey: originalKey, status: 'draft',
      }, { $set: {
        activityKey: `class1-l01-legacy-${legacyName}`,
        order: STEPS.length + prior.order,
      } })
      retained++
    }

    const existingCurrentKeys = new Set(currentActivitiesExisting.map(item => item.activityKey))
    let inserted = 0
    for (let index = 0; index < STEPS.length; index++) {
      const step = STEPS[index]
      const key = `class1-l01-v2-${step.key}`
      if (existingCurrentKeys.has(key)) continue
      const occupancy = await Activity.exists({ lessonId: actualLesson._id, order: index + 1 })
      if (occupancy) throw new Error(`Activity order ${index + 1} already occupied. Stop without overwriting.`)
      const activityValues = {
        lessonId: actualLesson._id, curriculumVersion: VERSION, activityKey: key,
        grade: 1, term: 1, unitNumber: 1, order: index + 1,
        type: step.type, stage: step.stage, title: step.title, prompt: step.prompt,
        instruction: step.prompt, target: step.target, modelSentence: step.target,
        choices: [...step.choices], ...(step.answer ? { answer: step.answer } : {}),
        expectedPatterns: step.allowMic && !step.aiEnabled ? [step.target] : step.target === 'at' ? ['at'] : [],
        keywords: index < 7 ? ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'] : ['walk', 'run', 'school', 'play', 'bell'],
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
        content: { audioKey: `class-01/level-01/${AUDIO_REVISION}/${step.key}.wav`,
          ...(step.key === 'find-school' ? { pictureMode: true,
            languageHint: 'स्कूल पहचानो / शाळा ओळखा',
          } : {}),
          teacherReviewRequired: true, pronunciationAssessment: 'not-verified' },
        core: true, required: true, status: 'draft',
      }
      await Activity.create(activityValues)
      inserted++
    }
    const currentRequiredCount = await Activity.countDocuments({
      lessonId: actualLesson._id, status: 'draft', curriculumVersion: VERSION,
      activityKey: /^class1-l01-v2-/, core: { $ne: false }, required: { $ne: false },
    })
    if (currentRequiredCount === STEPS.length) {
      await Activity.updateMany({
        lessonId: actualLesson._id, status: 'draft', curriculumVersion: VERSION,
        activityKey: /^class1-l01-legacy-/,
      }, { $set: { core: false, required: false } })
    }
    console.log(JSON.stringify({ status: 'DRAFT_PREPARED', inserted, legacyActivitiesRetained: retained, level: 'g01-l01',
      publicationState: 'draft-only', classStatus: actualClass.status,
      savedAttemptsPreserved: true, savedProgressDocumentsRewritten: false,
      next: 'Rerun the read-only readiness and audio audits; teacher-review the v2 narration before uploading it to S3.' }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}
main().catch(() => { console.error('Draft preparation failed. Check connectivity, uniqueness conflicts, and current records. No destructive cleanup was attempted.'); process.exitCode = 1 })
