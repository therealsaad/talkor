import { S3Service } from './S3Service'

/**
 * Immutable, version-addressed KG MP3 lines; a small per-worker cache avoids
 * fetching the identical teaching clip from S3 for every learner in a lab.
 * Authentication is enforced in the controller before this function runs.
 */
const MAX_ENTRIES = 48
const MAX_CACHED_BYTES = 20 * 1024 * 1024
const MAX_SINGLE_CLIP = 2 * 1024 * 1024
const cache = new Map<string, Promise<Buffer | null>>()
let cachedBytes = 0
const sizes = new Map<string, number>()

function evict(key: string) {
  cache.delete(key)
  const bytes = sizes.get(key) || 0
  cachedBytes = Math.max(0, cachedBytes - bytes)
  sizes.delete(key)
}

/** Test/process-lifecycle hook; production callers normally retain the bounded LRU. */
export function clearKGStaticAudioCache() {
  cache.clear()
  sizes.clear()
  cachedBytes = 0
}

export async function getKGStaticAudio(key: string): Promise<Buffer | null> {
  const old = cache.get(key)
  if (old) {
    cache.delete(key); cache.set(key, old) // LRU order
    return old
  }
  let pending: Promise<Buffer | null>
  pending = S3Service.getAudio(key).then((bytes) => {
    if (!bytes || bytes.length > MAX_SINGLE_CLIP) {
      evict(key)
      return bytes
    }
    if (cache.get(key) === pending) {
      cachedBytes += bytes.length
      sizes.set(key, bytes.length)
      while (cache.size > MAX_ENTRIES || cachedBytes > MAX_CACHED_BYTES) {
        const oldest = cache.keys().next().value
        if (!oldest) break
        evict(oldest)
      }
    }
    return bytes
  }).catch((error) => {
    if (cache.get(key) === pending) evict(key)
    throw error
  })
  cache.set(key, pending)
  return pending
}
