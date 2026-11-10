import { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError'
import { logger } from '../utils/logger'
import { requestRoute } from './request-observability'
import { errorCategory } from '../utils/error-category'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound('Route not found'))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error('Request failed', { code: err.code, route: requestRoute(req), requestId: res.locals.requestId })
    }
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  // Mongoose duplicate key error
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record with these unique fields already exists' },
    })
  }

  // Mongoose validation error
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: (err as Error).message },
    })
  }

  logger.error('Unhandled request error', { errorCategory: errorCategory(err), route: requestRoute(req), requestId: res.locals.requestId })
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  })
}
