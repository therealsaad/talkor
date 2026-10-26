// TALKORA_CLASS1_STUDENT_DEMO_ROUTE_V1
import {
  Student,
} from '../models/Student'

import {
  CurriculumClass,
} from '../models/CurriculumClass'

import {
  Level,
} from '../models/Level'

import {
  Lesson,
} from '../models/Lesson'

import {
  Activity,
} from '../models/Activity'

import {
  ApiError,
} from '../utils/ApiError'
import {
  KG_CURRICULUM_VERSION,
  isAuthorizedKGPilotStudent,
  isKGPilotLevel,
} from './kg-pilot-access'
import { isMissingKGPilotPicture } from './kg-pilot-presentation'
import {
  CLASS1_DEMO_LESSON_FILTER,
  CLASS1_DEMO_VERSION,
  isAuthorizedClass1DemoStudent,
  isClass1DemoActivity,
  isClass1DemoLesson,
  isClass1DemoLevel,
} from './class1-demo-access'

/** Controlled, one-student demo; never opens draft Class 1 to the general student population. */
export { CLASS1_DEMO_VERSION }

export const CurriculumAccessService = {
  unpublishedCurriculumMessage(grade: number) {
    return grade === 0
      ? 'The Kindergarten (KG) curriculum has not been published with a playable lesson and activity yet. Please ask your school administrator to publish a complete KG lesson.'
      : `Published curriculum is not available for Class ${grade}`
  },

  async context(
    studentId: string,
  ) {
    const student =
      await Student.findById(
        studentId,
      )
        .select(
          'grade schoolId status className fullName',
        )
        .lean()

    if (
      !student ||
      student.status !== 'active'
    ) {
      throw ApiError.unauthorized(
        'Student profile is unavailable',
      )
    }

    const pilotAllowlisted = isAuthorizedKGPilotStudent({
      id: student._id.toString(),
      grade: student.grade,
      status: student.status,
    })

    const class1DemoAllowlisted = isAuthorizedClass1DemoStudent({
      id: student._id.toString(),
      grade: student.grade,
      status: student.status,
    })

    const curriculumClass =
      await CurriculumClass.findOne({
        grade: student.grade,
        status: pilotAllowlisted || class1DemoAllowlisted ? { $in: ['active', 'draft'] } : 'active',
      }).lean()

    if (!curriculumClass) {
      throw student.grade === 0
        ? ApiError.businessRule(this.unpublishedCurriculumMessage(student.grade))
        : ApiError.notFound(this.unpublishedCurriculumMessage(student.grade))
    }

    // Draft access is limited to the explicitly allowlisted pilot students.
    // Ordinary students retain published-only access.
    const isKGPilot = pilotAllowlisted && curriculumClass.status === 'draft'
    const isClass1Demo = class1DemoAllowlisted
    if (isClass1Demo) {
      // Fail closed unless this is our exact seed and its reviewed demo marker.
      const demoLevel = await Level.findOne({
        classId: curriculumClass._id,
        number: 1,
        curriculumVersion: CLASS1_DEMO_VERSION,
        status: 'draft',
        availability: 'UPCOMING',
      }).select('_id').lean()
      const demoLesson = demoLevel && await Lesson.exists({
        levelId: demoLevel._id,
        ...CLASS1_DEMO_LESSON_FILTER,
      })
      if (!demoLesson) throw ApiError.businessRule('Class 1 demonstration lesson is not ready.')
    }
    if (isKGPilot) {
      const pilotLevel = await Level.findOne({
        classId: curriculumClass._id,
        curriculumVersion: KG_CURRICULUM_VERSION,
        status: 'draft',
        availability: 'UPCOMING',
      }).select('curriculumVersion status availability').lean()

      if (!pilotLevel || !isKGPilotLevel(pilotLevel)) {
        throw ApiError.businessRule(this.unpublishedCurriculumMessage(student.grade))
      }
    } else if (student.grade === 0 && !(await Level.exists({
      classId: curriculumClass._id,
      status: 'active',
      availability: 'PUBLISHED',
    }))) {
      throw ApiError.businessRule(this.unpublishedCurriculumMessage(student.grade))
    }

    return {
      student,
      curriculumClass,
      isKGPilot,
      isClass1Demo,
    }
  },

  async assertClass(
    studentId: string,
    classId: string,
  ) {
    const context =
      await this.context(
        studentId,
      )

    if (
      context.curriculumClass._id.toString() !==
      classId
    ) {
      throw ApiError.curriculumAccess()
    }

    return context
  },

  async assertLevel(
    studentId: string,
    levelId: string,
  ) {
    const access = await this.context(studentId)
    const expectedStatus = access.isKGPilot || access.isClass1Demo ? 'draft' : 'active'
    const level =
      await Level.findById(
        levelId,
      ).lean()

    if (
      !level ||
      level.status !== expectedStatus
    ) {
      throw ApiError.activityUnavailable(
        'This unit is unavailable',
      )
    }

    if (access.isKGPilot
      ? !isKGPilotLevel(level)
      : access.isClass1Demo
        ? !isClass1DemoLevel(level)
        : level.availability !== 'PUBLISHED') {
      throw ApiError.activityUnavailable(
        'This unit is not published',
      )
    }

    if (access.curriculumClass._id.toString() !== level.classId.toString()) {
      throw ApiError.curriculumAccess()
    }

    return level
  },

  async assertLesson(
    studentId: string,
    lessonId: string,
  ) {
    const access = await this.context(studentId)
    const expectedStatus = access.isKGPilot || access.isClass1Demo ? 'draft' : 'active'
    const lesson =
      await Lesson.findById(
        lessonId,
      ).lean()

    if (
      !lesson ||
      lesson.status !== expectedStatus
    ) {
      throw ApiError.activityUnavailable(
        'This lesson is not published',
      )
    }

    const level =
      await this.assertLevel(
        studentId,
        lesson.levelId.toString(),
      )

    if (access.isClass1Demo && !isClass1DemoLesson(lesson)) {
      throw ApiError.activityUnavailable('This lesson is not part of the approved Class 1 demo')
    }

    return {
      lesson,
      level,
      isKGPilot: access.isKGPilot,
      isClass1Demo: access.isClass1Demo,
    }
  },

  async assertActivity(
    studentId: string,
    activityId: string,
  ) {
    const access = await this.context(studentId)
    const expectedStatus = access.isKGPilot || access.isClass1Demo ? 'draft' : 'active'
    const activity =
      await Activity.findById(
        activityId,
      ).lean()

    if (
      !activity ||
      activity.status !== expectedStatus
    ) {
      throw ApiError.activityUnavailable(
        'This activity is unavailable',
      )
    }

    if (access.isKGPilot && isMissingKGPilotPicture(activity)) {
      throw ApiError.activityUnavailable('This picture activity is skipped until its picture asset is ready')
    }

    if (access.isClass1Demo && !isClass1DemoActivity(activity)) {
      throw ApiError.activityUnavailable('This activity is not part of the approved Class 1 demo')
    }

    const {
      lesson,
      level,
    } =
      await this.assertLesson(
        studentId,
        activity.lessonId.toString(),
      )

    return {
      activity,
      lesson,
      level,
      isKGPilot: access.isKGPilot,
      isClass1Demo: access.isClass1Demo,
    }
  },
}
