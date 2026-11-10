import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './config/env'
import { buildCorsOptions } from './config/cors-options'
import routes from './routes'
import { errorHandler, notFoundHandler } from './middleware/error'
import { generalLimiter } from './middleware/rateLimit'
import { observeRequest } from './middleware/request-observability'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(observeRequest)
  app.use(helmet())
  app.use(cors(buildCorsOptions({ clientUrl: env.clientUrl, extraClientUrls: process.env.CLIENT_URLS, isProd: env.isProd })))
  // Base64 audio is bounded at the voice route; allow its encoded payload through Express.
  app.use(express.json({ limit: '12mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(generalLimiter)

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'talkora-backend' }))

  app.use('/api/v1', routes)
  app.use('/api', routes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
