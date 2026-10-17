import type { ActivityStage, ActivityType } from '../models/Activity'

/** School-editable starter curriculum content; not an approved textbook syllabus. */
export interface StarterUnit {
  title: string
  world: string
  description: string
  words: [string, string, string, string]
  sentence: string
  question: string
  example: string
  homework: string
}

export interface KGVocabularyWord {
  word: string
  hindi: string
  assetKey: string
  audio: { delivery: 'RUNTIME_TTS'; prerecordedStatus: 'NOT_CREATED' }
}

/** A source-level activity plan compatible with the shared Activity model. */
export interface KGActivityPlan {
  activityKey: string
  curriculumVersion: string
  grade: 0
  term: 1 | 2
  unitNumber: number
  type: ActivityType
  stage: ActivityStage
  core: boolean
  required: boolean
  title: string
  prompt: string
  instruction?: string
  order: number
  target?: string
  teacherPrompt?: string
  modelSentence?: string
  expectedPatterns: string[]
  keywords: string[]
  hint?: string
  content?: Record<string, unknown>
  choices?: string[]
  answer?: string
  difficulty: 'easy' | 'medium' | 'hard'
  xp: number
  estimatedSeconds: number
  voiceEnabled: boolean
  aiEnabled: boolean
  allowMic: boolean
  allowOptions: boolean
  repeatRequired: boolean
  maxConversationTurns: number
  conversationGoal?: { requiredConcepts: string[]; minTurns: number; maxTurns: number }
  source: { sourceType: 'ENRICHMENT'; label: string }
  metadata: Record<string, unknown>
  status: 'draft'
}

export interface KGLessonPlan {
  lessonKey: string
  status: 'draft'
  title: string
  subtitle: string
  order: number
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedMinutes: number
  teacherIntroduction: string
  learningObjectives: string[]
  newWords: string[]
  reviewWords: string[]
  modelSentence: string
  conversationQuestion: string
  conversationModel: string
  homework: string
  activities: KGActivityPlan[]
  settings: {
    foundation: true
    languageSupport: 'hi-en'
    pilotStatus: 'PILOT_UNAPPROVED'
    schoolSyllabusApproved: false
    visualAssetStatus: 'MISSING'
    introVideoStatus: 'NOT_CREATED'
    learningObjectives: string[]
  }
}

export interface KGCurriculumUnit extends StarterUnit {
  grade: 0
  term: 1 | 2
  unitNumber: number
  curriculumVersion: 'talkora-kg-foundation-pilot-v1'
  pilotStatus: 'PILOT_UNAPPROVED'
  schoolSyllabusApproved: false
  publication: { availability: 'UPCOMING'; status: 'draft' }
  learningObjectives: string[]
  vocabulary: KGVocabularyWord[]
  reviewWords: string[]
  lessons: KGLessonPlan[]
  visualAssets: Array<{
    assetKey: string
    kind: 'PICTURE_ILLUSTRATION'
    altText: string
    status: 'MISSING'
    url?: never
  }>
  introVideo: {
    status: 'NOT_CREATED'
    plannedDurationSeconds: number
    approvedCharacter: 'MISS_JULIE_NEUTRAL'
    characterReference: 'talkora-client/public/miss-julie/miss-julie-character-sheet.png'
    storyboard: string[]
  }
}

