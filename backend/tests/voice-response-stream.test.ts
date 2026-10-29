import { EventEmitter } from 'node:events'
import type { Response as ExpressResponse } from 'express'
import { expect, test } from '@jest/globals'
import { writeVoiceResponseStream } from '../src/services/voice-response-stream'

class FakeResponse extends EventEmitter {
  destroyed = false
  writableEnded = false
  chunks: Buffer[] = []
  write(data: Buffer): boolean { this.chunks.push(Buffer.from(data)); return true }
  end(): void { this.writableEnded = true; this.emit('finish') }
}

test('writes the entire synthesized audio response, never truncating after POST upload', async () => {
  const res = new FakeResponse()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([73, 68, 51, 1]))
      controller.enqueue(new Uint8Array([2, 3, 4, 5]))
      controller.close()
    },
  })
  await writeVoiceResponseStream(res as unknown as ExpressResponse, {
    body, contentType: 'audio/mpeg', provider: 'azure-neerja',
  })
  expect(Buffer.concat(res.chunks)).toEqual(Buffer.from([73, 68, 51, 1, 2, 3, 4, 5]))
  expect(res.writableEnded).toBe(true)
})

test('cancels upstream synthesis stream when browser response disconnects', async () => {
  let cancelled = false
  const res = new FakeResponse()
  const body = new ReadableStream<Uint8Array>({
    cancel() { cancelled = true },
  })
  const streaming = writeVoiceResponseStream(res as unknown as ExpressResponse, {
    body, contentType: 'audio/mpeg', provider: 'azure-neerja',
  })
  res.destroyed = true
  res.emit('close')
  await streaming
  expect(cancelled).toBe(true)
  expect(res.writableEnded).toBe(false)
})
