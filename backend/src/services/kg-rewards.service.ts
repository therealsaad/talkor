import { Types } from 'mongoose'
import { KGAlphabetProgress } from '../models/KGAlphabetProgress'
import { KGContinuationProgress } from '../models/KGContinuationProgress'
import { KGLevel2Progress } from '../models/KGLevel2Progress'
import { continuationLesson } from '../kg/student-continuation-catalog'
import { logger } from '../utils/logger'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Letters A to D', 2: 'Letters E to J', 3: 'Letters K to P',
  4: 'Letters Q to V', 5: 'Letters W to Z',
}

async function completedLevels(studentId: Types.ObjectId, schoolId: Types.ObjectId): Promise<number[]> {
  const [level1, level2, continuation] = await Promise.all([
    KGAlphabetProgress.findOne({ studentId, schoolId }).select('currentIndex').lean(),
    KGLevel2Progress.findOne({ studentId, schoolId }).select('currentIndex completedAt').lean(),
    KGContinuationProgress.find({ studentId, schoolId }).select('level currentIndex completedAt').lean(),
  ])
  const completed = new Set<number>()
  if (level1?.currentIndex === 8) completed.add(1)
  if (level2?.currentIndex === 6 && level2.completedAt) completed.add(2)
  for (const row of continuation) {
    if (row.completedAt && row.currentIndex === continuationLesson(row.level as 3 | 4 | 5).letters.length) {
      completed.add(row.level)
    }
  }
  const sequential: number[] = []
  for (let level = 1; level <= 5 && completed.has(level); level += 1) sequential.push(level)
  return sequential
}

async function recordLevel(studentId: Types.ObjectId, schoolId: Types.ObjectId, level: number): Promise<boolean> {
  const result = await KGAlphabetProgress.updateOne(
    { studentId, schoolId, 'kgRewards.level': { $ne: level } },
    { $push: { kgRewards: { level, awardedAt: new Date() } } },
  )
  return result.modifiedCount === 1
}

async function collection(studentId: Types.ObjectId, schoolId: Types.ObjectId, newlyAwarded: number[] = []) {
  const [eligible, progress] = await Promise.all([
    completedLevels(studentId, schoolId),
    KGAlphabetProgress.findOne({ studentId, schoolId }).select('kgRewards').lean(),
  ])
  const eligibleSet = new Set(eligible)
  const stored = new Map((progress?.kgRewards || []).map((reward) => [reward.level, reward.awardedAt]))
  const levels = [1, 2, 3, 4, 5].map((level) => ({
    level,
    title: LEVEL_NAMES[level],
    completed: eligibleSet.has(level),
    starEarned: eligibleSet.has(level) && stored.has(level),
    awardedAt: stored.get(level)?.toISOString() || null,
  }))
  return {
    totalStars: levels.filter((level) => level.starEarned).length,
    maxStars: 5,
    levels,
    championUnlocked: levels.every((level) => level.starEarned),
    newlyAwardedLevels: newlyAwarded,
  }
}

export const KGRewardsService = {
  async awardCompletedLevel(studentId: Types.ObjectId, schoolId: Types.ObjectId, level: number) {
    const eligible = await completedLevels(studentId, schoolId)
    if (!eligible.includes(level)) return collection(studentId, schoolId)
    const newlyAwardedLevels: number[] = []
    for (const completedLevel of eligible) {
      if (await recordLevel(studentId, schoolId, completedLevel)) newlyAwardedLevels.push(completedLevel)
    }
    return collection(studentId, schoolId, newlyAwardedLevels)
  },

  async getCollection(studentId: Types.ObjectId, schoolId: Types.ObjectId) {
    const eligible = await completedLevels(studentId, schoolId)
    const newlyAwardedLevels: number[] = []
    for (const level of eligible) {
      if (await recordLevel(studentId, schoolId, level)) newlyAwardedLevels.push(level)
    }
    return collection(studentId, schoolId, newlyAwardedLevels)
  },

  async awardCompletedLevelBestEffort(studentId: Types.ObjectId, schoolId: Types.ObjectId, level: number) {
    try {
      return await this.awardCompletedLevel(studentId, schoolId, level)
    } catch (error) {
      logger.warn('KG completion reward could not be saved; it will be reconciled from verified progress', {
        studentId: studentId.toString(), level, error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  },
}
