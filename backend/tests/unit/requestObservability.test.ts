import express from 'express'
import request from 'supertest'
import { observeRequest } from '../../src/middleware/request-observability'
import { errorHandler, notFoundHandler } from '../../src/middleware/error'
import { errorCategory } from '../../src/utils/error-category'
import { ApiError } from '../../src/utils/ApiError'
import { logger } from '../../src/utils/logger'

const privateText = 'CANARY_CHILD_TEXT_48291_PRIVATE'
let entries: unknown[][]
beforeEach(() => {
  entries = []
  for (const level of ['info', 'warn', 'error'] as const) jest.spyOn(logger, level).mockImplementation((...args) => { entries.push(args) })
})
afterEach(() => jest.restoreAllMocks())
function app() {
  const server = express()
  server.use(observeRequest, express.json())
  server.post('/students/:studentId/voice', (_req, res) => { res.json({ success: true }) })
  server.get('/provider/:sessionId', () => { throw ApiError.provider(privateText) })
  server.get('/broken/:activityId', () => { throw new TypeError(privateText) })
  server.use(notFoundHandler, errorHandler)
  return server
}

test('successful requests keep duration/status/correlation and exclude raw path, query, headers and body', async () => {
  const response = await request(app()).post('/students/' + privateText + '/voice?q=' + privateText)
    .set('Authorization', 'Bearer ' + privateText).set('Referer', 'https://example.test/' + privateText)
    .set('X-Request-Id', privateText)
    .send({ pin: '48291', transcript: privateText, fullName: privateText, audioBase64: privateText }).expect(200)
  expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/)
  expect(entries).toHaveLength(1)
  expect(entries[0]).toEqual(['HTTP request completed', expect.objectContaining({
    requestId: response.headers['x-request-id'], method: 'POST', route: '/students/:studentId/voice',
    status: 200, latencyMs: expect.any(Number), aborted: false,
  })])
  expect(JSON.stringify(entries)).not.toContain(privateText)
  expect(JSON.stringify(entries)).not.toContain('48291')
})

test.each(['/provider/', '/broken/', '/unknown/'])('failure path %s does not echo private input to logs', async prefix => {
  const response = await request(app()).get(prefix + privateText + '?token=' + privateText)
  expect([404, 500, 502]).toContain(response.status)
  expect(entries.length).toBeGreaterThan(0)
  expect(JSON.stringify(entries)).not.toContain(privateText)
  expect(JSON.stringify(entries)).not.toContain('stack')
  if (prefix === '/broken/') expect(entries[0]).toEqual(['Unhandled request error', expect.objectContaining({ errorCategory: 'TypeError' })])
  if (prefix === '/unknown/') expect(response.body.error.message).toBe('Route not found')
})

test('unrecognized provider exception names and objects cannot become log data', () => {
  const error = new Error(privateText)
  error.name = privateText
  expect(errorCategory(error)).toBe('UnknownError')
  expect(errorCategory({ message: privateText, stack: privateText })).toBe('UnknownError')
  expect(errorCategory(new TypeError(privateText))).toBe('TypeError')
})
