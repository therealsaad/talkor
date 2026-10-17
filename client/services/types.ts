export type Role = 'school' | 'teacher' | 'student'
export type ActivityType = 'mcq' | 'pictureChoice' | 'matching' | 'spelling' | 'listenAndChoose' | 'listenAndRepeat' | 'sentenceBuilder' | 'fillBlank' | 'reading' | 'pronunciation' | 'speaking' | 'conversation' | 'review' | 'assessment'
export type LessonStatus = 'locked' | 'available' | 'in-progress' | 'complete'

export interface TalkoraClass { id: string; grade: number; name: string; levelIds: string[] }
export interface TalkoraLevel { id: string; classId: string; number: number; title: string; place: string; status: LessonStatus; description: string; lessonIds: string[] }
export interface LessonActivity { id: string; lessonId: string; type: ActivityType; title: string; prompt: string; target: string; choices?: string[]; answer?: string; hint?: string; xp: number }
export interface TalkoraLesson { id: string; levelId: string; title: string; subtitle: string; activityIds: string[]; estimatedMinutes: number }
export interface LearningProgress { studentId: string; levelId: string; vocabulary: number; grammar: number; speaking: number; pronunciation: number; accuracy: number; learningMinutes: number; streak: number; updatedAt: string }
export interface Achievement { id: string; title: string; description: string; category: 'learning' | 'speaking' | 'streak' | 'completion'; unlocked: boolean; progress: number }
export interface StudentMemory { id: string; studentId: string; category: 'vocabulary' | 'grammar' | 'pronunciation' | 'speaking'; fact: string; confidence: number; lastReinforcedAt: string }
export interface VoiceSession { id: string; studentId: string; lessonId: string; state: 'idle' | 'speaking' | 'listening' | 'processing' | 'success' | 'error'; transcript?: string; score?: number; feedback?: string; startedAt: string }
export interface AIResponse { message: string; emotion: 'welcome' | 'encouraging' | 'thinking' | 'celebrating' | 'concerned'; score?: number; corrections?: string[]; xpAwarded?: number }
export interface ActivityAttempt { activityId: string; studentId: string; answer: string; correct: boolean; timeTakenSeconds: number; createdAt: string }

export interface Repository<T> { list(): Promise<T[]>; getById(id: string): Promise<T | null> }
export interface StudentRepository extends Repository<import('./mock-data').Student> { search(query: string): Promise<import('./mock-data').Student[]> }
export interface AIProvider { respond(input: { message: string; studentId: string; lessonId?: string }): Promise<AIResponse> }
export interface SpeechProvider { speak(text: string): Promise<void>; stop(): void }
export interface TranscriptionProvider { transcribe(audio: Blob): Promise<string> }
export interface PronunciationProvider { evaluate(input: { expected: string; transcript: string }): Promise<{ score: number; feedback: string }> }
