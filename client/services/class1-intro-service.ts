import { apiClient, getStoredToken } from '@/lib/api-client'

let pending: { token: string; lessonId: string; request: Promise<{ playbackId: string }> } | null = null
const owners = new Map<string, { token: string; lessonId: string }>()

export function beginFirstDayIntro(lessonId: string): Promise<{ playbackId: string }> {
  const token = getStoredToken()
  if (!token || !/^[a-f0-9]{24}$/i.test(lessonId)) return Promise.reject(new Error('Sign in to open your lesson story.'))
  if (pending?.token === token && pending.lessonId === lessonId) return pending.request
  const request = apiClient<{ playbackId: string }>('/voice/first-day/intro/start', {
    method: 'POST', signal: AbortSignal.timeout(8_000), body: JSON.stringify({ lessonId }),
  }).then(result => {
    if (getStoredToken() !== token) throw new Error('Story response belongs to a previous login')
    if (!/^[a-f0-9]{64}$/.test(result.playbackId)) throw new Error('The story could not start. Please try again.')
    owners.set(result.playbackId, { token, lessonId })
    if (owners.size > 4) owners.delete(owners.keys().next().value!)
    return result
  }).finally(() => { if (pending?.request === request) pending = null })
  pending = { token, lessonId, request }
  return request
}

export async function completeFirstDayIntro(lessonId: string, playbackId: string): Promise<void> {
  const owner = owners.get(playbackId)
  if (!owner || owner.token !== getStoredToken() || owner.lessonId !== lessonId) throw new Error('Please watch the complete story for your own login.')
  await apiClient('/voice/first-day/intro/complete', { method: 'POST', signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({ lessonId, playbackId, videoEnded: true }) })
  if (getStoredToken() !== owner.token) throw new Error('Story response belongs to a previous login')
  owners.delete(playbackId)
}
