/**
 * Additive, production-capable preparatory STAGING for Class 1 Level 1 v3.
 *
 * Read-only by default:
 *   pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-release.ts --verify-media
 *
 * A reviewed operator can intentionally stage the exact immutable ten scenes:
 *   TALKORA_CLASS1_RELEASE_DB_NAME=<actual connected Mongo database name>
 *   TALKORA_CLASS1_L01_STAGE_APPROVED=YES
 *   TALKORA_FIRST_DAY_INTRO_REVIEWED=YES
 *   TALKORA_FIRST_DAY_AUDIO_REVIEWED=YES
 *   TALKORA_FIRST_DAY_INTRO_URL=https://reviewed-first-day-intro.mp4
 *   pnpm exec tsx -r dotenv/config src/scripts/stage-class1-first-day-release.ts --apply
 *
 * STAGING NEVER PUBLISHES. The separate publish-class1-level1.ts transaction
 * requires school authorization, reviewed media and a passed live device test.
 * Never resets an old activity, attempt, lesson, student progress or class.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { Progress } from '../models/Progress'
import { FIRST_DAY_SCENES } from './class1-first-day-scenes'
import manifest from './class1-first-day-voice-v3.json'
import {
  CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_PARALLEL_REVISION,
} from '../services/class1-demo-access'
import { inspectClass1ReleaseMedia } from '../services/class1-release-media'
import {
  class1FirstDayStageBlockers, class1StageApprovalBlockers,
} from '../services/class1-release-stage-guard'
import { class1Level1ReleaseBlockers } from '../services/class1-level1-publication'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const verifyMedia = args.includes('--verify-media')
const INTRO_URL = String(process.env.TALKORA_FIRST_DAY_INTRO_URL || '').trim()
const AUDIO_PREFIX = 'class-01/level-01/v3/'

const reviewedLines = FIRST_DAY_SCENES.map(scene => {
  const line = manifest.lines.find(item => item.scene === scene.key && item.language === 'en-IN')
  if (!line || line.s3Key !== AUDIO_PREFIX + scene.key + '-en.wav' || !line.text?.trim())
    throw Error('FIRST_DAY_V3_AUDIO_MANIFEST_INCOMPLETE: ' + scene.key)
  return line
})

async function main() {
  if (args.some(arg => !['--apply', '--verify-media'].includes(arg)) || args.length > 1)
    throw Error('Use --verify-media for read-only checks, --apply for reviewed staging, or no arguments')
  await mongoose.connect(env.mongodbUri, { autoIndex: false, serverSelectionTimeoutMS: 10_000 })
  try {
    const database = mongoose.connection.db?.databaseName || ''
    if (!database) throw Error('Mongo database name is unavailable')
    const klass = await CurriculumClass.findOne({ grade: 1 }).lean()
    const level = klass && await Level.findOne({
      classId: klass._id, number: 1,
    }).lean()
    const lessons = level ? await Lesson.find({ levelId: level._id }).lean() : []
    const candidateCount = lessons.filter(item =>
      item.settings?.lessonPlanRevision === CLASS1_FIRST_DAY_PARALLEL_REVISION ||
      item.settings?.experienceId === 'g01-l01' &&
        item.settings?.lessonPlanRevision === 'class1-first-day-v3-installing').length
    const activeLessonCount = lessons.filter(item => item.status === 'active').length
    const legacyCompleted = level ? await Progress.countDocuments({
      classId: klass!._id,
      levels: { $elemMatch: { levelId: level._id, status: 'completed' } },
    }) : 0
    const blockers = class1FirstDayStageBlockers({
      existingLevel: level, existingV3Count: candidateCount,
      activeLessonCount, completedLegacyCount: legacyCompleted,
    })
    const approvals = class1StageApprovalBlockers({
      database,
      expectedDatabase: process.env.TALKORA_CLASS1_RELEASE_DB_NAME,
      stage: process.env.TALKORA_CLASS1_L01_STAGE_APPROVED,
      intro: process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED,
      audio: process.env.TALKORA_FIRST_DAY_AUDIO_REVIEWED,
    })
    const media = verifyMedia || apply ? await inspectClass1ReleaseMedia(INTRO_URL) : null
    console.log(JSON.stringify({
      level: 'g01-l01',
      action: apply ? 'STAGE_APPLY_REQUEST' : verifyMedia ? 'READ_ONLY_MEDIA_PREFLIGHT' : 'READ_ONLY_PREFLIGHT',
      existingClass: Boolean(klass), existingLevel: Boolean(level),
      classStatus: klass?.status || null, levelStatus: level?.status || null,
      levelAvailability: level?.availability || null,
      existingLessons: lessons.length, firstDayV3Candidates: candidateCount,
      competingActiveLessons: activeLessonCount, completedLegacyLevelProgress: legacyCompleted,
      scenesExpected: FIRST_DAY_SCENES.length,
      blockers: [...blockers, ...(media?.blockers || [])],
      approvalsMissing: approvals,
      media: media ? {
        verified: media.blockers.length === 0, introBytes: media.introBytes,
        audioReady: media.checkedAudioCount, audioRequired: media.requiredAudioCount,
      } : { verified: false, next: 'Use --verify-media for remote asset checks' },
      next: 'Staging keeps all records as drafts. After independent school/device approval, use publish-class1-level1.ts --verify-media, then --apply.',
    }, null, 2))
    if (!apply) return
    if (blockers.length || approvals.length || !media || media.blockers.length)
      throw Error('FIRST_DAY_STAGING_BLOCKED: resolve reported blockers and approvals; no database writes')

    // Nothing may change from the verified read to the transaction. These
    // queries and writes run sequentially; no Promise.all inside a session.
    let stagedLessonId = ''
    await mongoose.connection.transaction(async session => {
      let currentClass = await CurriculumClass.findOne({ grade: 1 }).session(session)
      let currentLevel = currentClass
        ? await Level.findOne({ classId: currentClass._id, number: 1 }).session(session)
        : null
      const currentLessons = currentLevel
        ? await Lesson.find({ levelId: currentLevel._id }).session(session)
        : []
      const previousCompleted = currentLevel && currentClass
        ? await Progress.countDocuments({
            classId: currentClass._id,
            levels: { $elemMatch: { levelId: currentLevel._id, status: 'completed' } },
          }).session(session)
        : 0
      const freshBlockers = class1FirstDayStageBlockers({
        existingLevel: currentLevel,
        existingV3Count: currentLessons.filter(item =>
          item.settings?.lessonPlanRevision === CLASS1_FIRST_DAY_PARALLEL_REVISION ||
          item.settings?.lessonPlanRevision === 'class1-first-day-v3-installing').length,
        activeLessonCount: currentLessons.filter(item => item.status === 'active').length,
        completedLegacyCount: previousCompleted || 0,
      })
      if (freshBlockers.length) throw Error('Class 1 records changed before staging: ' + freshBlockers.join(', '))
      if (!currentClass) {
        const created = await CurriculumClass.create([{
          grade: 1, name: 'Class 1', order: 1, status: 'draft',
          description: 'English Balbharati Standard One',
        }], { session })
        currentClass = created[0]
      }
      if (!currentLevel) {
        const created = await Level.create([{
          classId: currentClass._id, number: 1, order: 1, term: 1, unitNumber: 1,
          unitType: 'CONVERSATION', visualTheme: 'First Day Meadow',
          status: 'draft', availability: 'UPCOMING', curriculumVersion: CLASS1_DEMO_VERSION,
          title: 'My First Day — School Adventure', place: 'School Garden',
          sourceBook: 'English Balbharati Grade One (2025; 2026 reprint), Unit 1.1 My First Day',
          sourcePages: [1],
          learningObjectives: ['Understand and speak school-action words in English'],
          speakingGoals: ['Speak about school, skip, run, walk, grin, bell, jump, play and Grade One'],
        }], { session })
        currentLevel = created[0]
      }

      const createdLesson = await Lesson.create([{
        levelId: currentLevel._id,
        title: 'My First Day — School Adventure',
        subtitle: 'English Balbharati 1.1 · Interactive speaking story',
        teacherIntroduction: 'Miss Julie teaches school, skip, run, walk, grin, bell, jump and play.',
        order: 0, estimatedMinutes: 20, xpReward: 0, status: 'draft',
        settings: {
          talkoraDemoDraft: true, experienceId: 'g01-l01',
          lessonPlanRevision: CLASS1_FIRST_DAY_PARALLEL_REVISION,
          introVideoUrl: INTRO_URL,
          homework: 'Tell someone at home: I can walk, I can play, and I am in Grade One.',
          syllabusVerified: false,
        },
      }], { session })
      const created = createdLesson[0]
      const records = FIRST_DAY_SCENES.map((scene, i) => ({
        lessonId: created._id, curriculumVersion: CLASS1_DEMO_VERSION,
        activityKey: 'class1-l01-v3-' + scene.key,
        grade: 1, term: 1, unitNumber: 1, order: i + 1,
        title: scene.title, prompt: reviewedLines[i].text,
        teacherPrompt: reviewedLines[i].text, target: scene.focus.toLowerCase(),
        modelSentence: scene.sentence, instruction: scene.prompt, type: 'CONVERSATION' as const,
        stage: 'INTERACT' as const, expectedPatterns: [], keywords: [...scene.vocabulary],
        choices: [], difficulty: 'easy' as const, xp: 0, estimatedSeconds: 90,
        voiceEnabled: true, aiEnabled: true, allowMic: true, allowOptions: false,
        repeatRequired: false, maxConversationTurns: 4,
        conversationGoal: { requiredConcepts: ['first_day_english_attempt'], minTurns: 2, maxTurns: 4 },
        metadata: {
          conversationMode: 'OPEN', digitalType: 'FIRST_DAY_VOICE_SCENE',
          sceneKey: scene.key, allowedVocabulary: [...scene.vocabulary],
          languageSupport: ['English', 'Hindi', 'Marathi'],
        },
        source: {
          sourceType: 'SYLLABUS' as const,
          pdf: 'https://ebooks.ebalbharati.in/pdfs/103050001.pdf',
          pageStart: 1, pageEnd: 1,
          label: 'Original companion to Grade One English Balbharati Unit 1.1 My First Day',
        },
        content: { audioKey: reviewedLines[i].s3Key, noTextbookArtwork: true, noTouchChoices: true },
        core: true, required: true, status: 'draft' as const,
      }))
      await Activity.insertMany(records, { session, ordered: true })
      const stored = await Activity.find({ lessonId: created._id }).sort({ order: 1 }).session(session).lean()
      const valid = class1Level1ReleaseBlockers({
        grade: 1, classroomStatus: currentClass.status,
        level: {
          number: currentLevel.number, status: currentLevel.status,
          availability: currentLevel.availability,
          curriculumVersion: currentLevel.curriculumVersion,
        },
        lesson: { status: created.status, settings: created.settings },
        activities: stored.map(item => ({
          activityKey: item.activityKey, status: item.status, type: item.type,
          curriculumVersion: item.curriculumVersion, aiEnabled: item.aiEnabled,
          voiceEnabled: item.voiceEnabled, allowMic: item.allowMic,
          core: item.core, required: item.required, content: item.content,
        })),
        otherActiveLessons: 0, savedCompletedLevels: 0,
      })
      if (valid.length) throw Error('STAGED_V3_INTEGRITY_FAILED: ' + valid.join(', '))
      stagedLessonId = created._id.toString()
    })
    console.log(JSON.stringify({
      status: 'FIRST_DAY_V3_STAGED_DRAFT_ONLY',
      level: 'g01-l01', sceneCount: FIRST_DAY_SCENES.length,
      lessonId: stagedLessonId, studentHistoryRewritten: false,
      studentPlayabilityChanged: false,
      next: 'Run publish-class1-level1.ts --verify-media; obtain final school/device approvals before --apply',
    }))
  } finally {
    await mongoose.disconnect()
  }
}
main().catch(error => {
  console.error('FIRST_DAY_V3_STAGE_FAILED:', error instanceof Error ? error.message : 'Unknown')
  process.exitCode = 1
})
