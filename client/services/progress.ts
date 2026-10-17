import type { Achievement, LearningProgress, StudentMemory } from './types'

export const mockProgress: LearningProgress = { studentId: 'aanya', levelId: 'level-1', vocabulary: 78, grammar: 64, speaking: 52, pronunciation: 71, accuracy: 91, learningMinutes: 504, streak: 7, updatedAt: new Date().toISOString() }
export const mockAchievements: Achievement[] = [
  { id: 'first-quest', title: 'First Quest', description: 'Complete your first activity.', category: 'completion', unlocked: true, progress: 100 },
  { id: 'brave-speaker', title: 'Brave Speaker', description: 'Try a speaking activity.', category: 'speaking', unlocked: false, progress: 60 },
  { id: 'word-explorer', title: 'Word Explorer', description: 'Learn 10 new words.', category: 'learning', unlocked: false, progress: 80 },
  { id: 'seven-day', title: 'Seven Day Streak', description: 'Practice for seven days.', category: 'streak', unlocked: true, progress: 100 },
]
export const mockMemory: StudentMemory[] = [{ id: 'memory-1', studentId: 'aanya', category: 'pronunciation', fact: 'Practices the TH sound with extra care.', confidence: .82, lastReinforcedAt: new Date().toISOString() }]
export async function getProgress(_studentId: string) { return mockProgress }
export async function getAchievements(_studentId: string) { return mockAchievements }
export async function getLearningMemory(_studentId: string) { return mockMemory }
