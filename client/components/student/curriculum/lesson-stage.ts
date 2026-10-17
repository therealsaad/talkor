import type { ActivityItem } from '@/services/curriculum-service'

export type LessonStage = 'Warm-up' | 'Listen & Repeat' | 'Speak' | 'Interact' | 'Present' | 'Practice Zone' | 'Final Challenge'

export function lessonStageFor(activity: ActivityItem, index: number, total: number): LessonStage {
  const authored: Record<string, LessonStage> = {
    WARM_UP: 'Warm-up', LISTEN_REPEAT: 'Listen & Repeat', SPEAK: 'Speak', INTERACT: 'Interact',
    PRESENT: 'Present', PRACTICE_ZONE: 'Practice Zone', FINAL_CHALLENGE: 'Final Challenge',
    FINAL_TALK: 'Final Challenge', REWARD: 'Final Challenge',
  }
  if (activity.stage && authored[activity.stage]) return authored[activity.stage]
  const type = activity.type.toUpperCase()
  const text = `${activity.title} ${activity.prompt}`.toLowerCase()
  if (type === 'REVIEW' || index === total - 1 || text.includes('final challenge')) return 'Final Challenge'
  if (type === 'LISTEN_AND_REPEAT' || text.includes('listen and repeat')) return 'Listen & Repeat'
  if (type === 'SPEAKING' || type === 'PRONUNCIATION') return 'Speak'
  if (type === 'CONVERSATION' || text.includes('interact')) return 'Interact'
  if (type === 'PRESENTATION' || text.includes('present')) return 'Present'
  if (index === 0) return 'Warm-up'
  return 'Practice Zone'
}

export function lessonStageSummary(activities: ActivityItem[]): LessonStage[] {
  return activities.reduce<LessonStage[]>((stages, activity, index) => {
    const stage = lessonStageFor(activity, index, activities.length)
    return stages.includes(stage) ? stages : [...stages, stage]
  }, [])
}
