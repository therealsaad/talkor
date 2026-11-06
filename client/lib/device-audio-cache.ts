/**
 * Keeps Miss Julie's fixed lesson clips on the device so a slow or flaky connection only pays for them once.
 *
 * Only reviewed, fixed curriculum audio belongs here. Never store a recording of a child, a transcript, or
 * feedback audio (those are per-turn and carry receipts). The key names the audio version, the clip id and a hash
 * of its exact text, so a changed line or a new audio version is a different key and an old clip is never replayed.
 *
 * The storage is injected (the browser's Cache Storage in the app) so this is unit tested without a browser, and
 * every method fails soft: a private window, a full disk or a missing API just means "not cached".
 */

export type CacheLike = {
  match(request: string): Promise<Response | undefined>
  put(request: string, response: Response): Promise<void>
  delete(request: string): Promise<boolean>
  keys(): Promise<ReadonlyArray<{ url: string }>>
}
export type CacheStorageLike = { open(name: string): Promise<CacheLike> }

const ORIGIN = 'https://device-audio.talkora.invalid/'
export const MIN_CLIP_BYTES = 256
export const MAX_CLIP_BYTES = 2 * 1024 * 1024

/** Small stable hash (FNV-1a) so a reworded line gets a new key. Not for security. */
export function textHash(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function clipKey(audioVersion: string, id: string, text: string): string {
  return `${encodeURIComponent(audioVersion)}/${encodeURIComponent(id)}/${textHash(text)}`
}

export function isCacheableClip(blob: Blob): boolean {
  return /^audio\//i.test(blob.type) && blob.size >= MIN_CLIP_BYTES && blob.size <= MAX_CLIP_BYTES
}

export function createDeviceAudioCache(
  storage: () => CacheStorageLike | undefined,
  name = 'talkora-kg-audio-v1',
) {
  const open = async (): Promise<CacheLike | null> => {
    try { return (await storage()?.open(name)) ?? null } catch { return null }
  }
  return {
    async get(key: string): Promise<Blob | null> {
      try {
        const hit = await (await open())?.match(ORIGIN + key)
        if (!hit) return null
        const blob = await hit.blob()
        return isCacheableClip(blob) ? blob : null
      } catch { return null }
    },
    async put(key: string, blob: Blob): Promise<boolean> {
      if (!isCacheableClip(blob)) return false
      try {
        const cache = await open()
        if (!cache) return false
        await cache.put(ORIGIN + key, new Response(blob, { headers: { 'Content-Type': blob.type } }))
        return true
      } catch { return false }
    },
    async has(key: string): Promise<boolean> {
      try { return Boolean(await (await open())?.match(ORIGIN + key)) } catch { return false }
    },
    /** Removes clips whose key is not in `keep`, so a new audio version does not leave old files behind. */
    async prune(keep: ReadonlySet<string>): Promise<number> {
      try {
        const cache = await open()
        if (!cache) return 0
        let removed = 0
        for (const request of await cache.keys()) {
          if (!request.url.startsWith(ORIGIN) || keep.has(request.url.slice(ORIGIN.length))) continue
          if (await cache.delete(request.url)) removed += 1
        }
        return removed
      } catch { return 0 }
    },
  }
}

/** True when the browser asked us to save data or the link is very slow: skip background downloads then. */
export function shouldSkipBackgroundDownload(connection?: { saveData?: boolean; effectiveType?: string }): boolean {
  if (!connection) return false
  return connection.saveData === true || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
}
