import {
  apiClient,
} from '@/lib/api-client'

/* =========================================================
   MONGO DOCUMENT
   ========================================================= */

type MongoDocument = {
  id?: string
  _id?: string
}

function withId<
  T extends MongoDocument,
>(
  item: T,
): T & {
  id: string
} {
  return {
    ...item,

    id:
      item.id ||
      item._id ||
      '',
  }
}

/* =========================================================
   CLASS
   ========================================================= */

export interface CurriculumClass {
  id: string
  grade: number
  name: string
  order: number
}

/* =========================================================
   UNIT TYPES
   ========================================================= */

export type LevelStatus =
  | 'locked'
  | 'available'
  | 'in-progress'
  | 'completed'

export type StudentUnitStatus =
  | 'CURRENT'
  | 'LOCKED'
  | 'COMPLETED'
  | 'UPCOMING'

export type CurriculumAvailability =
  | 'PUBLISHED'
  | 'UPCOMING'
  | 'ARCHIVED'

export type CurriculumUnitType =
  | 'CONVERSATION'
  | 'PRESENTATION'
  | 'ROLEPLAY'
  | 'STORY'
  | 'NARRATIVE'

export interface LevelBadge {
  key?: string
  name?: string
  title?: string
  description?: string
}

export interface LevelItem {
  id: string

  classId: string

  number: number

  order: number

  title: string

  place: string

  description: string

  status: LevelStatus

  stars?: number

  lessonCount?: number

  term?: number

  unitNumber?: number

  unitType?: CurriculumUnitType

  visualTheme?: string

  learningObjectives?: string[]

  speakingGoals?: string[]

  badge?: LevelBadge

  sourceBook?: string

  sourcePages?: number[]

  curriculumVersion?: string

  availability?: CurriculumAvailability
}

/* =========================================================
   LESSON
   ========================================================= */

export interface LessonItem {
  id: string

  levelId: string

  order: number

  title: string

  subtitle?: string

  estimatedMinutes: number

  xpReward: number

  activityCount?: number

  teacherIntroduction?: string

  settings?: Record<
    string,
    unknown
  >
}

/* =========================================================
   ACTIVITY TYPE
   ========================================================= */

export type ActivityType =
  | 'MCQ'
  | 'PICTURE_CHOICE'
  | 'MATCHING'
  | 'SPELLING'
  | 'LISTENING'
  | 'LISTEN_AND_REPEAT'
  | 'WORD_RECOGNITION'
  | 'SENTENCE_BUILDER'
  | 'READING'
  | 'PRONUNCIATION'
  | 'SPEAKING'
  | 'CONVERSATION'
  | 'REVIEW'
  | 'LIKE_DISLIKE'
  | 'LISTEN_MODEL'
  | 'REPEAT_SENTENCE'
  | 'VISUAL_CHOICE'
  | 'SPEAK_PROMPT'
  | 'OPEN_CONVERSATION'
  | 'FOLLOW_UP_CONVERSATION'
  | 'ROLEPLAY'
  | 'INTERVIEW'
  | 'PRESENTATION'
  | 'DESCRIBE_IMAGE'
  | 'FINAL_CONVERSATION'
  | 'FILL_BLANK'

/* =========================================================
   STAGE
   ========================================================= */

export type ActivityStage =
  | 'WARM_UP'
  | 'LISTEN_REPEAT'
  | 'SPEAK'
  | 'INTERACT'
  | 'FOLLOW_UP'
  | 'REASONS'
  | 'RESPECT_DIFFERENCES'
  | 'PRACTICE_ZONE'
  | 'PRESENT'
  | 'ROLEPLAY'
  | 'FINAL_CHALLENGE'
  | 'FINAL_TALK'
  | 'BONUS'
  | 'HOME_PRACTICE'
  | 'REWARD'

/* =========================================================
   SOURCE
   ========================================================= */

export interface ActivitySource {
  sourceType:
    | 'SYLLABUS'
    | 'ENRICHMENT'

  pdf?: string

  pageStart?: number

  pageEnd?: number

  label?: string
}

/* =========================================================
   CONVERSATION GOAL
   ========================================================= */

export interface ActivityConversationGoal {
  requiredConcepts: string[]

  minTurns: number

  maxTurns: number
}

/* =========================================================
   ACTIVITY
   ========================================================= */

export interface ActivityItem {
  id: string

  lessonId: string

  order: number

  type: ActivityType

  stage: ActivityStage

  core?: boolean

  required?: boolean

  title: string

  prompt: string

  instruction?: string

  target?: string

  choices?: string[]

  hint?: string

  difficulty:
    | 'easy'
    | 'medium'
    | 'hard'

  xp: number

  estimatedSeconds: number

  voiceEnabled: boolean

  aiEnabled: boolean

  teacherPrompt?: string

  modelSentence?: string

  expectedPatterns?: string[]

  keywords?: string[]

  allowMic?: boolean

  allowOptions?: boolean

  repeatRequired?: boolean

  maxConversationTurns?: number

  conversationGoal?: ActivityConversationGoal

