import {
  apiClient,
  setStoredToken,
  setStoredUser,
  clearStoredToken,
  getStoredUser,
  getStoredToken,
  ApiError,
} from '@/lib/api-client'

export interface AuthSession {
  token: string
  role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'
  user?: {
    id: string
    name: string
    code?: string
    email?: string
    role: string
  }
  student?: {
    id: string
    fullName: string
    rollNumber?: string
    grade: number
    className?: string
    studentCode?: string
    avatar?: string
    avatarType: 'BOY' | 'GIRL'
  }
  school?: {
    id: string
    name: string
    code: string
  }
}

export interface StudentProfileOption {
  id: string
  fullName: string
  grade: number
  className?: string
  avatar?: string
  avatarType: 'BOY' | 'GIRL'
}

export interface StudentRosterResponse {
  school: {
    id: string
    name: string
    code: string
  }
  students: StudentProfileOption[]
  filters: {
    grades: number[]
    classes: Array<{
      grade: number
      className: string
      count: number
    }>
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

let getMeInFlight: Promise<AuthSession | null> | null = null

function buildSchoolSession(data: {
  token: string
  school: any
}): AuthSession {
  const school = { ...data.school, id: String(data.school.id ?? data.school._id) }
  return {
    token: data.token,
    role: 'SCHOOL_ADMIN',
    user: {
      id: school.id,
      name: school.name,
      code: school.code,
      role: 'SCHOOL_ADMIN',
    },
    school,
  }
}

function buildTeacherSession(data: {
  token: string
  teacher: any
  school: any
}): AuthSession {
  const teacher = { ...data.teacher, id: String(data.teacher.id ?? data.teacher._id) }
  const school = { ...data.school, id: String(data.school.id ?? data.school._id) }
  return {
    token: data.token,
    role: 'TEACHER',
    user: {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      role: 'TEACHER',
    },
    school,
  }
}

function buildStudentSession(data: {
  token: string
  student: any
  school: any
}): AuthSession {
  const student = { ...data.student, id: String(data.student.id ?? data.student._id) }
  const school = { ...data.school, id: String(data.school.id ?? data.school._id) }
  return {
    token: data.token,
    role: 'STUDENT',
    student,
    school,
  }
}

export const authService = {
  async loginSchool(
    schoolCode: string,
    password: string,
  ): Promise<AuthSession> {
    const data = await apiClient<{
      token: string
      school: any
    }>('/auth/school/login', {
      method: 'POST',
      body: JSON.stringify({
        schoolCode,
        password,
      }),
    })

    const session = buildSchoolSession(data)
    setStoredToken(data.token)
    setStoredUser(session)
    return session
  },

  async loginTeacher(
    schoolCode: string,
    email: string,
    password: string,
  ): Promise<AuthSession> {
    const data = await apiClient<{
      token: string
      teacher: any
      school: any
    }>('/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify({
        schoolCode,
        email,
        password,
      }),
    })

    const session = buildTeacherSession(data)
    setStoredToken(data.token)
    setStoredUser(session)
    return session
  },

  async lookupStudents(
    schoolCode: string,
    filters: {
      grade?: number
      className?: string
      q?: string
      page?: number
      limit?: number
    } = {},
  ): Promise<StudentRosterResponse> {
    return apiClient<StudentRosterResponse>(
      '/auth/student/school',
      {
        method: 'POST',
        body: JSON.stringify({
          schoolCode,
          ...filters,
          limit: Math.min(
            filters.limit ?? 24,
            24,
          ),
        }),
      },
    )
  },

  async loginStudentByPin(pin: string): Promise<AuthSession> {
    const data = await apiClient<{ token: string; student: any; school: any }>('/auth/student/pin-login', { method: 'POST', body: JSON.stringify({ pin }) })
    const session = buildStudentSession(data)
    setStoredToken(data.token, true)
    setStoredUser(session)
    return session
  },

  async loginStudent(
    schoolCode: string,
    studentId: string,
    studentCode: string,
  ): Promise<AuthSession> {
    const data = await apiClient<{
      token: string
      student: any
      school: any
    }>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({
        schoolCode,
        studentId,
        studentCode,
      }),
    })

    const session = buildStudentSession(data)
    setStoredToken(data.token, true)
    setStoredUser(session)
    return session
  },

  getMe(): Promise<AuthSession | null> {
    if (getMeInFlight) return getMeInFlight
    getMeInFlight = this.loadCurrentSession().finally(() => {
      getMeInFlight = null
    })
    return getMeInFlight
  },

  async loadCurrentSession(): Promise<AuthSession | null> {
    const token = getStoredToken()

    // IMPORTANT: no token means NOT AUTHENTICATED.
    // Never create a fake/demo student session here.
    if (!token) {
      clearStoredToken()
      return null
    }

    try {
      const data = await apiClient<{
        role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT'
        student?: any
        school?: any
        teacher?: any
      }>('/auth/me', { signal: AbortSignal.timeout(8_000) })

      const session = data.role === 'STUDENT'
        ? buildStudentSession({ token, student: data.student, school: data.school })
        : data.role === 'TEACHER'
          ? buildTeacherSession({ token, teacher: data.teacher, school: data.school })
          : buildSchoolSession({ token, school: data.school })

      setStoredUser(session)
      return session
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearStoredToken()
        return null
      }

      // A temporary network/server failure is not proof that the JWT is invalid.
      throw error
    }
  },

  async updateStudentAvatar(avatar: string, avatarType: 'BOY' | 'GIRL'): Promise<void> {
    await apiClient('/students/me/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar, avatarType }),
    })
  },

  getCurrentSession(): AuthSession | null {
    return getStoredUser<AuthSession>()
  },

  async logout(): Promise<void> {
    try {
      if (getStoredToken()) {
        await apiClient('/auth/logout', {
          method: 'POST',
        })
      }
    } catch {
      // Local cleanup still has to happen even if the server is offline.
    } finally {
      clearStoredToken()
    }
  },
}
