/** Read-only Class 1 Level 1 readiness audit. Does not publish, seed, or change student data. */
import mongoose from 'mongoose'
import { env } from '../config/env'
import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'

async function main(): Promise<void> {
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 })
  const classes = await CurriculumClass.find({ grade: 1 })
    .select('_id grade status name').lean()

  if (!classes.length) {
    console.log(JSON.stringify({ grade: 1, levelId: 'g01-l01', state: 'NO_CLASS_RECORD', next: 'No Class 1 record yet. Keep pilot unpublished.' }, null, 2))
    return
  }

  for (const classroom of classes) {
    const levels = await Level.find({ classId: classroom._id, number: 1 })
      .select('_id classId number unitNumber title status availability curriculumVersion sourceBook sourcePages').lean()
    if (!levels.length) {
      console.log(JSON.stringify({ grade: 1, classStatus: classroom.status, levelId: 'g01-l01', state: 'NO_LEVEL_RECORD' }, null, 2))
      continue
    }
    for (const level of levels) {
      const lessons = await Lesson.find({ levelId: level._id })
        .select('_id title order status').sort({ order: 1 }).lean()
      const details = await Promise.all(lessons.map(async (lesson) => {
        const [allActivities, activeActivities, guidedDialogueActivities, retainedLegacyActivities] = await Promise.all([
          Activity.countDocuments({ lessonId: lesson._id, required: { $ne: false }, core: { $ne: false } }),
          Activity.countDocuments({ lessonId: lesson._id, status: 'active' }),
          Activity.countDocuments({ lessonId: lesson._id, required: { $ne: false }, core: { $ne: false }, type: { $in: ['CONVERSATION','OPEN_CONVERSATION','FOLLOW_UP_CONVERSATION','SPEAKING','LISTEN_AND_REPEAT'] } }),
          Activity.countDocuments({ lessonId: lesson._id, activityKey: /^class1-l01-legacy-/ }),
        ])
        return { title: lesson.title, order: lesson.order, status: lesson.status,
          activities: allActivities, retainedLegacyActivities, activeActivities, guidedDialogueActivities }
      }))
      const activeLessonWithActivities = details.some((lesson) => lesson.status === 'active' && lesson.activeActivities > 0)
      console.log(JSON.stringify({
        grade: 1,
        canonicalId: 'g01-l01',
        classStatus: classroom.status,
        unit: { number: level.number, unitNumber: level.unitNumber, title: level.title, status: level.status,
          availability: level.availability, curriculumVersion: level.curriculumVersion,
          sourceBook: level.sourceBook ?? null, sourcePages: level.sourcePages ?? [] },
        lessons: details,
        publicationConditions: {
          publishedStatus: level.status === 'active' && level.availability === 'PUBLISHED',
          hasActiveLessonWithActivities: activeLessonWithActivities,
          // This audit cannot verify lesson quality, school unlocks, audio, student auth, or voice performance.
          teacherReviewedAndEndToEndVerified: false,
        },
        recommendation: 'Do not publish until syllabus review, audio, speech, grading and authenticated student QA are complete.',
      }, null, 2))
    }
  }
}

main()
  .catch(() => {
    // No credential URLs or stack traces printed: only a generic description.
    console.error('Class 1 read-only audit failed. Check MongoDB connectivity and environment configuration.')
    process.exitCode = 1
  })
  .finally(async () => { await mongoose.disconnect() })