  source?: ActivitySource

  content?: Record<
    string,
    unknown
  >

  metadata?: Record<
    string,
    unknown
  >
}

/* =========================================================
   STUDENT CURRICULUM LESSON
   ========================================================= */

export interface StudentCurriculumLesson {
  id: string

  order: number

  title: string

  subtitle?: string

  estimatedMinutes?: number

  xpReward?: number

  completed: boolean
}

/* =========================================================
   STUDENT CURRICULUM UNIT

   THIS IS WHAT /student/levels USES.
   ========================================================= */

export interface StudentCurriculumUnit {
  id: string

  unitNumber: number

  /**
   * Syllabus-facing name.
   */
  title: string

  /**
   * Talkora world/game-facing name.
   */
  worldName: string

  term?: number

  unitType?: CurriculumUnitType

  curriculumVersion?: string

  availability?: CurriculumAvailability

  status: StudentUnitStatus

  progress: number | null

  accuracy: number

  totalTimeMs: number

  completedAt?: string | Date | null

  unlockedAt?: string | Date | null

  badge?: LevelBadge

  learningObjectives: string[]

  speakingGoals: string[]

  lessonCount: number

  lessons: StudentCurriculumLesson[]

  source: {
    pdf?: string

    pages: number[]
  }
}

/* =========================================================
   STUDENT CURRICULUM RESPONSE
   ========================================================= */

export interface StudentCurriculum {
  studentGrade: number

  /**
   * Internal compatibility only.
   *
   * Student UI must NOT use this to switch classes.
   */
  classId: string

  className: string

  curriculumVersion:
    | string
    | null

  xp: number

  stars: number

  streak: number

  currentUnitId:
    | string
    | null

  completedUnits: number

  totalUnits: number

  units: StudentCurriculumUnit[]
}

/* =========================================================
   CURRENT LESSON
   ========================================================= */

export interface CurrentCurriculumLesson {
  id: string

  order: number

  title: string

  subtitle?: string

  teacherIntroduction?: string

  estimatedMinutes?: number

  xpReward?: number
}

/* =========================================================
   CURRENT ACTIVITY
   ========================================================= */

export interface CurrentCurriculumActivity {
  id: string

  lessonId: string

  order: number

  type: ActivityType

  stage: ActivityStage

  core?: boolean

  required?: boolean

  title: string

  prompt: string

  instruction?: string

  teacherPrompt?: string

  modelSentence?: string

  target?: string

  choices?: string[]

  expectedPatterns?: string[]

  keywords?: string[]

  difficulty:
    | 'easy'
    | 'medium'
    | 'hard'

  xp: number

  estimatedSeconds: number

  allowMic: boolean

  allowOptions: boolean

  voiceEnabled: boolean

  aiEnabled: boolean

  repeatRequired?: boolean

  maxConversationTurns?: number

  conversationGoal?: ActivityConversationGoal

  source?: ActivitySource
}

/* =========================================================
   CURRENT CURRICULUM
   ========================================================= */

export interface StudentCurrentCurriculum
  extends StudentCurriculum {
  currentUnit:
    | StudentCurriculumUnit
    | null

  currentLesson:
    | CurrentCurriculumLesson
    | null

  currentStage:
    | ActivityStage
    | null

  currentActivity:
    | CurrentCurriculumActivity
    | null
}

/* =========================================================
   SERVICE
   ========================================================= */

const DEMO_CLASS: CurriculumClass = {
  id: 'demo-class-4',
  grade: 4,
  name: 'Class 4',
  order: 4,
}

const DEMO_LEVEL: LevelItem = {
  id: 'demo-level-1',
  classId: 'demo-class-4',
  number: 1,
  order: 1,
  title: 'Favourite Fair',
  place: 'Favourite Fair',
  description: 'Share what you love and explain why.',
  status: 'available',
  stars: 3,
  lessonCount: 1,
  unitNumber: 1,
  unitType: 'CONVERSATION',
  availability: 'PUBLISHED',
  learningObjectives: ['Talk about favourites', 'Use full sentences', 'Give reasons with because'],
  speakingGoals: ['Speak clearly', 'Ask a follow-up question'],
  badge: { name: 'Favourite Finder' },
  sourcePages: [1, 3],
}

const DEMO_LESSON: LessonItem = {
  id: 'demo-lesson-1',
  levelId: 'demo-level-1',
  order: 1,
  title: 'My Favourite Things',
  subtitle: 'Tell Miss Julie about your favourites.',
  estimatedMinutes: 12,
  xpReward: 120,
  teacherIntroduction: 'Let’s talk about the things you love most.',
}

