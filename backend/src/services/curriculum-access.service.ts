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

    const curriculumClass =
      await CurriculumClass.findOne({
        grade: student.grade,
        status: pilotAllowlisted ? { $in: ['active', 'draft'] } : 'active',
      }).lean()

    if (!curriculumClass) {
      throw student.grade === 0
        ? ApiError.businessRule(this.unpublishedCurriculumMessage(student.grade))
        : ApiError.notFound(this.unpublishedCurriculumMessage(student.grade))
    }

    // Draft access is limited to the explicitly allowlisted Grade 0 student
    // and this exact pilot version. Ordinary students retain published-only access.
    const isKGPilot = pilotAllowlisted && curriculumClass.status === 'draft'
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
    const expectedStatus = access.isKGPilot ? 'draft' : 'active'
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

    if (access.isKGPilot ? !isKGPilotLevel(level) : level.availability !== 'PUBLISHED') {
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
    const expectedStatus = access.isKGPilot ? 'draft' : 'active'
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

    return {
      lesson,
      level,
      isKGPilot: access.isKGPilot,
    }
  },

  async assertActivity(
    studentId: string,
    activityId: string,
  ) {
    const access = await this.context(studentId)
    const expectedStatus = access.isKGPilot ? 'draft' : 'active'
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
    }
  },
}
