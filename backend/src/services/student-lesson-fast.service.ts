// TALKORA_CLASS1_STUDENT_DEMO_ROUTE_V1
import { Types } from 'mongoose'
import { Activity } from '../models/Activity'
import { Lesson } from '../models/Lesson'
import { Level } from '../models/Level'
import { ApiError } from '../utils/ApiError'
import { CurriculumAccessService } from './curriculum-access.service'
import { ProgressService } from './progress.service'
import { KG_CURRICULUM_VERSION } from './kg-pilot-access'
import { isMissingKGPilotPicture, presentKGPilotActivity } from './kg-pilot-presentation'
import { CLASS1_DEMO_EXPERIENCE_ID, CLASS1_DEMO_VERSION } from './class1-demo-access'

/**
 * One grade-authoritative read for the hands-free lab lesson flow.
 * Avoids the old browser waterfall (classes -> levels -> lesson -> activities
 * -> progress) and NEVER returns answer keys or cross-grade content.
 */
export const StudentLessonFastService = {
  async next(studentId: string) {
    const { student, curriculumClass, isKGPilot, isClass1Demo } = await CurriculumAccessService.context(studentId)
    const contentStatus = isKGPilot || isClass1Demo ? 'draft' : 'active'
    let hasPlayableActivity = false
    const [progress, units] = await Promise.all([
      ProgressService.getForStudent(studentId, curriculumClass._id.toString()),
      Level.find({
        classId: curriculumClass._id,
        ...(isKGPilot
          ? { curriculumVersion: KG_CURRICULUM_VERSION, status: 'draft', availability: 'UPCOMING' }
          : isClass1Demo
            ? { curriculumVersion: CLASS1_DEMO_VERSION, number: 1, status: 'draft', availability: 'UPCOMING' }
            : { status: 'active', availability: 'PUBLISHED' }),
      })
        .select('_id order title').sort('order').lean(),
    ])

    for (const unit of units) {
      const unitProgress = progress.levels.find(item => item.levelId.toString() === unit._id.toString())
      const unitIsAccessible = Boolean(unitProgress && ['unlocked', 'in-progress'].includes(unitProgress.status))
      const lessons = await Lesson.find({ levelId: unit._id, status: contentStatus, ...(isClass1Demo ? { 'settings.talkoraDemoDraft': true } : {}) })
        .select('_id order').sort('order').lean()
      for (const lesson of lessons) {
        const activities = await Activity.find({
          lessonId: lesson._id,
          status: contentStatus,
          core: { $ne: false },
          required: { $ne: false },
          ...(isKGPilot ? { $nor: [{ type: 'PICTURE_CHOICE', 'content.pictureAsset.status': 'MISSING' }] } : {}),
        })
          .select('_id order type content choices').sort('order').lean()
        const playableActivities = isKGPilot
          ? activities.filter((item) => !isMissingKGPilotPicture(item))
          : activities
        if (playableActivities.length) hasPlayableActivity = true
        if (!unitIsAccessible || !unitProgress) continue
        const done = new Set(unitProgress.lessons.find(item => item.lessonId.toString() === lesson._id.toString())
          ?.completedActivityIds.map(id => id.toString()) || [])
        const activity = playableActivities.find(item => !done.has(item._id.toString()))
        if (activity) {
          return { grade: student.grade, lessonId: lesson._id.toString(), unitTitle: unit.title,
            activityId: activity._id.toString(), complete: false }
        }
      }
    }
    if (student.grade === 0 && !hasPlayableActivity) {
      throw ApiError.businessRule(CurriculumAccessService.unpublishedCurriculumMessage(student.grade))
    }
    return { grade: student.grade, lessonId: null, activityId: null, unitTitle: null, complete: true }
  },

  async lesson(studentId: string, lessonId: string) {
    if (!Types.ObjectId.isValid(lessonId)) throw ApiError.badRequest('Invalid lesson link')
    const { student, curriculumClass, isKGPilot, isClass1Demo } = await CurriculumAccessService.context(studentId)
    const { lesson, level } = await CurriculumAccessService.assertLesson(studentId, lessonId)
    const contentStatus = isKGPilot || isClass1Demo ? 'draft' : 'active'
    const [progress, activities] = await Promise.all([
      ProgressService.getForStudent(studentId, curriculumClass._id.toString()),
      Activity.find({
        lessonId: lesson._id,
        status: contentStatus,
        ...(isClass1Demo ? { curriculumVersion: CLASS1_DEMO_VERSION, activityKey: /^class1-l01-/ } : {}),
      })
        .select('-answer -answerConfig')
        .sort('order').lean(),
    ])
    const levelProgress = progress.levels.find(item => item.levelId.toString() === level._id.toString())
    if (!levelProgress || levelProgress.status === 'locked') {
      throw ApiError.unitLocked()
    }
    if (!activities.length) throw ApiError.activityUnavailable('This lesson has no published activities')
    const lessonProgress = levelProgress.lessons.find(item => item.lessonId.toString() === lesson._id.toString())
    return {
      grade: student.grade,
      experienceId: isClass1Demo ? CLASS1_DEMO_EXPERIENCE_ID : undefined,
      curriculumClass: { id: curriculumClass._id.toString(), grade: student.grade, name: curriculumClass.name, order: curriculumClass.order },
      level: { ...level, id: level._id.toString(), classId: level.classId.toString() },
      lesson: { ...lesson, id: lesson._id.toString(), levelId: level._id.toString() },
      activities: activities.map(item => {
        const presented = isKGPilot ? presentKGPilotActivity(item) : item
        return { ...presented, id: item._id.toString(), lessonId: item.lessonId.toString() }
      }),
      completedActivityIds: lessonProgress?.completedActivityIds.map(id => id.toString()) || [],
    }
  },
}