const DEMO_ACTIVITIES: ActivityItem[] = [
  {
    id: 'demo-activity-1',
    lessonId: 'demo-lesson-1',
    order: 1,
    type: 'CONVERSATION',
    stage: 'WARM_UP',
    title: 'Say your favourite food',
    prompt: 'Hi! What is your favourite food?',
    target: 'My favourite food is rice because it is tasty and filling.',
    hint: 'Try: My favourite food is ... because ...',
    difficulty: 'easy',
    xp: 20,
    estimatedSeconds: 30,
    voiceEnabled: true,
    aiEnabled: true,
    allowMic: true,
    allowOptions: true,
    modelSentence: 'My favourite food is rice because it is tasty and filling.',
    expectedPatterns: ['my favourite food', 'because'],
    keywords: ['food', 'like', 'because'],
  },
  {
    id: 'demo-activity-2',
    lessonId: 'demo-lesson-1',
    order: 2,
    type: 'OPEN_CONVERSATION',
    stage: 'INTERACT',
    title: 'Ask a follow-up question',
    prompt: 'Ask Miss Julie a question about her favourite game.',
    target: 'What is your favourite game?',
    hint: 'Use the question word What and the word favourite.',
    difficulty: 'medium',
    xp: 25,
    estimatedSeconds: 40,
    voiceEnabled: true,
    aiEnabled: true,
    allowMic: true,
    allowOptions: false,
    modelSentence: 'What is your favourite game?',
    expectedPatterns: ['what is your favourite'],
    keywords: ['what', 'favourite', 'game'],
  },
  {
    id: 'demo-activity-3',
    lessonId: 'demo-lesson-1',
    order: 3,
    type: 'SPEAK_PROMPT',
    stage: 'FINAL_TALK',
    title: 'Share your favourite things',
    prompt: 'Tell Miss Julie about your favourite sport, food, and hobby.',
    target: 'My favourite sport is cricket because I play with my friends.',
    hint: 'Give one reason using because.',
    difficulty: 'hard',
    xp: 35,
    estimatedSeconds: 60,
    voiceEnabled: true,
    aiEnabled: true,
    allowMic: true,
    allowOptions: false,
    modelSentence: 'My favourite sport is cricket because I play with my friends.',
    expectedPatterns: ['my favourite sport', 'because'],
    keywords: ['sport', 'favourite', 'because'],
  },
]

function hasDemoData(): boolean {
  return false
}

export interface FastLessonPackage {
  grade: number
  curriculumClass: CurriculumClass
  level: LevelItem
  lesson: LessonItem
  activities: ActivityItem[]
  completedActivityIds: string[]
}

export interface NextLessonLocation {
  grade: number
  lessonId: string | null
  activityId: string | null
  unitTitle: string | null
  complete: boolean
}

export const curriculumService = {
  async getNextLesson(): Promise<NextLessonLocation> {
    return apiClient<NextLessonLocation>('/students/me/next-lesson')
  },

  async getLessonPackage(lessonId: string): Promise<FastLessonPackage> {
    return apiClient<FastLessonPackage>(`/students/me/lessons/${encodeURIComponent(lessonId)}`)
  },

  /* =======================================================
     STUDENT AUTHORITATIVE CURRICULUM

     PRIMARY API FOR:
     /student/levels
     ======================================================= */

  async getMyCurriculum(): Promise<StudentCurriculum> {
    return apiClient<StudentCurriculum>('/students/me/curriculum')
  },

  async getMyCurrentCurriculum(): Promise<StudentCurrentCurriculum> {
    return apiClient<StudentCurrentCurriculum>('/students/me/curriculum/current')
  },

  async getClasses(): Promise<CurriculumClass[]> {
    if (hasDemoData()) {
      return [DEMO_CLASS]
    }

    const items = await apiClient<CurriculumClass[]>('/classes')
    return items.map(withId)
  },

  async getClass(id: string): Promise<CurriculumClass> {
    if (hasDemoData()) {
      return DEMO_CLASS
    }

    return withId(await apiClient<CurriculumClass>(`/classes/${id}`))
  },

  async getLevels(classId: string): Promise<LevelItem[]> {
    if (hasDemoData()) {
      return [DEMO_LEVEL]
    }

    const items = await apiClient<LevelItem[]>(`/classes/${classId}/levels`)
    return items.map(withId)
  },

  async getLevel(id: string): Promise<LevelItem> {
    if (hasDemoData()) {
      return DEMO_LEVEL
    }

    return withId(await apiClient<LevelItem>(`/levels/${id}`))
  },

  async getLessons(levelId: string): Promise<LessonItem[]> {
    if (hasDemoData()) {
      return [DEMO_LESSON]
    }

    const items = await apiClient<LessonItem[]>(`/levels/${levelId}/lessons`)
    return items.map(withId)
  },

  async getLesson(id: string): Promise<LessonItem> {
    if (hasDemoData()) {
      return DEMO_LESSON
    }

    return withId(await apiClient<LessonItem>(`/lessons/${id}`))
  },

  async getActivities(lessonId: string): Promise<ActivityItem[]> {
    if (hasDemoData()) {
      return DEMO_ACTIVITIES
    }

    const items = await apiClient<ActivityItem[]>(`/lessons/${lessonId}/activities`)
    return items.map(withId)
  },

  async getActivity(id: string): Promise<ActivityItem> {
    if (hasDemoData()) {
      return DEMO_ACTIVITIES[0]
    }

    return withId(await apiClient<ActivityItem>(`/activities/${id}`))
  },
}
