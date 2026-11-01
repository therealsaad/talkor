/**
 * Hard deadline for a slow collaborator (Qwen). A child must never wait in
 * silence: when the deadline passes, the caller gets its canned fallback and the
 * slow request is aborted so it stops consuming the GPU for a reply nobody hears.
 *
 * Pure and dependency-free; unit tested without a network.
 */

export type DeadlineSource = 'work' | 'timeout' | 'error'
export type DeadlineResult<T> = { value: T; source: DeadlineSource; elapsedMs: number }

export const DEFAULT_QWEN_DEADLINE_MS = 1500
const MIN_DEADLINE_MS = 500
const MAX_DEADLINE_MS = 5000

/** Reads KG_QWEN_TIMEOUT_MS style values; invalid input falls back to the default. */
export function resolveDeadlineMs(raw: string | undefined, fallback = DEFAULT_QWEN_DEADLINE_MS): number {
  const parsed = Number(raw)
  if (!raw || !Number.isFinite(parsed)) return fallback
  return Math.min(MAX_DEADLINE_MS, Math.max(MIN_DEADLINE_MS, Math.round(parsed)))
}

export async function withDeadline<T>(
  work: (signal: AbortSignal) => Promise<T>,
  deadlineMs: number,
  fallback: () => T,
  now: () => number = Date.now,
): Promise<DeadlineResult<T>> {
  const startedAt = now()
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<DeadlineResult<T>>((resolve) => {
    timer = setTimeout(() => {
      controller.abort()
      resolve({ value: fallback(), source: 'timeout', elapsedMs: now() - startedAt })
    }, deadlineMs)
  })

  const run = (async (): Promise<DeadlineResult<T>> => {
    try {
      const value = await work(controller.signal)
      return { value, source: 'work', elapsedMs: now() - startedAt }
    } catch {
      return { value: fallback(), source: 'error', elapsedMs: now() - startedAt }
    }
  })()

  try {
    return await Promise.race([run, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
