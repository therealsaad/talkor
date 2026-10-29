import { apiClient, apiClientBlob } from '@/lib/api-client'
export interface StudentListItem {
  id: string
  teacherId?: string
  fullName: string
  rollNumber: string
  studentCode: string
  grade: number
  kgAlphabetPilotEnabled?: boolean
  className?: string
  avatar?: string
  avatarType: 'BOY' | 'GIRL'
  status: 'active' | 'inactive'
  progress?: {
    accuracy: number
    attemptCount?: number
    completedLevels: number
    totalLevels?: number
    completedLessons?: number
    completedActivities?: number
    totalXp: number
    learningTimeMinutes: number
    streak: number
  }
}

export interface StudentDetail extends StudentListItem {
  createdAt: string
  updatedAt: string
homePractice?: {
  unitKey?: string
  reflection: string
  submittedAt: string
  hasAudio?: boolean
} | null
  recentAttempts?: Array<{
    activityId: string
    answer: string
    correct: boolean
    timeTakenSeconds: number
    speakingAccuracy?: number
    score?: number
    createdAt: string
  }>
  memories?: Array<{
    category: string
    fact: string
    confidence: number
  }>
  mistakes?: Array<{
    type: string
    target: string
    userInput: string
    frequency: number
  }>
  weakSkills?: string[]
  strongSkills?: string[]
  aiRecommendation?: string
}

export interface SchoolOverview {
  school?: {
    id: string
    name: string
    code: string
    location?: string
  }
  studentCount: number
  activeStudentCount: number
  teacherCount: number
  averageProgress: number
  totalLearningMinutes: number
  totalXp?: number
}

export interface AnalyticsOverview {
  totalAttempts: number
  avgAccuracy: number
  totalLearningTimeMinutes: number
  activeTodayCount: number
  gradeBreakdown: Array<{
    grade: number
    studentCount: number
    attemptedStudentCount: number
    avgAccuracy: number
    avgLevelsCompleted: number
  }>
  studentsNeedingAttention?: Array<{ studentId: string; fullName: string; grade: number; className?: string; accuracy: number; completedLevels: number; attempts: number; xp: number }>
}

export const schoolService = {
  async listTeachers(): Promise<Array<{ id: string; name: string; email: string; status: 'active' | 'suspended'; createdAt: string }>> {
    const teachers = await apiClient<Array<{ id?: string; _id?: string; name: string; email: string; status: 'active' | 'suspended'; createdAt: string }>>('/teachers')
    return teachers.map((teacher) => ({ ...teacher, id: teacher.id || teacher._id || '' }))
  },
  async createTeacher(data: { name: string; email: string; password: string }): Promise<{ id: string; name: string; email: string }> { return apiClient('/teachers', { method: 'POST', body: JSON.stringify(data) }) },
  async getOverview(): Promise<SchoolOverview> {
    return apiClient<SchoolOverview>('/schools/overview')
  },

  async listStudents(params?: {
    grade?: number
    className?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ students: StudentListItem[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams()
    if (params?.grade !== undefined) query.set('grade', String(params.grade))
    if (params?.className) query.set('className', params.className)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))

    const qs = query.toString()
    return apiClient(`/students${qs ? `?${qs}` : ''}`)
  },

  async getStudent(id: string): Promise<StudentDetail> {
    return apiClient<StudentDetail>(`/students/${id}`)
    
  },
  async getHomePracticeAudio(id: string, unit: 'favourites' | 'class1-first-day' = 'favourites'): Promise<Blob> {
  return apiClientBlob(
    `/students/${encodeURIComponent(id)}/home-practice/${unit}/audio`
  )
},

  async createStudent(data: {
    fullName: string
    rollNumber: string
    grade: number
    className?: string
    teacherId?: string
    studentCode?: string
    kgAlphabetPilotEnabled?: boolean
    avatarType: 'BOY' | 'GIRL'
  }): Promise<{ student: StudentListItem; studentCode: string }> {
    return apiClient<{ student: StudentListItem; studentCode: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateStudent(
    id: string,
    data: {
      fullName?: string
      rollNumber?: string
      grade?: number
      className?: string
      teacherId?: string
      status?: 'active' | 'inactive'
      avatarType?: 'BOY' | 'GIRL'
    }
  ): Promise<StudentListItem> {
    return apiClient<StudentListItem>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteStudent(id: string): Promise<{ success: boolean }> {
    return apiClient(`/students/${id}`, {
      method: 'DELETE',
    })
  },

  async setKGAlphabetPilot(id: string, enabled: boolean): Promise<{ studentId: string; enabled: boolean }> {
    return apiClient(`/students/${encodeURIComponent(id)}/kg-alphabet-pilot`, {
      method: 'PATCH', body: JSON.stringify({ enabled }),
    })
  },

  async resetCode(id: string): Promise<{ studentCode: string }> {
    return apiClient(`/students/${id}/reset-code`, {
      method: 'POST',
    })
  },

  async deactivateStudent(id: string): Promise<{ status: string }> {
    return apiClient(`/students/${id}/deactivate`, {
      method: 'POST',
    })
  },

  async getAnalytics(): Promise<AnalyticsOverview> {
    return apiClient<AnalyticsOverview>('/analytics/overview')
  },

  async getWeakestSkills(): Promise<any> {
    return apiClient('/analytics/weakest-skills')
  },
}
