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
import { CLASS1_DEMO_ACTIVITY_PREFIX, CLASS1_DEMO_VERSION } from '../services/class1-demo-access'

const applyRequested = process.argv.includes('--apply')
const expectedKeys = [
  'listen-at',
  'build-at',
  'listen-in',
  'build-in',
  'look-at-me',
  'i-am-sam',
  'repeat-at',
].map((key) => `${CLASS1_DEMO_ACTIVITY_PREFIX}${key}`)

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

    const activities = await Activity.find({ lessonId: lesson._id }).sort({ order: 1 })
    const actualKeys = activities.map((item) => item.activityKey || '')
    if (activities.length !== expectedKeys.length ||
        expectedKeys.some((key) => !actualKeys.includes(key)) ||
        activities.some((item) => item.status !== 'draft' || item.curriculumVersion !== CLASS1_DEMO_VERSION)) {
      throw new Error('The seven owned draft activities do not match the expected manifest; no changes were made.')
    }

    const guided = activities.find((item) => item.activityKey === `${CLASS1_DEMO_ACTIVITY_PREFIX}repeat-at`)
    if (!guided) throw new Error('The guided Class 1 activity is missing.')

    console.log(JSON.stringify({
      action: applyRequested ? 'APPLY_OWNED_DRAFT_UPDATE' : 'PREVIEW_ONLY',
      levelId: 'g01-l01',
      activities: activities.length,
      activityKeys: actualKeys,
      currentGuidedActivity: { type: guided.type, stage: guided.stage, aiEnabled: guided.aiEnabled },
      plannedGuidedActivity: { type: 'CONVERSATION', stage: 'INTERACT', aiEnabled: true, turns: 2 },
      publicationState: { class: classroom.status, level: level.status, lesson: lesson.status },
    }, null, 2))
    if (!applyRequested) return

    await Level.updateOne({ _id: level._id, curriculumVersion: CLASS1_DEMO_VERSION, status: 'draft' }, {
      $set: {
        title: 'Two-Letter Word Adventure',
        place: 'Two-Letter Word Meadow',
        visualTheme: 'Two-Letter Word Meadow',
        description: 'Listen, recognize, build, say, and use beginner two-letter English words.',
        learningObjectives: [
          'Recognize and build at and in',
          'Use at and am in short beginner phrases',
        ],
        speakingGoals: ['Say at and complete a two-turn guided word conversation with Miss Julie'],
      },
    })

    await Lesson.updateOne({ _id: lesson._id, status: 'draft', 'settings.talkoraDemoDraft': true }, {
      $set: {
        title: 'Two-Letter Word Adventure',
        subtitle: 'Listen, build, say, and use small words',
        teacherIntroduction: 'We will listen, build, read, and say small English words.',
        settings: {
          ...(lesson.settings || {}),
          talkoraDemoDraft: true,
          experienceId: 'g01-l01',
          frontendStudentPlayable: true,
          progressPersisted: true,
          homework: 'Say I am Sam and Look at me with someone at home.',
        },
      },
    })

    await Activity.updateOne({
      _id: guided._id,
      activityKey: `${CLASS1_DEMO_ACTIVITY_PREFIX}repeat-at`,
      curriculumVersion: CLASS1_DEMO_VERSION,
      status: 'draft',
    }, {
      $set: {
        title: 'Guided word talk with Miss Julie',
        type: 'CONVERSATION',
        stage: 'INTERACT',
        prompt: 'Say at. Then use the word at with Miss Julie.',
        instruction: 'Say at. Miss Julie will ask one small question at a time.',
        target: 'at',
        modelSentence: 'Look at me.',
        choices: [],
        expectedPatterns: ['at'],
        keywords: ['at', 'look', 'me'],
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
        content: { audioStatus: 'dynamic-azure', teacherReviewRequired: true, pronunciationAssessment: 'not-verified' },
      },
      $unset: { answer: 1, answerConfig: 1 },
    })

    console.log(JSON.stringify({
      status: 'CLASS1_DEMO_FINALIZED',
      activities: 7,
      published: false,
      duplicated: false,
      qwenActivityKey: `${CLASS1_DEMO_ACTIVITY_PREFIX}repeat-at`,
    }, null, 2))
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error: unknown) => {
  console.error('Class 1 demo finalization failed:', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
