import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { educatorAIService } from './educator-ai-service'

test('educator assistant sends a dashboard question to the authenticated endpoint', async () => {
  const originalFetch = globalThis.fetch
  let requestUrl = ''
  let requestBody: unknown
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestBody = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({ success: true, data: { summary: 'Two students need practice.', insights: [], actions: [], followUpSuggestions: [] } }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  try {
    const result = await educatorAIService.ask('Who needs attention?')
    assert.equal(requestUrl.endsWith('/educator/ai/chat'), true)
    assert.deepEqual(requestBody, { message: 'Who needs attention?', contextType: 'DASHBOARD' })
    assert.equal(result.summary, 'Two students need practice.')
  } finally {
    globalThis.fetch = originalFetch
  }
})
