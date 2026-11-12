import type { Response } from 'express'
import type { VoiceStreamResult } from '../providers/voice/VoiceProvider'

/** Delivers synthesized audio until finished or the *response* disconnects.
 * An incoming POST request's 'close' is NOT a browser playback disconnect.
 * Preserve backpressure for slower school-network connections.
 */
export async function writeVoiceResponseStream(res: Response, stream: VoiceStreamResult): Promise<void> {
  const reader = stream.body.getReader()
  const onDisconnected = () => {
    if (!res.writableEnded) void reader.cancel().catch(() => undefined)
  }
  res.once('close', onDisconnected)
  try {
    while (!res.destroyed) {
      const next = await reader.read()
      if (next.done || res.destroyed) break
      if (!res.write(Buffer.from(next.value))) {
        await new Promise<void>(resolve => {
          const done = () => {
            res.off('drain', done)
            res.off('close', done)
            resolve()
          }
          res.once('drain', done)
          res.once('close', done)
        })
      }
    }
    if (!res.destroyed && !res.writableEnded) res.end()
  } finally {
    res.off('close', onDisconnected)
    reader.releaseLock()
  }
}
