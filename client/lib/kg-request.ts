/** Bounded KG retries retain the same submission body and ID. */
export async function kgRequest<T>(operation: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal,
  options: { retries?: number; timeoutMs?: number; delayMs?: number } = {}): Promise<T> {
  const retries = options.retries ?? 2
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted()
    const controller = new AbortController()
    const abort = () => controller.abort(signal?.reason)
    signal?.addEventListener('abort', abort, { once: true })
    const clock = setTimeout(() => controller.abort(new DOMException('Speech request timed out', 'TimeoutError')), options.timeoutMs ?? 25000)
    try { return await operation(controller.signal) }
    catch (error) {
      signal?.throwIfAborted()
      const failure = error as { status?: number; details?: { retryable?: boolean }; name?: string }
      const retryable = failure instanceof TypeError || failure.name === 'TimeoutError' || controller.signal.aborted ||
        [429, 500, 502, 503, 504].includes(failure.status || 0) || (failure.status === 409 && failure.details?.retryable)
      if (!retryable || attempt >= retries) throw error
    } finally {
      clearTimeout(clock)
      signal?.removeEventListener('abort', abort)
    }
    await new Promise<void>((resolve, reject) => {
      const cancel = () => { clearTimeout(timer); reject(signal?.reason || new DOMException('Cancelled', 'AbortError')) }
      const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve() }, (options.delayMs ?? 600) * (attempt + 1))
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) { signal.removeEventListener('abort', cancel); cancel() }
    })
  }
}
