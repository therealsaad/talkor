import { randomUUID } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

const areas = new Set(['auth', 'schools', 'teachers', 'students', 'classes', 'levels',
  'lessons', 'activities', 'progress', 'achievements', 'mistakes', 'memory', 'ai', 'voice',
  'kg-alphabet', 'kg-level2', 'kg-continuation', 'kg-level2-preview', 'kg-level3-preview',
  'kg-level4-preview', 'kg-level5-preview', 'curriculum-map', 'analytics', 'daily-challenges',
  'educator', 'educator-ai'])

function requestArea(req: Request): string {
  const candidate = /^\/api(?:\/v1)?\/([a-z0-9-]+)(?:\/|\?|$)/.exec(req.originalUrl)?.[1]
  return candidate && areas.has(candidate) ? candidate : 'other'
}

/** Never use originalUrl: queries, actual resource IDs and unmatched paths may
 * contain private data. Express route templates come from our checked-in code.
 */
export function requestRoute(req: Request): string {
  return typeof req.route?.path === 'string' ? req.route.path : '[unmatched]'
}

/** Request duration/correlation without IP, user agent, body, token or URL. */
export function observeRequest(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID()
  const started = process.hrtime.bigint()
  let logged = false
  res.locals.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  const record = (aborted: boolean) => {
    if (logged) return
    logged = true
    const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(req.method) ? req.method : 'OTHER'
    const meta = { requestId, method, area: requestArea(req), route: requestRoute(req), status: res.statusCode,
      latencyMs: Math.round(Number(process.hrtime.bigint() - started) / 1e4) / 100,
      aborted }
    if (aborted || res.statusCode >= 500) logger.warn('HTTP request completed', meta)
    else logger.info('HTTP request completed', meta)
  }
  res.once('finish', () => record(false))
  res.once('close', () => { if (!res.writableFinished) record(true) })
  next()
}
