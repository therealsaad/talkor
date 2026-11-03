/**
 * Publish the existing Class 1 "My First Day" ten-scene lesson, not a map flag.
 *
 * Read-only preflight:
 *   cd backend
 *   pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts
 *
 * Explicit operator-controlled activation (after actual teacher/device signoff):
 *   TALKORA_CLASS1_L01_RELEASE_APPROVED=YES
 *   TALKORA_FIRST_DAY_INTRO_REVIEWED=YES
 *   TALKORA_FIRST_DAY_AUDIO_REVIEWED=YES
 *   TALKORA_CLASS1_L01_DEVICE_TESTED=YES
 *   pnpm exec tsx -r dotenv/config src/scripts/publish-class1-level1.ts --apply
 *
 * Never includes passwords, identities or transcripts in its output. Requires
 * transactional MongoDB (replica set/Atlas). Does not seed, reset, delete,
 * migrate completed attempts, bypass future levels, or grant new XP.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { Progress } from '../models/Progress'
import { S3Service } from '../services/S3Service'
import { CLASS1_DEMO_VERSION, CLASS1_FIRST_DAY_PARALLEL_REVISION } from '../services/class1-demo-access'
import {
  class1Level1ReleaseBlockers, class1ReleaseApprovalBlockers, requiredClass1AudioKeys,
  type Class1ReleaseSnapshot,
} from '../services/class1-level1-publication'

async function main() {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--apply') || args.length > 1) throw Error('Only --apply or no arguments supported')
  const apply = args.includes('--apply')
  await mongoose.connect(env.mongodbUri, { autoIndex: false, serverSelectionTimeoutMS: 10000 })
  try {
    const classroom = await CurriculumClass.findOne({ grade: 1 }).lean()
    if (!classroom) throw Error('No Class 1 curriculum class exists; nothing published')
    const level = await Level.findOne({
      classId: classroom._id, number: 1, curriculumVersion: CLASS1_DEMO_VERSION,
    }).lean()
    if (!level) throw Error('No matching canonical g01-l01 level; nothing published')
    const lessons = await Lesson.find({ levelId: level._id }).lean()
    const selected = lessons.find(lesson =>
      lesson.settings?.lessonPlanRevision === CLASS1_FIRST_DAY_PARALLEL_REVISION &&
      lesson.settings?.experienceId === 'g01-l01')
    if (!selected) throw Error('Reviewed ten-scene First Day v3 not installed; nothing published')
    const activities = await Activity.find({ lessonId: selected._id }).sort({ order: 1 }).lean()
    const otherActiveLessons = lessons.filter(item => String(item._id) !== String(selected._id) &&
      item.status === 'active').length
    const savedCompletedLevels = await Progress.countDocuments({
      classId: classroom._id, levels: { $elemMatch: { levelId: level._id, status: 'completed' } },
    })
    const alreadyPublished = classroom.status === 'active' &&
      level.status === 'active' && level.availability === 'PUBLISHED' &&
      selected.status === 'active' && activities.length === 10 &&
      activities.every(item => item.status === 'active') && otherActiveLessons === 0
    const snapshot: Class1ReleaseSnapshot = {
      grade: classroom.grade, classroomStatus: classroom.status,
      level: { number: level.number, status: level.status, availability: level.availability,
        curriculumVersion: level.curriculumVersion },
      lesson: { status: selected.status, settings: selected.settings },
      activities: activities.map(item => ({
        activityKey: item.activityKey, status: item.status, type: item.type,
        curriculumVersion: item.curriculumVersion, aiEnabled: item.aiEnabled,
        voiceEnabled: item.voiceEnabled, allowMic: item.allowMic, core: item.core,
        required: item.required, content: item.content,
      })),
      otherActiveLessons, savedCompletedLevels,
    }
    const blockers = alreadyPublished ? [] : class1Level1ReleaseBlockers(snapshot)
    const approvalBlockers = class1ReleaseApprovalBlockers({
      release: process.env.TALKORA_CLASS1_L01_RELEASE_APPROVED,
      intro: process.env.TALKORA_FIRST_DAY_INTRO_REVIEWED,
      audio: process.env.TALKORA_FIRST_DAY_AUDIO_REVIEWED,
      device: process.env.TALKORA_CLASS1_L01_DEVICE_TESTED,
    })
    const introUrl = String(selected.settings?.introVideoUrl || '')
    if (!/^https:\/\//.test(introUrl)) blockers.push('REVIEWED_HTTPS_INTRO_NOT_ATTACHED_TO_LESSON')
    console.log(JSON.stringify({
      level: 'g01-l01', action: alreadyPublished ? 'ALREADY_PUBLISHED' : apply ? 'APPLY_REQUEST' : 'READ_ONLY_PREFLIGHT',
      current: { classroom: classroom.status, level: level.status, availability: level.availability,
        lesson: selected.status, activeScenes: activities.filter(item => item.status === 'active').length,
        draftScenes: activities.filter(item => item.status === 'draft').length },
      selectedRevision: CLASS1_FIRST_DAY_PARALLEL_REVISION,
      expectedScenes: 10, otherActiveLessons, savedCompletedLevels,
      blockers, pendingApprovals: approvalBlockers,
      next: 'Student PIN -> /student/continue -> first unfinished First Day scene; 2–10 remain governed by their own publication gates.',
    }, null, 2))
    if (!apply || alreadyPublished) return
    if (blockers.length || approvalBlockers.length)
      throw Error('Publication blocked. Resolve the listed prerequisites; no database records changed.')

    // Live media checks run BEFORE touching the curriculum.
    const response = await fetch(introUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) })
    const size = Number(response.headers.get('content-length'))
    if (!response.ok || !/video\/(mp4|webm)/i.test(response.headers.get('content-type') || '') ||
        !Number.isFinite(size) || size < 1_000_000)
      throw Error('Reviewed First Day video is unavailable or has an invalid media response')
    for (const key of requiredClass1AudioKeys()) {
      const media = await S3Service.headAudio(key)
      if (!media || !media.contentLength || media.contentLength < 256 ||
          !/^audio\/(wav|x-wav)/.test(media.contentType || '')) {
        throw Error('Missing approved First Day S3 narration: ' + key)
      }
    }

    // Transaction is intentionally mandatory: partial releases must not make
    // a staff map look published while student activities are still drafts.
    await mongoose.connection.transaction(async session => {
      const [liveLevel, liveLesson, liveActivities, liveOther, liveCompleted] = await Promise.all([
        Level.findById(level._id).session(session).lean(),
        Lesson.findById(selected._id).session(session).lean(),
        Activity.find({ lessonId: selected._id }).sort({ order: 1 }).session(session).lean(),
        Lesson.countDocuments({ levelId: level._id, status: 'active', _id: { $ne: selected._id } }).session(session),
        Progress.countDocuments({ classId: classroom._id,
          levels: { $elemMatch: { levelId: level._id, status: 'completed' } } }).session(session),
      ])
      if (!liveLevel || !liveLesson) throw Error('First Day records changed before release')
      const recheck = class1Level1ReleaseBlockers({
        ...snapshot,
        level: { number: liveLevel.number, status: liveLevel.status,
          availability: liveLevel.availability, curriculumVersion: liveLevel.curriculumVersion },
        lesson: { status: liveLesson.status, settings: liveLesson.settings },
        activities: liveActivities.map(item => ({
          activityKey: item.activityKey, status: item.status, type: item.type,
          curriculumVersion: item.curriculumVersion, aiEnabled: item.aiEnabled,
          voiceEnabled: item.voiceEnabled, allowMic: item.allowMic,
          core: item.core, required: item.required, content: item.content,
        })),
        otherActiveLessons: liveOther, savedCompletedLevels: liveCompleted,
      })
      if (recheck.length) throw Error('First Day readiness changed; aborting transaction')
      const activityWrite = await Activity.updateMany({
        lessonId: selected._id, status: 'draft', curriculumVersion: CLASS1_DEMO_VERSION,
        activityKey: /^class1-l01-v3-/,
      }, { $set: { status: 'active' } }, { session })
      if (activityWrite.modifiedCount !== 10) throw Error('Could not activate exactly ten First Day activities')
      const lessonWrite = await Lesson.updateOne({
        _id: selected._id, status: 'draft',
        'settings.lessonPlanRevision': CLASS1_FIRST_DAY_PARALLEL_REVISION,
      }, { $set: { status: 'active', 'settings.publishedAt': new Date() } }, { session })
      if (lessonWrite.modifiedCount !== 1) throw Error('First Day lesson activation failed')
      const levelWrite = await Level.updateOne({
        _id: level._id, status: 'draft', availability: 'UPCOMING', number: 1,
      }, { $set: { status: 'active', availability: 'PUBLISHED' } }, { session })
      if (levelWrite.modifiedCount !== 1) throw Error('First Day level activation failed')
      if (classroom.status === 'draft') {
        const klassWrite = await CurriculumClass.updateOne({ _id: classroom._id, status: 'draft' },
          { $set: { status: 'active' } }, { session })
        if (klassWrite.modifiedCount !== 1) throw Error('Class 1 curriculum activation failed')
      }
    })
    console.log(JSON.stringify({ status: 'CLASS1_LEVEL1_PUBLISHED', address: 'g01-l01',
      sceneCount: 10, studentHistoryRewritten: false, level2UnlockedByPublication: false }))
  } finally {
    await mongoose.disconnect()
  }
}
main().catch((error: unknown) => {
  console.error('CLASS1_PUBLICATION_FAILED:', error instanceof Error ? error.message : 'Release failed')
  process.exitCode = 1
})
