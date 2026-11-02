import { createApp } from './app'
import { connectDatabase, gracefulShutdown } from './config/db'
import { env } from './config/env'
import { logger } from './utils/logger'
import { prepareSharedRateLimitStore } from './middleware/mongo-rate-limit-store'
import { KGFeedbackAudioService } from './services/kg-feedback-audio.service'

async function main() {
  await connectDatabase()
  // Production must not serve requests with local/uninitialized limiter data.
  // This also fails startup if MongoDB cannot create/read the shared TTL index.
  await prepareSharedRateLimitStore()

  const app = createApp()
  const server = app.listen(env.port, () => {
    logger.info(`Talkora backend listening on port ${env.port}`, { nodeEnv: env.nodeEnv })
    // Opt-in: voice every fixed KG feedback line once in the background so a child's first turn is a memory hit.
    // Costs one short Azure request per distinct line at each boot, so it is off unless asked for.
    if (process.env.KG_FEEDBACK_PREWARM === 'true' && env.azureSpeechKey) {
      void KGFeedbackAudioService.prewarm()
        .then((result) => logger.info('KG feedback audio prewarmed', result))
        .catch((err) => logger.warn('KG feedback audio prewarm failed', { err: err instanceof Error ? err.message : err }))
    }
  })
  const cleanup = async (signal: string) => {
    server.close(() => {
      logger.info('HTTP server closed')
    })
    await gracefulShutdown(signal)
  }

  process.on('SIGINT', () => cleanup('SIGINT'))
  process.on('SIGTERM', () => cleanup('SIGTERM'))
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason })
  })

  return server
}

main().catch((err) => {
  logger.error('Fatal error during startup', { err: err instanceof Error ? err.message : err })
  process.exit(1)
})
