import { apiClient } from '@/lib/api-client'

export type EditorLevelStatus = 'NOT_MAPPED' | 'DRAFT' | 'INCOMPLETE' | 'PUBLISHED' | 'ARCHIVED'
export interface EditorMappedLesson {
  id: string
  title: string
  order: number
  status: 'active' | 'draft'
  activityCount: number
  placeholder: boolean
}
export interface EditorMappedLevel {
  address: string
  grade: number
  level: number
  plannedTitle: string
  objective: string
  skills: string[]
  syllabusReviewRequired: boolean
  classId: string | null
  levelId: string | null
  actualTitle: string | null
  version: string | null
  status: EditorLevelStatus
  publication: 'PUBLISHED' | 'UPCOMING' | 'ARCHIVED'
  lessons: EditorMappedLesson[]
}
export interface EditorStudioDesign {
  id: string
  grade: number
  level: number
  title: string
  designTheme: string
  editorialStatus: string
  readyForPublication: boolean
}
export interface GradeLevelMap {
  grade: number
  name: string
  classId: string | null
  classStatus: 'active' | 'draft' | 'NOT_MAPPED'
  total: 10
  mappedCount: number
  publishedCount: number
  levels: EditorMappedLevel[]
  note: string
}
/** Shared API used by the existing school dashboard. No per-grade hard-coded routes. */
export const gradeLevelMapService = {
  grades: () => apiClient<Array<{ grade: number; title: string; levels: 10 }>>('/curriculum-map/grades'),
  grade: (grade: number) => apiClient<GradeLevelMap>(`/curriculum-map/grades/${grade}`),
  level: (grade: number, level: number) => apiClient<EditorMappedLevel>(`/curriculum-map/grades/${grade}/levels/${level}`),
  studio: (grade: number, level: number) => apiClient<EditorStudioDesign>(`/curriculum-map/grades/${grade}/levels/${level}/studio`),
}
