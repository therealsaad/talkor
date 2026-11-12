/**
 * Idempotently finalizes only Talkora's owned Class 1 Level 1 draft.
 *
 * Preview: pnpm exec tsx src/scripts/finalize-class1-l01-demo.ts
 * Apply:   pnpm exec tsx src/scripts/finalize-class1-l01-demo.ts --apply
 *
 * This script never creates, deletes, publishes, or renumbers activities.
 */
import { connectDatabase, disconnectDatabase } from '../config/db'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Progress } from '../models/Progress'
import { CLASS1_DEMO_ACTIVITY_PREFIX, CLASS1_DEMO_VERSION } from '../services/class1-demo-access'

const applyRequested = process.argv.includes('--apply')
const expectedKeys = [
  'listen-am',
  'build-an',
  'listen-at',
  'listen-in',
  'use-on',
  'it-is-up',
  'review-little-words',
  'say-walk',
  'find-school',
  'school-talk',
].map((key) => `${CLASS1_DEMO_ACTIVITY_PREFIX}v2-${key}`)

async function main() {
  if (applyRequested && process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to modify a demonstration draft in production.')
  }

  await connectDatabase()
  try {
    const classroom = await CurriculumClass.findOne({ grade: 1, status: 'draft' }).lean()
    if (!classroom) throw new Error('The draft Class 1 curriculum does not exist.')

    const level = await Level.findOne({
      classId: classroom._id,
      number: 1,
      curriculumVersion: CLASS1_DEMO_VERSION,
      status: 'draft',
      availability: 'UPCOMING',
    })
    if (!level) throw new Error('The owned Class 1 Level 1 demo draft was not found.')

    const lesson = await Lesson.findOne({
      levelId: level._id,
      status: 'draft',
      'settings.talkoraDemoDraft': true,
    })
    if (!lesson) throw new Error('The approved Class 1 demo lesson marker is missing.')

    const activities = await Activity.find({
      lessonId: lesson._id,
      status: 'draft',
      core: { $ne: false },
      required: { $ne: false },
    }).sort({ order: 1 })
    const actualKeys = activities.map((item) => item.activityKey || '')
    if (activities.length !== expectedKeys.length ||
        expectedKeys.some((key) => !actualKeys.includes(key)) ||
        activities.some((item) => item.status !== 'draft' || item.curriculumVersion !== CLASS1_DEMO_VERSION)) {
      throw new Error('The ten owned draft activities do not match the expected manifest; no changes were made.')
    }

    const guided = activities.find((item) => item.activityKey === `${CLASS1_DEMO_ACTIVITY_PREFIX}v2-review-little-words`)
    if (!guided) throw new Error('The guided Class 1 activity is missing.')

    if (applyRequested) {
      const [attempts, savedProgress] = await Promise.all([
        ActivityAttempt.exists({ activityId: guided._id }),
        Progress.exists({
          classId: classroom._id,
          levels: { $elemMatch: {
            levelId: level._id,
            lessons: { $elemMatch: { lessonId: lesson._id, completedActivityIds: guided._id } },
          } },
        }),
      ])
      if (attempts || savedProgress) {
        throw new Error('Existing student progress needs a reviewed migration before rewriting lesson metadata.')
      }
    }

    console.log(JSON.stringify({
      action: applyRequested ? 'APPLY_OWNED_DRAFT_UPDATE' : 'PREVIEW_ONLY',
      levelId: 'g01-l01',
      activities: activities.length,
      activityKeys: actualKeys,
      currentGuidedActivity: { type: guided.type, stage: guided.stage, aiEnabled: guided.aiEnabled },
      plannedGuidedActivity: { type: 'CONVERSATION', stage: 'INTERACT', aiEnabled: true, turns: 2, words: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'] },
      publicationState: { class: classroom.status, level: level.status, lesson: lesson.status },
    }, null, 2))
    if (!applyRequested) return

    await Level.updateOne({ _id: level._id, curriculumVersion: CLASS1_DEMO_VERSION, status: 'draft' }, {
      $set: {
        title: 'Little Words & My First Day',
        place: 'First Day Word Meadow',
        visualTheme: 'First Day Word Meadow',
        description: 'A 90-second welcome story, tiny-word practice, and an original speaking bridge to Balbharati Unit One 1.1.',
        learningObjectives: [
          'Recognize and use am, an, at, in, is, it, on, and up',
          'Build short beginner phrases with the little words',
          'Say walk and recognize school from My First Day',
        ],
        speakingGoals: ['Use little words in a short phrase; say walk with supportive coaching'],
        sourceBook: 'English Balbharati Grade One (2025), Unit One 1.1 My First Day',
        sourcePages: [1],
      },
    })

    await Lesson.updateOne({ _id: lesson._id, status: 'draft', 'settings.talkoraDemoDraft': true }, {
      $set: {
        title: 'Little Words & My First Day',
        subtitle: 'Watch Miss Julie, learn eight little words, and talk about school',
        estimatedMinutes: 12,
        teacherIntroduction: 'Watch Miss Julie’s short welcome story. First we will practise little words. Then we will talk about your first day at school.',
        settings: {
          ...(lesson.settings || {}),
          talkoraDemoDraft: true,
          experienceId: 'g01-l01',
          frontendStudentPlayable: true,
          progressPersisted: true,
          introVideoKey: 'class1-g01-l01',
          introDurationSeconds: 90,
          introVideoReviewStatus: 'PRESENT_LOCAL_REVIEW_REQUIRED',
          lessonPlanRevision: 'first-day-little-words-v2',
          sourceBook: 'English Balbharati Grade One (2025), Unit One 1.1 My First Day',
          sourcePages: [1],
          syllabusVerified: false,
          audioProvider: 'ai4bharat',
          audioStorage: 's3',
          audioStatus: 'requires-human-review',
          homework: 'Say It is up and I walk to school with someone at home.',
        },
      },
    })

    await Activity.updateOne({
      _id: guided._id,
      activityKey: `${CLASS1_DEMO_ACTIVITY_PREFIX}v2-review-little-words`,
      curriculumVersion: CLASS1_DEMO_VERSION,
      status: 'draft',
    }, {
      $set: {
        title: 'Guided little-word talk with Miss Julie',
        type: 'CONVERSATION',
        stage: 'INTERACT',
        prompt: 'Practise am, an, at, in, is, it, on, and up with Miss Julie. She will help you say one short phrase.',
        instruction: 'Choose a little word and use it in a short phrase. Miss Julie will help you.',
        target: 'am, an, at, in, is, it, on, up',
        modelSentence: 'It is up.',
        choices: [],
        expectedPatterns: [],
        keywords: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'],
        aiEnabled: true,
        voiceEnabled: true,
        allowMic: true,
        allowOptions: false,
        repeatRequired: false,
        maxConversationTurns: 2,
        conversationGoal: { requiredConcepts: [], minTurns: 2, maxTurns: 2 },
        metadata: {
          conversationMode: 'OPEN',
          digitalType: 'GUIDED_WORD_TALK',
          allowedVocabulary: ['am', 'an', 'at', 'in', 'is', 'it', 'on', 'up'],
        },
        content: { audioKey: 'class-01/level-01/v2/review-little-words.wav', audioStatus: 'review-required', teacherReviewRequired: true, pronunciationAssessment: 'not-verified' },
      },
      $unset: { answer: 1, answerConfig: 1 },
    })

    console.log(JSON.stringify({
      status: 'CLASS1_DEMO_FINALIZED',
      activities: expectedKeys.length,
      published: false,
      duplicated: false,
      qwenActivityKey: `${CLASS1_DEMO_ACTIVITY_PREFIX}v2-review-little-words`,
    }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error: unknown) => {
  console.error('Class 1 demo finalization failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
