import { apiClient, getStoredToken } from '@/lib/api-client'

type IntroTicket = { playbackId: string }
type TicketCacheEntry = { token: string; lessonId: string; result: IntroTicket; expiresAt: number }

const TICKET_CACHE_TTL_MS = 2 * 60 * 60_000 - 30_000
const pending = new Map<string, Promise<IntroTicket>>()
const successful = new Map<string, TicketCacheEntry>()
const owners = new Map<string, { token: string; lessonId: string }>()

function visitKey(token: string, lessonId: string) {
  return `${token}:${lessonId}`
}

/**
 * Reuse a successful server ticket across intro component remounts. The
 * server's visit is valid for two hours; keep a small safety margin locally.
 * Explicit video retries request a fresh ticket because the server replaces
 * the previous visit ticket on every start call.
 */
export function beginFirstDayIntro(
  lessonId: string,
  options: { forceNew?: boolean } = {},
): Promise<IntroTicket> {
  const token = getStoredToken()
  if (!token || !/^[a-f0-9]{24}$/i.test(lessonId)) {
    return Promise.reject(new Error('Sign in to open your lesson story.'))
  }

  const key = visitKey(token, lessonId)
  const cached = successful.get(key)
  if (!options.forceNew && cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.result)
  }
  if (cached) successful.delete(key)

  const inFlight = pending.get(key)
  if (inFlight) return inFlight

  const request = apiClient<IntroTicket>('/voice/first-day/intro/start', {
    method: 'POST',
    signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({ lessonId }),
  }).then(result => {
    if (getStoredToken() !== token) throw new Error('Story response belongs to a previous login')
    if (!/^[a-f0-9]{64}$/.test(result.playbackId)) {
      throw new Error('The story could not start. Please try again.')
    }
    owners.set(result.playbackId, { token, lessonId })
    if (owners.size > 8) owners.delete(owners.keys().next().value!)
    successful.set(key, { token, lessonId, result, expiresAt: Date.now() + TICKET_CACHE_TTL_MS })
    if (successful.size > 8) successful.delete(successful.keys().next().value!)
    return result
  }).finally(() => {
    if (pending.get(key) === request) pending.delete(key)
  })

  pending.set(key, request)
  return request
}

export async function completeFirstDayIntro(lessonId: string, playbackId: string): Promise<void> {
  const owner = owners.get(playbackId)
  if (!owner || owner.token !== getStoredToken() || owner.lessonId !== lessonId) {
    throw new Error('Please watch the complete story for your own login.')
  }
  await apiClient('/voice/first-day/intro/complete', {
    method: 'POST',
    signal: AbortSignal.timeout(8_000),
    body: JSON.stringify({ lessonId, playbackId, videoEnded: true }),
  })
  if (getStoredToken() !== owner.token) throw new Error('Story response belongs to a previous login')
  successful.delete(visitKey(owner.token, lessonId))
  owners.delete(playbackId)
}
