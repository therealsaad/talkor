/**
 * Small in-memory LRU for SERVER-OWNED, reviewed feedback lines only.
 *
 * Privacy rule (README section 5): personalised Miss Julie coaching is never
 * persisted. This cache holds only the finite set of fixed lines the backend
 * itself writes (praise, "say cat", silence prompts). It is process memory, not
 * S3 or Atlas, and the caller must never insert a transcript, a name or an LLM reply.
 *
 * Concurrent requests for the same key share one synthesis call.
 */

export type FixedLineCacheOptions = { maxItems?: number; ttlMs?: number; now?: () => number }

export function createFixedLineCache<T>(options: FixedLineCacheOptions = {}) {
  const maxItems = Math.max(1, options.maxItems ?? 128)
  const ttlMs = Math.max(1, options.ttlMs ?? 6 * 60 * 60 * 1000)
  const now = options.now ?? Date.now
  const entries = new Map<string, { value: T; expiresAt: number }>()
  const inFlight = new Map<string, Promise<T | null>>()

  function peek(key: string): T | undefined {
    const entry = entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= now()) {
      entries.delete(key)
      return undefined
    }
    // Re-insert so the most recently used entry is evicted last.
    entries.delete(key)
    entries.set(key, entry)
    return entry.value
  }

  function set(key: string, value: T): void {
    entries.delete(key)
    entries.set(key, { value, expiresAt: now() + ttlMs })
    while (entries.size > maxItems) {
      const oldest = entries.keys().next().value
      if (oldest === undefined) break
      entries.delete(oldest)
    }
  }

  /** Returns the cached value or runs `create` once for all concurrent callers. Failures are never cached. */
  async function getOrCreate(key: string, create: () => Promise<T | null>): Promise<T | null> {
    const hit = peek(key)
    if (hit !== undefined) return hit
    const pending = inFlight.get(key)
    if (pending) return pending
    const task = (async () => {
      try {
        const value = await create()
        if (value !== null && value !== undefined) set(key, value)
        return value ?? null
      } catch {
        return null
      } finally {
        inFlight.delete(key)
      }
    })()
    inFlight.set(key, task)
    return task
  }

  return { peek, set, getOrCreate, size: () => entries.size, clear: () => { entries.clear(); inFlight.clear() } }
}

export type FixedLineCache<T> = ReturnType<typeof createFixedLineCache<T>>
