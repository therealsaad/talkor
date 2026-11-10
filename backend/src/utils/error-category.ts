const categories = new Set([
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'AbortError', 'TimeoutError',
  'ZodError', 'ApiError', 'MongoServerError', 'MongoNetworkError', 'ValidationError', 'CastError',
])

/** Exception messages/stacks may contain provider echoes or child input. */
export function errorCategory(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
  return typeof name === 'string' && categories.has(name) ? name : 'UnknownError'
}
