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
      ? await Activity.aggregate<{ _id: string; total?: number; active?: number; draft?: number; count?: number }>([
          { $match: { lessonId: { $in: lessonIds } } },
          {
            $group: {
              _id: '$lessonId',
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
              draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
              count: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            },
          },
        ])
      : []
    const activityMap = new Map(counts.map((item) => [
      String(item._id),
      {
        total: item.total ?? item.count ?? 0,
        active: item.active ?? item.count ?? 0,
        draft: item.draft ?? 0,
        count: item.count ?? item.active ?? 0,
      },
    ]))
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
      const activeActivities = attached.reduce((sum, item) => sum + (activityMap.get(String(item._id))?.active || 0), 0)
      const totalActivities = attached.reduce((sum, item) => sum + (activityMap.get(String(item._id))?.total || 0), 0)
      const draftActivities = attached.reduce((sum, item) => sum + (activityMap.get(String(item._id))?.draft || 0), 0)
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
        totalActivities,
        activeActivities,
        draftActivities,
        lessons: attached.map((lesson) => {
          const stats = activityMap.get(String(lesson._id))
          return {
            id: String(lesson._id), title: lesson.title, order: lesson.order,
            status: lesson.status,
            activityCount: stats?.total ?? 0,
            activeCount: stats?.active ?? 0,
            draftCount: stats?.draft ?? 0,
            placeholder: lesson.settings?.mappedPlaceholder === true,
          }
        }),
      }
    })
    const totalLessons = mapped.reduce((sum, item) => sum + item.lessons.length, 0)
    const totalActivities = mapped.reduce((sum, item) => sum + item.totalActivities, 0)
    const playableActivities = mapped.reduce((sum, item) => sum + item.activeActivities, 0)
    const draftCount = mapped.filter((item) => item.status === 'DRAFT').length
    return {
      grade, name: gradeName(grade), classId: klass ? String(klass._id) : null,
      classStatus: klass?.status ?? 'NOT_MAPPED',
      total: 10,
      mappedCount: mapped.filter((item) => item.levelId !== null).length,
      publishedCount: mapped.filter((item) => item.status === 'PUBLISHED').length,
      draftCount,
      totalLessons,
      totalActivities,
      playableActivities,
      levels: mapped,
      note: 'Editor map. Draft/empty levels are NOT student-playable. Existing published lessons are not overwritten.',
    }
  },

  async level(grade: number, level: number) {
    roadmapEntry(grade, level)
    const catalog = await this.grade(grade)
return { ...catalog.levels[level - 1], grade, classId: catalog.classId }  },
}
