import { apiClient, apiClientBlob } from '@/lib/api-client'

export interface AttemptSubmission {
  answer: string
  startedAt: string
  hintsUsed?: number
  idempotencyKey?: string
}

export interface AttemptResult {
  attempt: any
  xpAwarded: number
  streak?: number
  levelProgress?: {
    levelId: string
    status: 'locked' | 'available' | 'in-progress' | 'completed'
    accuracy: number
    stars: number
    xp: number
  }
  unlockedAchievements?: Array<{
    key: string
    title: string
    description: string
    category: string
  }>
}

export interface StudentOverallProgress {
  xp: number
  stars: number
  streak: number
  curriculumVersion?: string
  lastActivityAt?: string
  levels: Array<{
    levelId: string
    status: 'locked' | 'unlocked' | 'in-progress' | 'completed'
    accuracy: number
    totalTimeMs: number
    unlockedAt?: string
    completedAt?: string
    lessons: Array<{
      lessonId: string
      completedActivityIds: string[]
      completed: boolean
      accuracy: number
      totalTimeMs: number
      completedAt?: string
    }>
  }>
}

export interface AchievementItem {
  id: string
  key: string
  title: string
  description: string
  category: 'completion' | 'speaking' | 'learning' | 'streak'
  unlocked: boolean
  unlockedAt?: string
}

export interface DailyChallengeItem {
  id: string
  date: string
  title: string
  description: string
  category: string
  targetCount: number
  xpReward: number
  progress?: number
  completed?: boolean
}

export interface HomePracticeReflection {
  unitKey?: string
  reflection: string
  submittedAt: string
  hasAudio: boolean
}

export type HomePracticeUnitSlug = 'favourites' | 'class1-first-day'

function homePracticePath(unit: HomePracticeUnitSlug) {
  return `/progress/home-practice/${unit}`
}

export const progressService = {
  async getHomePractice(unit: HomePracticeUnitSlug = 'favourites'): Promise<HomePracticeReflection | null> {
    return apiClient<HomePracticeReflection | null>(homePracticePath(unit))
  },
  async getHomePracticeAudio(unit: HomePracticeUnitSlug = 'favourites'): Promise<Blob> {
    return apiClientBlob(`${homePracticePath(unit)}/audio`)
  },
  async saveHomePractice(reflection: string, audio?: Blob, unit: HomePracticeUnitSlug = 'favourites'): Promise<HomePracticeReflection> {
    const formData = new FormData()
    formData.append('reflection', reflection)
    if (audio) formData.append('audio', audio, 'home-practice-recording')
    return apiClient<HomePracticeReflection>(homePracticePath(unit), {
      method: 'PUT',
      body: formData,
    })
  },
  async completeLocalActivity(activityId: string, answer: string): Promise<AttemptResult> {
    return apiClient<AttemptResult>(`/progress/activities/${activityId}/complete-local`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    })
  },
  async submitAttempt(activityId: string, submission: AttemptSubmission): Promise<AttemptResult> {
    return apiClient<AttemptResult>(`/progress/activities/${activityId}/attempts`, {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  },

  async getClassProgress(classId: string): Promise<any> {
    return apiClient(`/progress/classes/${classId}`)
  },

  async getMyProgress(): Promise<StudentOverallProgress> {
    return apiClient<StudentOverallProgress>('/students/me/progress')
  },

  async getMyAchievements(): Promise<AchievementItem[]> {
    return apiClient<AchievementItem[]>('/achievements/mine')
  },

  async getMyDailyChallenge(): Promise<DailyChallengeItem | null> {
    return apiClient<DailyChallengeItem | null>('/daily-challenges/today')
  },
}
