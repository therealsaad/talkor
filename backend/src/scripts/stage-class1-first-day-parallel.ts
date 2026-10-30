/**
 * Additive Class 1 Balbharati 1.1 First Day installer.
 * - Default is a read-only preview. Only a developer can opt into --apply.
 * - Stages ONE new ten-scene lesson alongside the old v2 lesson.
 * - Never modifies/deletes prior activity IDs, attempts, conversations or
 *   progress, even in the existing MongoDB "test" database.
 * - No school/teacher admin permission or publication flow is added.
 * - Fail closed if approved English audio or the real 90s intro is absent.
 *
 * cd backend
 * pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-parallel.ts
 * $env:TALKORA_CLASS1_V3_STAGE='YES'
 * pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-parallel.ts --apply
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { ActivityAttempt } from '../models/ActivityAttempt'
import { Conversation } from '../models/Conversation'
import { Progress } from '../models/Progress'
import { S3Service } from '../services/S3Service'
import {
  CLASS1_DEMO_VERSION, CLASS1_DEMO_LESSON_FILTER,
  CLASS1_FIRST_DAY_PARALLEL_REVISION,
} from '../services/class1-demo-access'
import { FIRST_DAY_SCENES } from './class1-first-day-scenes'
import manifest from './class1-first-day-voice-v3.json'
import { isRealFirstDayIntroUrl } from './class1-first-day-intro-url'

const APPLY = process.argv.includes('--apply')
const STAGING_REVISION = 'class1-first-day-v3-installing'
const AUDIO_PREFIX = 'class-01/level-01/v3/'
const approved = FIRST_DAY_SCENES.map(scene => {
  const line = manifest.lines.find(item => item.scene === scene.key && item.language === 'en-IN')
  if (!line || line.s3Key !== AUDIO_PREFIX + scene.key + '-en.wav')
    throw new Error('FIRST_DAY_MANIFEST_MISMATCH: ' + scene.key)
  return line
})

async function main() {
  if (process.argv.slice(2).some(arg => arg !== '--apply'))
    throw new Error('Only --apply is accepted; omit it for a read-only preview')
  if (process.env.NODE_ENV !== 'development')
    throw new Error('This isolated demo installer only runs in development')
  if (APPLY && process.env.TALKORA_CLASS1_V3_STAGE !== 'YES')
    throw new Error('Set TALKORA_CLASS1_V3_STAGE=YES for an explicit additive database write')
  if (APPLY && (process.env.TALKORA_FIRST_DAY_AUDIO_REVIEWED !== 'YES'
      || process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED !== 'YES'))
    throw new Error('Review the actual Priya clips and First Day intro before staging; no teacher/school dashboard action is required')

  // The intro is provided with the lesson, not via a Next.js rebuild.
  const introUrl = (process.env.TALKORA_FIRST_DAY_INTRO_URL || '').trim()
  if (APPLY && !isRealFirstDayIntroUrl(introUrl))
    throw new Error('Provide the reviewed HTTPS First Day-only 90-second video as TALKORA_FIRST_DAY_INTRO_URL')

  await mongoose.connect(env.mongodbUri, { autoIndex: false, serverSelectionTimeoutMS: 10000 })
  try {
    if (mongoose.connection.db?.databaseName !== 'test')
      throw new Error('REFUSE: only the local MongoDB database exactly named "test" is supported')

    const klass = await CurriculumClass.findOne({
      grade: 1, status: { $in: ['draft', 'active'] },
    }).lean()
    const level = klass && await Level.findOne({
      classId: klass._id, number: 1, curriculumVersion: CLASS1_DEMO_VERSION,
      status: 'draft', availability: 'UPCOMING',
    }).lean()
    if (!level) throw new Error('Canonical Class 1 g01-l01 demo level not found; no records changed')

    const lessons = await Lesson.find({
      levelId: level._id, ...CLASS1_DEMO_LESSON_FILTER,
    }).lean()
    const active = lessons.filter(l => l.settings?.lessonPlanRevision === CLASS1_FIRST_DAY_PARALLEL_REVISION)
    const incomplete = lessons.filter(l => l.settings?.lessonPlanRevision === STAGING_REVISION)
    if (active.length > 1 || incomplete.length > 1) throw new Error('Duplicate First Day installations; inspect database')
    const oldIds = lessons.filter(l => ![STAGING_REVISION, CLASS1_FIRST_DAY_PARALLEL_REVISION].includes(
      String(l.settings?.lessonPlanRevision || ''),
    )).map(l => l._id)
    if (!oldIds.length) throw new Error('No existing Class 1 draft lesson to preserve')
    const oldActivityIds = (await Activity.find({ lessonId: { $in: oldIds } })
      .select('_id').lean()).map(x => x._id)
    const [oldActivities, oldAttempts, oldConversations, oldProgressDocs] = await Promise.all([
      Activity.countDocuments({ lessonId: { $in: oldIds } }),
      ActivityAttempt.countDocuments({ activityId: { $in: oldActivityIds } }),
      Conversation.countDocuments({ lessonId: { $in: oldIds } }),
      Progress.countDocuments({ classId: level.classId }),
    ])
    const installed = active.length === 1
      ? await Activity.find({
          lessonId: active[0]._id, activityKey: /^class1-l01-v3-/,
        }).sort('order').lean()
      : []
    const ready = installed.length === 10 &&
      installed.every((a, i) => a.activityKey === 'class1-l01-v3-' + FIRST_DAY_SCENES[i].key &&
        a.type === 'CONVERSATION' && a.allowMic === true && a.aiEnabled === true &&
        a.content?.audioKey === approved[i].s3Key)
    console.log(JSON.stringify({
      status: ready ? 'ALREADY_STAGED' : APPLY ? 'STAGE_REQUEST' : 'PREVIEW_ONLY',
      database: 'test', firstDayScenes: FIRST_DAY_SCENES.length,
      oldLessonCount: oldIds.length, oldActivities, oldAttempts, oldConversations,
      oldProgressDocs, existingFirstDay: installed.length,
      partialInstallExists: incomplete.length > 0,
      existingStudentRecordsWillBeUpdated: false,
      requiredAudioKeys: approved.map(x => x.s3Key),
      introUrlPresent: Boolean(introUrl),
      introUrlFormatValid: isRealFirstDayIntroUrl(introUrl),
      note: 'New v3 lesson is independent. Student login remains required; no teacher/school permission screen.',
    }, null, 2))
    if (!APPLY) return
    if (ready) return
    if (active.length || incomplete.length)
      throw new Error('PARTIAL_FIRST_DAY_INSTALL: inspect incomplete v3 separately; never auto-delete lesson data')

    // Read-only remote existence checks BEFORE ANY database write.
    for (const item of approved) {
      const head = await S3Service.headAudio(item.s3Key)
      if (!head || !head.contentLength || head.contentLength < 256)
        throw new Error('MISSING_REVIEWED_PRIYA_AUDIO: ' + item.s3Key)
    }

    // Do not mutate old lessons or change their order, IDs, attempts or progress.
    // Mark this new record "installing" until exactly ten scenes exist.
    const newLesson = await Lesson.create({
      levelId: level._id,
      title: 'My First Day — School Adventure',
      subtitle: 'English Balbharati 1.1 · Interactive speaking story',
      teacherIntroduction: 'Miss Julie teaches school, skip, run, walk, grin, bell, jump and play through short spoken games.',
      order: 0, estimatedMinutes: 20, xpReward: 0,
      settings: {
        talkoraDemoDraft: true, experienceId: 'g01-l01',
        lessonPlanRevision: STAGING_REVISION,
        introVideoUrl: introUrl,
        homework: 'Tell someone at home: I can walk, I can play, and I am in Grade One.',
        syllabusVerified: false,
      },
      status: 'draft',
    })
    // Each new activity has its own ObjectId and normal authenticated
    // voice-session/progress path. The original v2 activities remain intact.
    const activities = FIRST_DAY_SCENES.map((scene, i) => ({
      lessonId: newLesson._id, curriculumVersion: CLASS1_DEMO_VERSION,
      activityKey: 'class1-l01-v3-' + scene.key,
      grade: 1, term: 1, unitNumber: 1, order: i + 1,
      title: scene.title, prompt: approved[i].text,
      teacherPrompt: approved[i].text,
      target: scene.focus.toLowerCase(), modelSentence: scene.sentence,
      instruction: scene.prompt, type: 'CONVERSATION' as const,
      stage: 'INTERACT' as const, expectedPatterns: [], keywords: [...scene.vocabulary],
      choices: [], difficulty: 'easy' as const, xp: 0,
      estimatedSeconds: 90, voiceEnabled: true, aiEnabled: true,
      allowMic: true, allowOptions: false, repeatRequired: false,
      maxConversationTurns: 4,
      conversationGoal: { requiredConcepts: ['first_day_english_attempt'], minTurns: 2, maxTurns: 4 },
      metadata: { conversationMode: 'OPEN', digitalType: 'FIRST_DAY_VOICE_SCENE',
        sceneKey: scene.key, allowedVocabulary: [...scene.vocabulary],
        languageSupport: ['English', 'Hindi', 'Marathi'] },
      source: { sourceType: 'SYLLABUS' as const,
        pdf: 'https://ebooks.ebalbharati.in/pdfs/103050001.pdf',
        pageStart: 1, pageEnd: 1,
        label: 'Original companion to Grade One English Balbharati Unit 1.1 My First Day' },
      content: { audioKey: approved[i].s3Key, noTextbookArtwork: true, noTouchChoices: true },
      core: true, required: true, status: 'draft' as const,
    }))
    await Activity.insertMany(activities, { ordered: true })
    const stored = await Activity.find({ lessonId: newLesson._id, activityKey: /^class1-l01-v3-/ }).sort('order').lean()
    if (stored.length !== 10 || stored.some((a, i) => a.activityKey !== activities[i].activityKey))
      throw new Error('PARTIAL_FIRST_DAY_INSTALL: no activation; inspect new staging record')
    await Lesson.updateOne(
      { _id: newLesson._id, 'settings.lessonPlanRevision': STAGING_REVISION },
      { $set: { 'settings.lessonPlanRevision': CLASS1_FIRST_DAY_PARALLEL_REVISION } },
    )
    console.log(JSON.stringify({
      status: 'FIRST_DAY_V3_STAGED', lessonId: newLesson._id.toString(),
      sceneCount: 10, oldStudentRecordsChanged: false,
      next: 'Reload existing authenticated Class 1 student lesson URL or /student/continue',
    }, null, 2))
  } finally {
    await mongoose.disconnect()
  }
}
main().catch(error => {
  console.error('CLASS1_V3_STAGE_FAILED:', error instanceof Error ? error.message : 'Unknown error')
  process.exitCode = 1
})
