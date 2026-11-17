import { apiClient, getStoredToken } from '@/lib/api-client'

const studentRoutes = new Set([
  '/student/kg', '/student/kg/level-2', '/student/kg/level-3',
  '/student/kg/level-4', '/student/kg/level-5', '/student/kg/map',
])
let pending: { token: string; request: Promise<string> } | null = null

/** Share concurrent reads for one login, never cache completed progress. */
export function nextKGStudentRoute(): Promise<string> {
  const token = getStoredToken()
  if (!token) return Promise.reject(new Error('Please sign in to open your lesson.'))
  if (pending?.token === token) return pending.request
  const request = apiClient<{ nextStudentRoute: string }>('/kg-continuation/overview', {
    cache: 'no-store', signal: AbortSignal.timeout(8_000),
  }).then((state) => {
    if (getStoredToken() !== token) throw new Error('Lesson response belongs to a previous login')
    if (!studentRoutes.has(state.nextStudentRoute)) throw new Error('Your next lesson could not open. Please try again or ask your teacher.')
    return state.nextStudentRoute
  }).finally(() => {
    if (pending?.request === request) pending = null
  })
  pending = { token, request }
  return request
}
