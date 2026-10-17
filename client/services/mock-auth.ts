export const DEMO_SCHOOL_CODE = 'DEMO001'
export const DEMO_SCHOOL_PASSWORD = 'talkora123'

export function setSelectedStudent(id: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem('talkora:selectedStudent', id)
}

export function getSelectedStudentId() {
  return typeof window === 'undefined' ? 'aanya' : sessionStorage.getItem('talkora:selectedStudent') || 'aanya'
}

export function getStudents() {
  if (typeof window === 'undefined') return []
  const saved = sessionStorage.getItem('talkora:students')
  return saved ? JSON.parse(saved) : null
}

export function saveStudents(value: unknown[]) {
  sessionStorage.setItem('talkora:students', JSON.stringify(value))
}

export function createId() {
  return `student-${Date.now()}`
}
