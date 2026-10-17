import { CurriculumClass } from '../models/CurriculumClass'
import { Level } from '../models/Level'
import { Lesson } from '../models/Lesson'
import { Activity } from '../models/Activity'
import { gradeName, mappedStatus, roadmapEntry } from '../curriculum/level-map-contract'
import { roadmapForGrade } from '../curriculum/roadmap'

/** Read-only, bounded editorial + Mongo projection. Does not publish draft lessons. */
export const LevelMapService = {
  async grade(grade: number) {
    const outline = roadmapForGrade(grade)
    if (!outline) throw new Error('Invalid grade')

    const klass = await CurriculumClass.findOne({ grade }).select('_id name status').lean()
    const levels = klass
      ? await Level.find({ classId: klass._id, number: { $gte: 1, $lte: 10 } })
          .select('_id number title availability status curriculumVersion learningObjectives').lean()
      : []
    const levelIds = levels.map((level) => level._id)
    const lessons = levelIds.length
      ? await Lesson.find({ levelId: { $in: levelIds } })
          .select('_id levelId title order status settings').sort('order').lean()
      : []
    const lessonIds = lessons.map((lesson) => lesson._id)
    const counts = lessonIds.length
      ? await Activity.aggregate<{ _id: string; count: number }>([
          { $match: { lessonId: { $in: lessonIds }, status: 'active' } },
          { $group: { _id: '$lessonId', count: { $sum: 1 } } },
        ])
      : []
    const activeCount = new Map(counts.map((item) => [String(item._id), item.count]))
    const existingByNumber = new Map(levels.map((item) => [item.number, item]))
    const lessonsByLevel = new Map<string, typeof lessons>()
    for (const lesson of lessons) {
      const key = String(lesson.levelId)
      const group = lessonsByLevel.get(key) || []
      group.push(lesson)
      lessonsByLevel.set(key, group)
    }

    const mapped = outline.map((plan) => {
      const actual = existingByNumber.get(plan.level)
      const attached = actual ? (lessonsByLevel.get(String(actual._id)) || []) : []
      const activeLessons = attached.filter((item) => item.status === 'active')
      const activeActivities = activeLessons.reduce((sum, item) => sum + (activeCount.get(String(item._id)) || 0), 0)
      return {
        address: plan.id, grade, level: plan.level, plannedTitle: plan.title,
        objective: plan.objective, skills: plan.skills, syllabusReviewRequired: plan.teacherReviewRequired,
        classId: klass ? String(klass._id) : null,
        levelId: actual ? String(actual._id) : null,
        actualTitle: actual?.title ?? null,
        version: actual?.curriculumVersion ?? null,
        status: mappedStatus({
          present: Boolean(actual), availability: actual?.availability, status: actual?.status,
          activeLessons: activeLessons.length, activeActivities,
        }),
        publication: actual?.availability ?? 'UPCOMING',
        lessons: attached.map((lesson) => ({
          id: String(lesson._id), title: lesson.title, order: lesson.order,
          status: lesson.status, activityCount: activeCount.get(String(lesson._id)) || 0,
          placeholder: lesson.settings?.mappedPlaceholder === true,
        })),
      }
    })
    return {
      grade, name: gradeName(grade), classId: klass ? String(klass._id) : null,
      classStatus: klass?.status ?? 'NOT_MAPPED',
      total: 10,
      mappedCount: mapped.filter((item) => item.levelId !== null).length,
      publishedCount: mapped.filter((item) => item.status === 'PUBLISHED').length,
      levels: mapped,
      note: 'Editor map. Draft/empty levels are NOT student-playable. Existing published lessons are not overwritten.',
    }
  },

  async level(grade: number, level: number) {
    roadmapEntry(grade, level)
    const catalog = await this.grade(grade)
    return { grade, classId: catalog.classId, ...catalog.levels[level - 1] }
  },
}
